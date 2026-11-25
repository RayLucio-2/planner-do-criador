// "Assinar agora e liberar tudo": encerra o teste grátis cobrando a 1ª mensalidade hoje.
// Usa o cartão salvo na assinatura (creditCardToken). Se não achar o cartão, devolve o link da fatura do Asaas.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { cors } from '../_shared/cors.ts'
import { asaas, erroAsaas } from '../_shared/asaas.ts'

const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
const maisUmMes = (d: string) => { const x = new Date(d + 'T12:00:00-03:00'); x.setMonth(x.getMonth() + 1); x.setDate(x.getDate() + 1); return x.toISOString() }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const jwt = (req.headers.get('Authorization') || '').replace('Bearer ', '')
  const { data: { user } } = await db.auth.getUser(jwt)
  if (!user) return json({ erro: 'Sessão inválida. Entre de novo.' }, 401)
  const { data: sub } = await db.from('subscriptions').select('*').eq('user_id', user.id).maybeSingle()
  if (!sub?.provider_subscription_id) return json({ erro: 'Ainda não encontramos a sua assinatura. Cadastre o cartão primeiro.' }, 409)
  if (sub.pagou_em || sub.status === 'active') return json({ ok: true, ja: true })

  // 1ª mensalidade pendente
  const l = await asaas(`/payments?subscription=${sub.provider_subscription_id}&status=PENDING&limit=10`)
  const pend = (l.ok ? (l.body?.data || []) : []).sort((a: any, b: any) => String(a.dueDate).localeCompare(String(b.dueDate)))[0]
  if (!pend) return json({ erro: 'Não encontrei a mensalidade para cobrar agora. Tente de novo em alguns minutos.' }, 409)

  // cartão salvo: na assinatura ou na própria mensalidade
  let token = ''
  const s = await asaas(`/subscriptions/${sub.provider_subscription_id}`)
  token = s.body?.creditCard?.creditCardToken || pend.creditCard?.creditCardToken || ''
  if (!token) return json({ url: pend.invoiceUrl })

  const r = await asaas(`/payments/${pend.id}/payWithCreditCard`, { method: 'POST', body: JSON.stringify({ creditCardToken: token }) })
  if (!r.ok) {
    console.error('assinar agora', JSON.stringify(r.body))
    // cartão recusado ou cobrança que não aceita o token: a pessoa paga pela fatura
    return pend.invoiceUrl ? json({ url: pend.invoiceUrl, aviso: erroAsaas(r.body) }) : json({ erro: erroAsaas(r.body) }, 400)
  }
  if (['CONFIRMED', 'RECEIVED'].includes(r.body?.status)) {
    const agora = new Date().toISOString()
    await db.from('subscriptions').update({ status: 'active', pagou_em: agora, current_period_end: maisUmMes(String(pend.dueDate).slice(0, 10)), updated_at: agora }).eq('user_id', user.id)
  }
  return json({ ok: true, status: r.body?.status })
})
