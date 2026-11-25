// E-mails automáticos (rodam junto com os lembretes, de hora em hora):
// 1) boas-vindas depois que a pessoa confirma o e-mail
// 2) "falta cadastrar o cartão" 24 h depois do cadastro, para quem não ativou o teste
// 3) aviso 2 dias antes da 1ª cobrança, para quem está no teste grátis
import { modelo, enviarEmail, site, esc } from '../_shared/email.ts'
import { asaas } from '../_shared/asaas.ts'

const LIMITE = 40   // e-mails por rodada, para não estourar o limite do Gmail
const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const dataBR = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' })

export async function avisosEmail(db: any) {
  let n = 0
  const agora = Date.now()
  const pessoa = async (uid: string) => { const { data } = await db.auth.admin.getUserById(uid); return data?.user }
  const primeiro = (u: any) => esc(String(u?.user_metadata?.nome || '').trim().split(' ')[0])

  // 1) boas-vindas
  const { data: novos } = await db.from('subscriptions').select('user_id').is('email_boasvindas_em', null).limit(LIMITE)
  for (const s of novos || []) {
    if (n >= LIMITE) break
    const u = await pessoa(s.user_id)
    if (!u?.email || !u.email_confirmed_at) continue
    const nome = primeiro(u)
    try {
      await enviarEmail(u.email, 'Boas-vindas ao Planner do Criador ✨', modelo({
        titulo: `${nome ? `Oi, ${nome}! ` : ''}Que bom ter você aqui`,
        paragrafos: ['Para começar com o pé direito, faça só estas 3 coisas hoje:',
          '<b>1.</b> Leia <b>Antes de começar</b> (5 minutos).<br><b>2.</b> Em <b>Ferramentas › Meu público</b>, descreva para quem você cria.<br><b>3.</b> No mês atual, abra o <b>Calendário</b> e planeje os próximos 3 posts.',
          'Dica: o botão <b>+</b> no canto da tela anota ideias, contratos e gastos de qualquer lugar.'],
        botao: 'Abrir o meu planner', link: `${site()}/#/app`,
      }), `Boas-vindas ao Planner do Criador! Comece por: 1) Antes de começar, 2) Ferramentas › Meu público, 3) planejar 3 posts no calendário. ${site()}/#/app`)
      await db.from('subscriptions').update({ email_boasvindas_em: new Date().toISOString() }).eq('user_id', s.user_id); n++
    } catch (e) { console.error('boas-vindas', s.user_id, (e as Error).message) }
  }

  // 2) ainda não cadastrou o cartão (24 h a 7 dias depois do cadastro)
  const ontem = new Date(agora - 864e5).toISOString(), semana = new Date(agora - 7 * 864e5).toISOString()
  const { data: pend } = await db.from('subscriptions').select('user_id').eq('status', 'pendente').is('email_cartao_em', null).lt('criada_em', ontem).gt('criada_em', semana).limit(LIMITE)
  for (const s of pend || []) {
    if (n >= LIMITE) break
    const u = await pessoa(s.user_id); if (!u?.email) continue
    const nome = primeiro(u)
    try {
      await enviarEmail(u.email, 'Seu teste grátis ainda não começou', modelo({
        titulo: `${nome ? `${nome}, ` : ''}falta um passo para liberar o seu planner`,
        paragrafos: ['Você criou a sua conta, mas ainda não ativou os <b>7 dias grátis</b>.', 'É só cadastrar o cartão no ambiente seguro do Asaas. <b>Nada é cobrado agora:</b> a 1ª cobrança só acontece no 8º dia, e você pode cancelar antes em Perfil.'],
        botao: 'Ativar meus 7 dias grátis', link: `${site()}/#/app`,
      }), `Falta um passo: ative os 7 dias grátis do Planner do Criador. Nada é cobrado agora. ${site()}/#/app`)
      await db.from('subscriptions').update({ email_cartao_em: new Date().toISOString() }).eq('user_id', s.user_id); n++
    } catch (e) { console.error('cartão', s.user_id, (e as Error).message) }
  }

  // 3) 2 dias antes da 1ª cobrança
  const em2dias = new Date(agora + 2.2 * 864e5).toISOString()
  const { data: teste } = await db.from('subscriptions').select('user_id,trial_end,provider_subscription_id').eq('status', 'trialing').is('email_cobranca_em', null).not('provider_subscription_id', 'is', null).gt('trial_end', new Date(agora).toISOString()).lt('trial_end', em2dias).limit(LIMITE)
  for (const s of teste || []) {
    if (n >= LIMITE) break
    const u = await pessoa(s.user_id); if (!u?.email) continue
    let valor = ''
    try { const r = await asaas(`/subscriptions/${s.provider_subscription_id}`); if (r.ok && r.body?.value) valor = brl(Number(r.body.value)) } catch { /* segue sem o valor */ }
    const nome = primeiro(u)
    try {
      await enviarEmail(u.email, 'Sua 1ª cobrança é em 2 dias', modelo({
        titulo: `${nome ? `${nome}, ` : ''}seu teste grátis termina em breve`,
        paragrafos: [`A 1ª cobrança${valor ? ` de <b>${valor}</b>` : ''} acontece em <b>${dataBR(s.trial_end)}</b>, no cartão que você cadastrou.`, 'Se o planner está te ajudando, não precisa fazer nada. Se preferir não continuar, cancele em <b>Perfil › Assinatura</b> antes dessa data e nada será cobrado.'],
        botao: 'Ver a minha assinatura', link: `${site()}/#/app/perfil`,
      }), `Sua 1ª cobrança${valor ? ` de ${valor}` : ''} do Planner do Criador é em ${dataBR(s.trial_end)}. Para não continuar, cancele em Perfil › Assinatura antes dessa data. ${site()}/#/app/perfil`)
      await db.from('subscriptions').update({ email_cobranca_em: new Date().toISOString() }).eq('user_id', s.user_id); n++
    } catch (e) { console.error('cobrança', s.user_id, (e as Error).message) }
  }
  return n
}

// Fim do preço da promoção (12 meses): avisa 15 dias antes e, no dia, muda o valor da assinatura no Asaas
export async function reajustePromo(db: any) {
  let n = 0
  const agora = Date.now()
  const pessoa = async (uid: string) => { const { data } = await db.auth.admin.getUserById(uid); return data?.user }
  // aviso
  const em15 = new Date(agora + 15 * 864e5).toISOString()
  const { data: avisar } = await db.from('subscriptions').select('user_id,preco_promo_ate,valor_apos_promo').in('status', ['active', 'trialing']).not('valor_apos_promo', 'is', null).is('email_reajuste_em', null).lt('preco_promo_ate', em15).limit(LIMITE)
  for (const s of avisar || []) {
    const u = await pessoa(s.user_id); if (!u?.email) continue
    const nome = esc(String(u.user_metadata?.nome || '').trim().split(' ')[0])
    const quando = dataBR(s.preco_promo_ate); const valor = brl(Number(s.valor_apos_promo))
    try {
      await enviarEmail(u.email, 'Seu preço promocional está terminando', modelo({
        titulo: `${nome ? `${nome}, ` : ''}obrigada por estar com a gente há um ano 💛`,
        paragrafos: [`Você assinou o Planner do Criador com o preço da promoção, que valia por 12 meses. A partir de <b>${quando}</b>, a mensalidade passa a ser de <b>${valor}</b>.`, 'Não precisa fazer nada para continuar. Se preferir cancelar, é só ir em <b>Perfil › Assinatura</b> antes dessa data.'],
        botao: 'Ver a minha assinatura', link: `${site()}/#/app/perfil`,
      }), `A partir de ${quando}, a mensalidade do Planner do Criador passa a ser de ${valor}. Para cancelar, vá em Perfil › Assinatura antes dessa data. ${site()}/#/app/perfil`)
      await db.from('subscriptions').update({ email_reajuste_em: new Date().toISOString() }).eq('user_id', s.user_id); n++
    } catch (e) { console.error('aviso reajuste', s.user_id, (e as Error).message) }
  }
  // reajuste
  const { data: vencidos } = await db.from('subscriptions').select('user_id,provider_subscription_id,valor_apos_promo').not('valor_apos_promo', 'is', null).not('provider_subscription_id', 'is', null).lt('preco_promo_ate', new Date(agora).toISOString()).limit(LIMITE)
  for (const s of vencidos || []) {
    const r = await asaas(`/subscriptions/${s.provider_subscription_id}`, { method: 'PUT', body: JSON.stringify({ value: Number(s.valor_apos_promo), updatePendingPayments: true }) })
    if (r.ok || r.status === 404) { await db.from('subscriptions').update({ valor_apos_promo: null }).eq('user_id', s.user_id); n++ }
    else console.error('reajuste', s.user_id, JSON.stringify(r.body))
  }
  return n
}
