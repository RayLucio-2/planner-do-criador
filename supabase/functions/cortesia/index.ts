// Dar acesso cortesia (só a equipe): libera tudo por X dias, sem cartão, e manda um e-mail bonito avisando.
// Se a pessoa ainda não tem conta, guarda a cortesia e ela é aplicada sozinha quando ela se cadastrar com o e-mail.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { cors } from '../_shared/cors.ts'
import { modelo, enviarEmail, site, esc } from '../_shared/email.ts'

const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
const ADMINS = (Deno.env.get('ADMIN_EMAILS') || 'rayaneborba_02@outlook.com,teloraprodutora@gmail.com').toLowerCase().split(',').map((s) => s.trim())
const dataBR = (d: Date) => d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
const LISTA = ['os 12 meses com calendário editorial, roteiros e análise do mês', 'o financeiro completo, com importação de extrato e fatura do cartão', 'os desafios de 60 e 90 dias de conteúdo', 'lembretes no celular e no Google Agenda']
const lista = '<ul style="margin:0 0 14px;padding-left:20px;font-size:15px;line-height:1.7;color:#3A3140">' + LISTA.map((x) => `<li>${x}</li>`).join('') + '</ul>'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const jwt = (req.headers.get('Authorization') || '').replace('Bearer ', '')
  const { data: { user } } = await db.auth.getUser(jwt)
  if (!user || !ADMINS.includes((user.email || '').toLowerCase())) return json({ erro: 'Só a equipe do planner pode dar cortesia.' }, 403)

  const b = await req.json().catch(() => ({}))
  const email = String(b.email || '').trim().toLowerCase()
  const dias = Math.round(Number(b.dias))
  const nome = String(b.nome || '').trim().split(' ')[0]
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ erro: 'E-mail inválido.' }, 400)
  if (!(dias >= 1 && dias <= 730)) return json({ erro: 'Escolha entre 1 e 730 dias.' }, 400)
  const oi = nome ? `Oi, ${esc(nome)}!` : 'Oi!'
  const ate = new Date(Date.now() + dias * 864e5)

  // a pessoa já tem conta?
  const { data: uid } = await db.rpc('id_por_email', { e: email })
  if (uid) {
    const { data: sub } = await db.from('subscriptions').select('*').eq('user_id', uid).maybeSingle()
    if (sub?.provider === 'asaas' && sub?.provider_subscription_id && ['active', 'trialing', 'past_due'].includes(sub.status))
      return json({ erro: 'Essa pessoa tem assinatura no Asaas. Cancele a assinatura dela antes, para não ser cobrada.' }, 409)
    const agora = new Date().toISOString()
    const { error } = await db.from('subscriptions').upsert({ user_id: uid, status: 'active', provider: 'cortesia', trial_end: null, current_period_end: ate.toISOString(), pagou_em: agora, email_cartao_em: agora, updated_at: agora })
    if (error) return json({ erro: error.message }, 500)
    try {
      await enviarEmail(email, `Seu presente: ${dias} dias de Planner do Criador 🎁`, modelo({
        titulo: `${oi} Seus ${dias} dias estão liberados`,
        paragrafos: [`Separamos um presente para você: <b>${dias} dias de acesso completo</b> ao Planner do Criador, por nossa conta. Não precisa de cartão e nada será cobrado.`,
          `Já está tudo liberado na sua conta até <b>${dataBR(ate)}</b>:` + lista,
          'Dica: comece pelo <b>Guia</b>. O desafio de 60 dias é um ótimo primeiro passo, uma tarefa por dia.'],
        botao: 'Abrir o meu planner', link: `${site()}/#/app`,
        rodape: `Quando a cortesia acabar, você decide se quer continuar. Tudo o que escrever fica guardado.<br><br>`,
      }), `${oi} Você ganhou ${dias} dias de acesso completo ao Planner do Criador, sem cartão, até ${dataBR(ate)}. Entre em ${site()}/#/app`)
    } catch (e) { return json({ ok: true, aviso: `Acesso liberado até ${dataBR(ate)}, mas o e-mail não foi enviado (${(e as Error).message}).` }) }
    return json({ ok: true, msg: `Pronto! ${email} tem acesso até ${dataBR(ate)} e recebeu o e-mail.` })
  }

  // ainda não tem conta: guarda a cortesia e convida
  const { error } = await db.from('cortesias').upsert({ email, dias, criada_em: new Date().toISOString(), aplicada_em: null })
  if (error) return json({ erro: error.message }, 500)
  const link = `${site()}/#/entrar?criar=1&cortesia=1&email=${encodeURIComponent(email)}`
  try {
    await enviarEmail(email, `Um presente para você: ${dias} dias de Planner do Criador 🎁`, modelo({
      titulo: `${oi} Você ganhou ${dias} dias de Planner do Criador`,
      paragrafos: [`Separamos um presente para você: <b>${dias} dias de acesso completo</b> ao Planner do Criador, por nossa conta. Não precisa de cartão e nada será cobrado.`,
        'Você vai ter:' + lista,
        `Para ativar, é só criar a sua conta com <b>este e-mail</b> (${esc(email)}) pelo botão abaixo. O acesso é liberado na hora e os ${dias} dias começam a contar a partir do cadastro.`],
      botao: 'Criar minha conta', link,
      rodape: `Quando a cortesia acabar, você decide se quer continuar. Tudo o que escrever fica guardado.<br><br>`,
    }), `${oi} Você ganhou ${dias} dias de acesso completo ao Planner do Criador, sem cartão. Crie sua conta com este e-mail: ${link}`)
  } catch (e) { return json({ ok: true, aviso: `Cortesia guardada, mas o e-mail não foi enviado (${(e as Error).message}).` }) }
  return json({ ok: true, msg: `Pronto! ${email} ainda não tem conta: mandei o convite. Os ${dias} dias começam quando a pessoa se cadastrar com esse e-mail.` })
})
