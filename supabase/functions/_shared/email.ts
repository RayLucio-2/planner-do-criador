// E-mails do Planner do Criador (Gmail da Télora): um modelo visual único para todos
import nodemailer from 'npm:nodemailer@6.9.16'

export const site = () => (Deno.env.get('SITE_URL') || 'https://plannerdocriador.netlify.app').replace(/\/$/, '')
const esc = (s: string) => String(s ?? '').replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]!))

export function modelo({ titulo, paragrafos, botao, link, rodape }: { titulo: string; paragrafos: string[]; botao?: string; link?: string; rodape?: string }) {
  const ps = paragrafos.map((p) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#3A3140">${p}</p>`).join('')
  return `<div style="margin:0;padding:24px 12px;background:#FFFCF8;font-family:Arial,Helvetica,sans-serif;color:#1B1520">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #ECE3EC;border-radius:20px">
    <tr><td style="height:6px;background:#FF3D77;background:linear-gradient(90deg,#FFB020,#FF7A2F,#FF3D77,#8B5CF6);border-radius:20px 20px 0 0"></td></tr>
    <tr><td style="padding:28px 28px 12px">
      <p style="margin:0 0 18px;font-weight:bold;font-size:15px">planner<span style="color:#FF3D77">.</span>do<span style="color:#FF3D77">.</span>criador</p>
      <h1 style="margin:0 0 12px;font-size:23px;line-height:1.25">${titulo}</h1>
      ${ps}
      ${botao && link ? `<a href="${link}" style="display:inline-block;margin:6px 0 10px;background:#1B1520;color:#ffffff;text-decoration:none;font-weight:bold;padding:14px 24px;border-radius:999px;font-size:15px">${esc(botao)}</a>` : ''}
    </td></tr>
    <tr><td style="padding:18px 28px 24px;font-size:12px;color:#7A7181;border-top:1px solid #ECE3EC">${rodape || ''}Planner do Criador · uma criação Télora Produtora · <a href="https://www.instagram.com/aritamende.s/" style="color:#8B5CF6">@aritamende.s</a></td></tr>
  </table>
</div>`
}

export async function enviarEmail(para: string, assunto: string, html: string, texto: string) {
  const smtp = nodemailer.createTransport({ host: 'smtp.gmail.com', port: 465, secure: true, auth: { user: Deno.env.get('GMAIL_USER')!, pass: Deno.env.get('GMAIL_APP_PASSWORD')! } })
  await smtp.sendMail({ from: { name: 'Planner do Criador', address: Deno.env.get('GMAIL_USER')! }, to: para, subject: assunto, html, text: texto })
}
export { esc }
