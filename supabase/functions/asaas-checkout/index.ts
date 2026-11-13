// Cria a página de pagamento do Asaas (cartão, recorrente) com a 1ª cobrança daqui a 7 dias.
// Segredos: ASAAS_API_KEY, ASAAS_VALOR (ex.: 19.90), SITE_URL. Sandbox: ASAAS_API_URL e ASAAS_CHECKOUT_URL.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { cors } from '../_shared/cors.ts'
import { asaas, erroAsaas, dataAsaas, ASAAS_CHECKOUT, dadosEndereco, celularValido } from '../_shared/asaas.ts'

const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
const DIAS_TESTE = 7

function cpfValido(c: string) {
  if (!/^\d{11}$/.test(c) || /^(\d)\1{10}$/.test(c)) return false
  const dv = (n: number) => { let s = 0; for (let i = 0; i < n; i++) s += +c[i] * (n + 1 - i); const r = (s * 10) % 11; return r === 10 ? 0 : r }
  return dv(9) === +c[9] && dv(10) === +c[10]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const jwt = (req.headers.get('Authorization') || '').replace('Bearer ', '')
  const { data: { user } } = await db.auth.getUser(jwt)
  if (!user) return json({ erro: 'Sessão inválida. Entre de novo.' }, 401)

  let b: any = {}
  try { b = await req.json() } catch { /* ok */ }
  const nome = String(b.nome || '').trim().slice(0, 120)
  const cpf = String(b.cpf || '').replace(/\D/g, '')
  const celular = String(b.celular || '').replace(/\D/g, '')
  if (nome.length < 3) return json({ erro: 'Informe seu nome completo.' }, 400)
  if (!cpfValido(cpf)) return json({ erro: 'CPF inválido. Confira os números.' }, 400)
  if (!celularValido(celular)) return json({ erro: 'Informe o celular com DDD.' }, 400)
  const end: any = await dadosEndereco(b.cep, b.numero)
  if (end.erro) return json({ erro: end.erro }, 400)
  const { cityName: _c, state: _s, ...endereco } = end

  const { data: sub } = await db.from('subscriptions').select('*').eq('user_id', user.id).maybeSingle()
  if (sub?.status === 'active' || (sub?.status === 'trialing' && sub?.trial_end && new Date(sub.trial_end) > new Date() && sub?.provider === 'asaas'))
    return json({ erro: 'Sua assinatura já está ativa.' }, 409)

  // 1) cliente no Asaas (reaproveita se já existir)
  let cliente = sub?.provider === 'asaas' ? sub?.provider_customer_id : null
  if (!cliente) {
    const r = await asaas('/customers', { method: 'POST', body: JSON.stringify({ name: nome, cpfCnpj: cpf, email: user.email, mobilePhone: celular, phone: celular, ...endereco, externalReference: user.id }) })
    if (!r.ok) return json({ erro: erroAsaas(r.body) }, 400)
    cliente = r.body.id
  } else {
    await asaas(`/customers/${cliente}`, { method: 'PUT', body: JSON.stringify({ name: nome, cpfCnpj: cpf, mobilePhone: celular, phone: celular, ...endereco }) })
  }

  // 2) página de pagamento: cartão, mensal, 1ª cobrança em 7 dias
  const valor = Number(Deno.env.get('ASAAS_VALOR') || '19.90')
  const site = (Deno.env.get('SITE_URL') || '').replace(/\/$/, '')
  // quem já usou o teste grátis antes paga a partir de hoje
  const jaTestou = !!sub?.provider_subscription_id || (sub?.status === 'canceled')
  const primeira = new Date(Date.now() + (jaTestou ? 0 : DIAS_TESTE) * 864e5)
  const r = await asaas('/checkouts', {
    method: 'POST',
    body: JSON.stringify({
      billingTypes: ['CREDIT_CARD'],
      chargeTypes: ['RECURRENT'],
      minutesToExpire: 60,
      customer: cliente,
      externalReference: user.id,
      callback: { successUrl: `${site}/assinatura-ok.html`, cancelUrl: `${site}/voltar-app.html`, expiredUrl: `${site}/voltar-app.html` },
      items: [{ name: 'Planner do Criador', description: jaTestou ? 'Assinatura mensal' : `Assinatura mensal · ${DIAS_TESTE} dias grátis`, quantity: 1, value: valor }],
      subscription: { cycle: 'MONTHLY', nextDueDate: dataAsaas(primeira) },
    }),
  })
  if (!r.ok || !r.body?.id) return json({ erro: erroAsaas(r.body) }, 400)

  await db.from('subscriptions').upsert({
    user_id: user.id, provider: 'asaas', provider_customer_id: cliente, checkout_id: r.body.id,
    status: sub?.status && sub.status !== 'none' ? sub.status : 'pendente', updated_at: new Date().toISOString(),
  })
  return json({ url: `${ASAAS_CHECKOUT()}/checkoutSession/show?id=${r.body.id}`, primeira_cobranca: dataAsaas(primeira, false), teste: !jaTestou })
})
