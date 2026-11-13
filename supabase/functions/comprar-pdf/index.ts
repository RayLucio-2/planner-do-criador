// Cria a página de pagamento do Asaas para o PDF (pagamento único, PIX ou cartão). Não precisa de conta no app.
// Segredos: ASAAS_API_KEY, ASAAS_VALOR_PDF (ex.: 8.99), SITE_URL. Sandbox: ASAAS_API_URL e ASAAS_CHECKOUT_URL.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { cors } from '../_shared/cors.ts'
import { asaas, erroAsaas, ASAAS_CHECKOUT } from '../_shared/asaas.ts'

const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
function cpfValido(c: string) {
  if (!/^\d{11}$/.test(c) || /^(\d)\1{10}$/.test(c)) return false
  const dv = (n: number) => { let s = 0; for (let i = 0; i < n; i++) s += +c[i] * (n + 1 - i); const r = (s * 10) % 11; return r === 10 ? 0 : r }
  return dv(9) === +c[9] && dv(10) === +c[10]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  let b: any = {}
  try { b = await req.json() } catch { return json({ erro: 'Pedido inválido.' }, 400) }
  const nome = String(b.nome || '').trim().slice(0, 120)
  const email = String(b.email || '').trim().toLowerCase()
  const cpf = String(b.cpf || '').replace(/\D/g, '')
  if (nome.length < 3) return json({ erro: 'Informe seu nome completo.' }, 400)
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 254) return json({ erro: 'Confira o e-mail.' }, 400)
  if (!cpfValido(cpf)) return json({ erro: 'CPF inválido. Confira os números.' }, 400)

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  // freio contra abuso: no máximo 5 tentativas por e-mail a cada 10 min e 200 por hora no total
  const dezMin = new Date(Date.now() - 600e3).toISOString(), umaHora = new Date(Date.now() - 3600e3).toISOString()
  const { count: porEmail } = await db.from('compras_pdf').select('id', { count: 'exact', head: true }).ilike('email', email).gte('created_at', dezMin)
  const { count: total } = await db.from('compras_pdf').select('id', { count: 'exact', head: true }).gte('created_at', umaHora)
  if ((porEmail ?? 0) >= 5 || (total ?? 0) >= 200) return json({ erro: 'Muitas tentativas seguidas. Espere alguns minutos e tente de novo.' }, 429)

  // 1) cliente no Asaas (um por compra, para não misturar com a assinatura do app)
  const cli = await asaas('/customers', { method: 'POST', body: JSON.stringify({ name: nome, cpfCnpj: cpf, email, notificationDisabled: true }) })
  if (!cli.ok) return json({ erro: erroAsaas(cli.body) }, 400)

  const valor = Number(Deno.env.get('ASAAS_VALOR_PDF') || '8.99')
  const { data: compra, error } = await db.from('compras_pdf').insert({ nome, email, asaas_customer: cli.body.id, valor }).select('id,token').single()
  if (error || !compra) return json({ erro: 'Não consegui registrar a compra agora. Tente de novo.' }, 500)

  // 2) página de pagamento: PIX ou cartão, cobrança única
  const site = (Deno.env.get('SITE_URL') || '').replace(/\/$/, '')
  const volta = `${site}/compra-ok.html?c=${compra.id}&t=${compra.token}`
  const r = await asaas('/checkouts', {
    method: 'POST',
    body: JSON.stringify({
      billingTypes: ['PIX', 'CREDIT_CARD'],
      chargeTypes: ['DETACHED'],
      minutesToExpire: 60,
      customer: cli.body.id,
      externalReference: `pdf:${compra.id}`,
      callback: { successUrl: volta, cancelUrl: `${site}/#pdf`, expiredUrl: `${site}/#pdf` },
      items: [{ name: 'Planner do Criador 2027 (PDF)', description: 'PDF interativo completo, enviado por e-mail', quantity: 1, value: valor }],
    }),
  })
  if (!r.ok || !r.body?.id) {
    console.error('checkout do PDF', r.status, JSON.stringify(r.body))
    await db.from('compras_pdf').delete().eq('id', compra.id)
    return json({ erro: erroAsaas(r.body) }, 400)
  }
  await db.from('compras_pdf').update({ checkout_id: r.body.id }).eq('id', compra.id)
  return json({ url: `${ASAAS_CHECKOUT()}/checkoutSession/show?id=${r.body.id}` })
})
