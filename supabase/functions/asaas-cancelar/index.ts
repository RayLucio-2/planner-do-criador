// Cancela a assinatura da pessoa logada no Asaas. O acesso continua até o fim do período (ou do teste) já liberado.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { cors } from '../_shared/cors.ts'
import { asaas, erroAsaas } from '../_shared/asaas.ts'

const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const jwt = (req.headers.get('Authorization') || '').replace('Bearer ', '')
  const { data: { user } } = await db.auth.getUser(jwt)
  if (!user) return json({ erro: 'Sessão inválida. Entre de novo.' }, 401)
  let b: any = {}
  try { b = await req.json() } catch { /* sem corpo */ }
  const motivo = String(b.motivo || '').slice(0, 500) || null
  const { data: sub } = await db.from('subscriptions').select('*').eq('user_id', user.id).maybeSingle()
  if (!sub) return json({ erro: 'Nenhuma assinatura encontrada.' }, 404)
  if (sub.provider === 'asaas' && sub.provider_subscription_id) {
    const r = await asaas(`/subscriptions/${sub.provider_subscription_id}`, { method: 'DELETE' })
    if (!r.ok && r.status !== 404) return json({ erro: erroAsaas(r.body) }, 502)
  }
  const fim = [sub.current_period_end, sub.trial_end].filter(Boolean).map((d: string) => new Date(d).getTime())
  const ate = fim.length ? new Date(Math.max(...fim)).toISOString() : new Date().toISOString()
  await db.from('subscriptions').update({ status: 'canceled', current_period_end: ate, cancel_motivo: motivo, cancelado_em: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('user_id', user.id)
  return json({ ok: true, acesso_ate: ate })
})
