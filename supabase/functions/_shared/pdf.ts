// Entrega do PDF vendido: marca a compra como paga e manda o link por e-mail (Gmail da Télora)
import nodemailer from 'npm:nodemailer@6.9.16'

export const BUCKET = 'produtos'
export const ARQUIVO = () => Deno.env.get('PDF_ARQUIVO') || 'planner-do-criador-2027.pdf'
const site = () => (Deno.env.get('SITE_URL') || '').replace(/\/$/, '')
export const linkObrigada = (c: { id: string; token: string }) => `${site()}/#/obrigada?c=${c.id}&t=${c.token}`

export async function entregarPdf(db: any, compra: any, paymentId?: string | null) {
  const agora = new Date().toISOString()
  if (compra.status !== 'pago') {
    await db.from('compras_pdf').update({ status: 'pago', pago_em: agora, payment_id: paymentId || compra.payment_id }).eq('id', compra.id)
  }
  if (compra.email_enviado_em) return
  const link = linkObrigada(compra)
  const nome = String(compra.nome || '').split(' ')[0].replace(/[<>&"]/g, '')
  const html = `<div style="margin:0;padding:24px 12px;background:#FFFCF8;font-family:Arial,Helvetica,sans-serif;color:#1B1520">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #ECE3EC;border-radius:20px">
    <tr><td style="height:6px;background:#FF3D77;background:linear-gradient(90deg,#FFB020,#FF7A2F,#FF3D77,#8B5CF6);border-radius:20px 20px 0 0"></td></tr>
    <tr><td style="padding:28px 28px 8px">
      <p style="margin:0 0 18px;font-weight:bold;font-size:15px">planner<span style="color:#FF3D77">.</span>do<span style="color:#FF3D77">.</span>criador</p>
      <h1 style="margin:0 0 10px;font-size:24px;line-height:1.2">${nome ? `Oi, ${nome}! ` : ''}Seu planner chegou 🎉</h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3A3140">Obrigada pela compra! Aqui está o Planner do Criador 2027 completo, em PDF interativo para preencher no celular ou imprimir.</p>
      <a href="${link}" style="display:inline-block;background:#1B1520;color:#ffffff;text-decoration:none;font-weight:bold;padding:14px 24px;border-radius:999px;font-size:15px">Baixar o PDF</a>
      <p style="margin:22px 0 0;font-size:15px;line-height:1.6;color:#3A3140">Guarde este e-mail: o botão continua funcionando se você precisar baixar de novo.</p>
      <p style="margin:16px 0 0;font-size:12.5px;line-height:1.6;color:#7A7181">Para abrir os campos de preencher, use o Adobe Acrobat Reader (grátis, no celular ou no computador). O arquivo é para uso pessoal.</p>
    </td></tr>
    <tr><td style="padding:18px 28px 24px;font-size:12px;color:#7A7181;border-top:1px solid #ECE3EC">Planner do Criador · uma criação Télora Produtora · <a href="https://www.instagram.com/aritamende.s/" style="color:#8B5CF6">@aritamende.s</a><br>Você recebeu este e-mail porque comprou o PDF em ${site().replace('https://', '')}.</td></tr>
  </table>
</div>`
  try {
    const smtp = nodemailer.createTransport({
      host: 'smtp.gmail.com', port: 465, secure: true,
      auth: { user: Deno.env.get('GMAIL_USER')!, pass: Deno.env.get('GMAIL_APP_PASSWORD')! },
    })
    await smtp.sendMail({
      from: { name: 'Planner do Criador', address: Deno.env.get('GMAIL_USER')! },
      to: compra.email,
      subject: 'Seu Planner do Criador em PDF chegou 🎉',
      html,
      text: `${nome ? `Oi, ${nome}! ` : ''}Obrigada pela compra! Baixe o Planner do Criador 2027 em PDF: ${link}\n\nPlanner do Criador · Télora Produtora`,
    })
    await db.from('compras_pdf').update({ email_enviado_em: new Date().toISOString() }).eq('id', compra.id)
  } catch (e) {
    console.error('falha no e-mail do PDF', compra.id, (e as Error)?.message)   // o download continua na página de obrigado
  }
}
