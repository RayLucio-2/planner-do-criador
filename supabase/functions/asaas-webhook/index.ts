// Recebe os avisos do Asaas: mantém a tabela subscriptions em dia e entrega o PDF vendido.
// Segredos: ASAAS_WEBHOOK_TOKEN (o mesmo cadastrado no webhook do Asaas)
// Eventos usados: CHECKOUT_PAID, SUBSCRIPTION_CREATED/UPDATED/INACTIVATED/DELETED,
//                 PAYMENT_CONFIRMED/RECEIVED/OVERDUE/CREDIT_CARD_CAPTURE_REFUSED/REFUNDED
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { entregarPdf } from '../_shared/pdf.ts'

const ok = (b: unknown = { ok: true }) => new Response(JSON.stringify(b), { headers: { 'Content-Type': 'application/json' } })
const DIAS_TESTE = 7
const maisUmMes = (d: string) => { const x = new Date(d + 'T12:00:00-03:00'); x.setMonth(x.getMonth() + 1); x.setDate(x.getDate() + 1); return x.toISOString() }
const fimDoDia = (d: string) => new Date(String(d).slice(0, 10) + 'T23:59:59-03:00').toISOString()

Deno.serve(async (req) => {
  if (req.headers.get('asaas-access-token') !== Deno.env.get('ASAAS_WEBHOOK_TOKEN')) return new Response('não autorizado', { status: 401 })
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

  try {
    switch (ev.event) {
      case 'CHECKOUT_PAID': {
        const c = ev.checkout || {}
        const compra = await compraPdf({ checkout: c.id, ref: c.externalReference })
        if (compra) { await entregarPdf(db, compra); break }
        const sub = (await acha('checkout_id', c.id)) || (await acha('provider_customer_id', c.customer)) || (await acha('user_id', c.externalReference))
        if (!sub) { console.log('checkout sem conta', c.id, c.customer); break }
        const primeira = c.subscription?.nextDueDate ? fimDoDia(c.subscription.nextDueDate) : new Date(Date.now() + DIAS_TESTE * 864e5).toISOString()
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
        else if (sub.status === 'pendente' || sub.status === 'none') Object.assign(campos, { status: 'trialing', trial_end: s.nextDueDate ? fimDoDia(s.nextDueDate) : new Date(Date.now() + DIAS_TESTE * 864e5).toISOString() })
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
        if (sub && p.subscription) await salva(sub.user_id, { status: 'active', provider_subscription_id: p.subscription, current_period_end: maisUmMes(String(p.dueDate || agora).slice(0, 10)) })
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
