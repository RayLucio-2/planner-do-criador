// Envia por e-mail (pelo Gmail da Télora) o link da amostra grátis em PDF para quem acabou de entrar na lista.
// Segredos: GMAIL_USER, GMAIL_APP_PASSWORD, SITE_URL (ex.: https://plannerdocriador.netlify.app)
// Segurança: só envia para e-mails que acabaram de entrar na tabela leads, uma única vez por cadastro.
import nodemailer from 'npm:nodemailer@6.9.16'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { cors } from '../_shared/cors.ts'

const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
const LIMITE_POR_HORA = 80

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  let email = ''
  try { email = String((await req.json()).email || '').trim().toLowerCase() } catch { return json({ ok: false }, 400) }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 254) return json({ ok: false }, 400)

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { data: lead } = await db.from('leads').select('id,nome,created_at,email_enviado_em')
    .ilike('email', email).order('created_at', { ascending: false }).limit(1).maybeSingle()
  // só quem acabou de se cadastrar (15 min) e ainda não recebeu
  if (!lead || lead.email_enviado_em || Date.now() - new Date(lead.created_at).getTime() > 15 * 60 * 1000) return json({ ok: false })

  const umaHora = new Date(Date.now() - 3600 * 1000).toISOString()
  const { count } = await db.from('leads').select('id', { count: 'exact', head: true }).gte('email_enviado_em', umaHora)
  if ((count ?? 0) >= LIMITE_POR_HORA) return json({ ok: false, motivo: 'limite' }, 429)

  const site = (Deno.env.get('SITE_URL') || '').replace(/\/$/, '')
  const pdf = `${site}/planner-do-criador-amostra-gratis.pdf`
  const nome = String(lead.nome || '').split(' ')[0].replace(/[<>&"]/g, '')

  const html = `<div style="margin:0;padding:24px 12px;background:#FFFCF8;font-family:Arial,Helvetica,sans-serif;color:#1B1520">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #ECE3EC;border-radius:20px">
    <tr><td style="height:6px;background:#FF3D77;background:linear-gradient(90deg,#FFB020,#FF7A2F,#FF3D77,#8B5CF6);border-radius:20px 20px 0 0"></td></tr>
    <tr><td style="padding:28px 28px 8px">
      <p style="margin:0 0 18px;font-weight:bold;font-size:15px">planner<span style="color:#FF3D77">.</span>do<span style="color:#FF3D77">.</span>criador</p>
      <h1 style="margin:0 0 10px;font-size:24px;line-height:1.2">${nome ? `Oi, ${nome}! ` : ''}Sua amostra chegou 🎁</h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3A3140">Aqui está a amostra do Planner do Criador: as 6 lições do guia, os primeiros 90 dias e o mês de janeiro completo, em PDF interativo para preencher no celular ou imprimir.</p>
      <a href="${pdf}" style="display:inline-block;background:#1B1520;color:#ffffff;text-decoration:none;font-weight:bold;padding:14px 24px;border-radius:999px;font-size:15px">Baixar o PDF</a>
      <p style="margin:22px 0 0;font-size:15px;line-height:1.6;color:#3A3140">Você também está na lista de espera do app. Assim que ele for lançado, você fica sabendo primeiro, por aqui.</p>
      <p style="margin:16px 0 0;font-size:12.5px;line-height:1.6;color:#7A7181">Para abrir os campos de preencher, use o Adobe Acrobat Reader (grátis, no celular ou no computador).</p>
    </td></tr>
    <tr><td style="padding:18px 28px 24px;font-size:12px;color:#7A7181;border-top:1px solid #ECE3EC">Planner do Criador · uma criação Télora Produtora · <a href="https://www.instagram.com/aritamende.s/" style="color:#8B5CF6">@aritamende.s</a><br>Você recebeu este e-mail porque se cadastrou em ${site.replace('https://', '')}. Para não receber mais, responda este e-mail com “sair”.</td></tr>
  </table>
</div>`

  try {
    const smtp = nodemailer.createTransport({
      host: 'smtp.gmail.com', port: 465, secure: true,
      auth: { user: Deno.env.get('GMAIL_USER')!, pass: Deno.env.get('GMAIL_APP_PASSWORD')! },
    })
    await smtp.sendMail({
      from: { name: 'Planner do Criador', address: Deno.env.get('GMAIL_USER')! },
      to: email,
      subject: 'Sua amostra do Planner do Criador chegou 🎁',
      html,
      text: `${nome ? `Oi, ${nome}! ` : ''}Sua amostra do Planner do Criador chegou. Baixe o PDF: ${pdf}\n\nVocê também está na lista de espera do app.\n\nPlanner do Criador · Télora Produtora`,
    })
  } catch (e) {
    console.error('falha no envio', e?.message)
    return json({ ok: false, motivo: 'envio' }, 502)
  }
  await db.from('leads').update({ email_enviado_em: new Date().toISOString() }).eq('id', lead.id)
  return json({ ok: true })
})
