// Exclui a conta da pessoa logada (LGPD): cancela a assinatura no Stripe e apaga a conta e todos os dados.
// Deploy: supabase functions deploy excluir-conta
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { cors } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  const url = Deno.env.get('SUPABASE_URL')!
  const jwt = (req.headers.get('Authorization') || '').replace('Bearer ', '')
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { data: { user }, error } = await admin.auth.getUser(jwt)
  if (error || !user) return new Response(JSON.stringify({ erro: 'Sessão inválida. Entre de novo.' }), { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } })

  // 1) cancela a cobrança, se houver
  const { data: sub } = await admin.from('subscriptions').select('provider,provider_subscription_id').eq('user_id', user.id).maybeSingle()
  const sk = Deno.env.get('STRIPE_SECRET_KEY')
  if (sub?.provider === 'stripe' && sub.provider_subscription_id && sk) {
    const r = await fetch(`https://api.stripe.com/v1/subscriptions/${sub.provider_subscription_id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${sk}` } })
    if (!r.ok && r.status !== 404) return new Response(JSON.stringify({ erro: 'Não consegui cancelar a assinatura. Tente de novo ou fale com o suporte.' }), { status: 502, headers: { ...cors, 'Content-Type': 'application/json' } })
  }
  // 2) apaga a conta (as tabelas apagam em cascata: entries, subscriptions, push_subscriptions)
  const { error: e2 } = await admin.auth.admin.deleteUser(user.id)
  if (e2) return new Response(JSON.stringify({ erro: e2.message }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } })
  return new Response(JSON.stringify({ ok: true }), { headers: { ...cors, 'Content-Type': 'application/json' } })
})
