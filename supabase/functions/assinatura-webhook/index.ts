// Supabase Edge Function: recebe os avisos do Stripe e libera/bloqueia o acesso.
// Deploy: supabase functions deploy assinatura-webhook --no-verify-jwt
// Segredos: supabase secrets set STRIPE_SECRET_KEY=sk_live_... STRIPE_WEBHOOK_SECRET=whsec_...
import Stripe from 'https://esm.sh/stripe@14.25.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20', httpClient: Stripe.createFetchHttpClient() })
const cryptoProvider = Stripe.createSubtleCryptoProvider()
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

const statusDe = (s: string) => (s === 'active' || s === 'trialing' ? 'active' : s === 'past_due' || s === 'unpaid' ? 'past_due' : 'canceled')

Deno.serve(async (req) => {
  const sig = req.headers.get('stripe-signature')
  const body = await req.text()
  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig!, Deno.env.get('STRIPE_WEBHOOK_SECRET')!, undefined, cryptoProvider)
  } catch (e) {
    return new Response(`assinatura inválida: ${e.message}`, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const s = event.data.object as Stripe.Checkout.Session
    let userId = s.client_reference_id
    if (!userId && s.customer_details?.email) {
      // se o link não trouxe o id, procura pela conta com o mesmo e-mail
      const { data } = await db.auth.admin.listUsers({ perPage: 1000 })
      userId = data.users.find((u) => u.email?.toLowerCase() === s.customer_details!.email!.toLowerCase())?.id ?? null
    }
    if (userId && s.subscription) {
      const sub = await stripe.subscriptions.retrieve(s.subscription as string)
      await db.from('subscriptions').upsert({
        user_id: userId, status: statusDe(sub.status), provider: 'stripe',
        provider_customer_id: s.customer as string, provider_subscription_id: sub.id,
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(), updated_at: new Date().toISOString(),
      })
    }
  }

  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    await db.from('subscriptions').update({
      status: event.type === 'customer.subscription.deleted' ? 'canceled' : statusDe(sub.status),
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(), updated_at: new Date().toISOString(),
    }).eq('provider_subscription_id', sub.id)
  }

  return new Response('ok')
})
