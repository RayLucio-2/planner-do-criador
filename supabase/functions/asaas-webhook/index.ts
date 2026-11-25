// Recebe os avisos do Asaas: mantém a tabela subscriptions em dia e entrega o PDF vendido.
// Segredos: ASAAS_WEBHOOK_TOKEN (o mesmo cadastrado no webhook do Asaas)
// Indique uma amiga: quando a indicada paga a 1ª mensalidade, as duas ganham 1 mês grátis
//   (a próxima mensalidade pendente de cada uma é apagada no Asaas; PAYMENT_CREATED aplica o crédito guardado).
// Eventos usados: PAYMENT_CREATED, CHECKOUT_PAID, SUBSCRIPTION_CREATED/UPDATED/INACTIVATED/DELETED,
//                 PAYMENT_CONFIRMED/RECEIVED/OVERDUE/CREDIT_CARD_CAPTURE_REFUSED/REFUNDED
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { entregarPdf } from '../_shared/pdf.ts'
import { asaas } from '../_shared/asaas.ts'

const ok = (b: unknown = { ok: true }) => new Response(JSON.stringify(b), { headers: { 'Content-Type': 'application/json' } })
const DIAS_TESTE = 7
const maisUmMes = (d: string) => { const x = new Date(d + 'T12:00:00-03:00'); x.setMonth(x.getMonth() + 1); x.setDate(x.getDate() + 1); return x.toISOString() }
const fimDoDia = (d: string) => new Date(String(d).slice(0, 10) + 'T23:59:59-03:00').toISOString()

Deno.serve(async (req) => {
  const recebido = (req.headers.get('asaas-access-token') || '').trim()
  const esperado = (Deno.env.get('ASAAS_WEBHOOK_TOKEN') || '').trim()
  if (!esperado || recebido !== esperado) {
    console.log('token do webhook não confere', { recebido: recebido.length, esperado: esperado.length })
    return new Response('não autorizado', { status: 401 })
  }
  let ev: any
  try { ev = await req.json() } catch { return ok({ ignorado: 'corpo inválido' }) }
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  // não processa o mesmo aviso duas vezes
  if (ev?.id) {
    const { error } = await db.from('webhook_eventos').insert({ id: ev.id, evento: ev.event })
    if (error?.code === '23505') return ok({ repetido: true })
  }
  const agora = new Date().toISOString()
  const acha = async (campo: string, valor?: string | null) => {
    if (!valor) return null
    const { data } = await db.from('subscriptions').select('*').eq(campo, valor).maybeSingle()
    return data
  }
  // compra do PDF (cobrança avulsa, sem assinatura)
  const compraPdf = async (o: { checkout?: string | null; payment?: string | null; ref?: string | null; customer?: string | null }) => {
    const q = (campo: string, v?: string | null) => v ? db.from('compras_pdf').select('*').eq(campo, v).order('created_at', { ascending: false }).limit(1).maybeSingle().then((r: any) => r.data) : null
    const ref = o.ref?.startsWith('pdf:') ? o.ref.slice(4) : null
    return (await q('checkout_id', o.checkout)) || (await q('payment_id', o.payment)) || (await q('id', ref)) || (await q('asaas_customer', o.customer))
  }
  const salva = (user_id: string, campos: Record<string, unknown>) =>
    db.from('subscriptions').update({ ...campos, updated_at: agora }).eq('user_id', user_id)

  // data real da 1ª cobrança: a mensalidade mais antiga da assinatura no Asaas
  // (o "nextDueDate" da assinatura já pula para o mês seguinte assim que a 1ª mensalidade é gerada)
  const primeiraCobranca = async (subId?: string | null) => {
    if (!subId) return null
    try {
      const r = await asaas(`/payments?subscription=${subId}&limit=20`)
      const ps = (r.ok ? (r.body?.data || []) : []).filter((p: any) => !p.deleted && p.dueDate).sort((a: any, b: any) => String(a.dueDate).localeCompare(String(b.dueDate)))
      return ps[0] ? fimDoDia(ps[0].dueDate) : null
    } catch { return null }
  }

  // aplica os meses grátis guardados: apaga a próxima mensalidade pendente no Asaas e estende o acesso
  const aplicaCredito = async (sub: any, pagamento?: any) => {
    if (!sub?.provider_subscription_id || !(sub.meses_gratis > 0)) return
    let pend = pagamento
    if (!pend) {
      const r = await asaas(`/payments?subscription=${sub.provider_subscription_id}&status=PENDING&limit=10`)
      pend = (r.ok ? (r.body?.data || []) : []).sort((a: any, b: any) => String(a.dueDate).localeCompare(String(b.dueDate)))[0]
    }
    if (!pend?.id || pend.status !== 'PENDING') return
    const del = await asaas(`/payments/${pend.id}`, { method: 'DELETE' })
    if (!del.ok) { console.error('não apagou a mensalidade do mês grátis', pend.id, JSON.stringify(del.body)); return }
    const fim = maisUmMes(String(pend.dueDate).slice(0, 10))
    const atual = sub.current_period_end ? new Date(sub.current_period_end).getTime() : 0
    await salva(sub.user_id, { meses_gratis: sub.meses_gratis - 1, current_period_end: new Date(Math.max(atual, new Date(fim).getTime())).toISOString() })
  }
  // 1ª mensalidade paga por quem foi indicada: prêmio para as duas
  const premiaIndicacao = async (sub: any) => {
    const { data: ind } = await db.from('indicacoes').select('*').eq('indicada', sub.user_id).eq('status', 'aguardando').maybeSingle()
    if (!ind) return
    await db.from('indicacoes').update({ status: 'premiada', premiada_em: agora }).eq('id', ind.id)
    for (const uid of [ind.indicada, ind.indicadora]) {
      const { data: s } = await db.from('subscriptions').select('*').eq('user_id', uid).maybeSingle()
      if (!s) continue
      const novo = { ...s, meses_gratis: (s.meses_gratis || 0) + 1 }
      await salva(s.user_id, { meses_gratis: novo.meses_gratis })
      try { await aplicaCredito(novo) } catch (e) { console.error('mês grátis', uid, (e as Error).message) }
    }
  }

  try {
    switch (ev.event) {
      case 'PAYMENT_CREATED': {
        const p = ev.payment || {}
        if (!p.subscription) break
        const sub = await acha('provider_subscription_id', p.subscription)
        // no teste grátis, a 1ª mensalidade criada define a data da 1ª cobrança
        if (sub?.status === 'trialing' && p.dueDate && (!sub.trial_end || new Date(fimDoDia(p.dueDate)) < new Date(sub.trial_end))) await salva(sub.user_id, { trial_end: fimDoDia(p.dueDate) })
        if (sub?.meses_gratis > 0) await aplicaCredito(sub, p)
        break
      }
      case 'CHECKOUT_PAID': {
        const c = ev.checkout || {}
        const compra = await compraPdf({ checkout: c.id, ref: c.externalReference })
        if (compra) { await entregarPdf(db, compra); break }
        const sub = (await acha('checkout_id', c.id)) || (await acha('provider_customer_id', c.customer)) || (await acha('user_id', c.externalReference))
        if (!sub) { console.log('checkout sem conta', c.id, c.customer); break }
        const primeira = (await primeiraCobranca(sub.provider_subscription_id)) || (c.subscription?.nextDueDate ? fimDoDia(c.subscription.nextDueDate) : new Date(Date.now() + DIAS_TESTE * 864e5).toISOString())
        if (sub.status !== 'active') await salva(sub.user_id, { status: 'trialing', trial_end: primeira, provider: 'asaas', provider_customer_id: c.customer || sub.provider_customer_id })
        break
      }
      case 'SUBSCRIPTION_CREATED':
      case 'SUBSCRIPTION_UPDATED': {
        const s = ev.subscription || {}
        const sub = (await acha('provider_subscription_id', s.id)) || (await acha('provider_customer_id', s.customer)) || (await acha('user_id', s.externalReference))
        if (!sub) { console.log('assinatura sem conta', s.id, s.customer); break }
        const campos: Record<string, unknown> = { provider: 'asaas', provider_subscription_id: s.id, provider_customer_id: s.customer }
        if (s.status === 'INACTIVE' || s.deleted) Object.assign(campos, { status: 'canceled', current_period_end: sub.current_period_end || sub.trial_end || agora })
        else if (sub.status === 'pendente' || sub.status === 'none' || sub.status === 'trialing') {
          const pc = await primeiraCobranca(s.id)
          if (sub.status !== 'trialing') Object.assign(campos, { status: 'trialing', trial_end: pc || (s.nextDueDate ? fimDoDia(s.nextDueDate) : new Date(Date.now() + DIAS_TESTE * 864e5).toISOString()) })
          else if (pc) campos.trial_end = pc
        }
        await salva(sub.user_id, campos)
        break
      }
      case 'SUBSCRIPTION_INACTIVATED':
      case 'SUBSCRIPTION_DELETED': {
        const s = ev.subscription || {}
        const sub = await acha('provider_subscription_id', s.id)
        if (sub && sub.status !== 'canceled') {
          const fim = [sub.current_period_end, sub.trial_end].filter(Boolean).map((d: string) => new Date(d).getTime())
          await salva(sub.user_id, { status: 'canceled', current_period_end: fim.length ? new Date(Math.max(...fim)).toISOString() : agora })
        }
        break
      }
      case 'PAYMENT_CONFIRMED':
      case 'PAYMENT_RECEIVED': {
        const p = ev.payment || {}
        if (!p.subscription) {
          const compra = await compraPdf({ checkout: p.checkoutSession, payment: p.id, ref: p.externalReference, customer: p.customer })
          if (compra) await entregarPdf(db, compra, p.id)
          break
        }
        const sub = (await acha('provider_subscription_id', p.subscription)) || (await acha('provider_customer_id', p.customer))
        if (sub && p.subscription) {
          await salva(sub.user_id, { status: 'active', provider_subscription_id: p.subscription, current_period_end: maisUmMes(String(p.dueDate || agora).slice(0, 10)), pagou_em: sub.pagou_em || agora })
          try { await premiaIndicacao(sub) } catch (e) { console.error('indicação', (e as Error).message) }
        }
        break
      }
      case 'PAYMENT_OVERDUE':
      case 'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED': {
        const p = ev.payment || {}
        const sub = await acha('provider_subscription_id', p.subscription)
        if (sub && sub.status !== 'canceled') await salva(sub.user_id, { status: 'past_due', current_period_end: fimDoDia(p.dueDate || agora) })
        break
      }
      case 'PAYMENT_REFUNDED': {
        const p = ev.payment || {}
        if (!p.subscription) {
          const compra = await compraPdf({ checkout: p.checkoutSession, payment: p.id, ref: p.externalReference, customer: p.customer })
          if (compra) await db.from('compras_pdf').update({ status: 'estornado' }).eq('id', compra.id)
          break
        }
        const sub = await acha('provider_subscription_id', p.subscription)
        if (sub) await salva(sub.user_id, { status: 'canceled', current_period_end: agora })
        break
      }
      default:
        return ok({ ignorado: ev?.event })
    }
  } catch (e) {
    console.error('erro no webhook', ev?.event, e?.message)
    if (ev?.id) await db.from('webhook_eventos').delete().eq('id', ev.id)   // deixa o Asaas tentar de novo
    return new Response('erro', { status: 500 })
  }
  return ok()
})
