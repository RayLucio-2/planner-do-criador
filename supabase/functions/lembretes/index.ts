// Envia os lembretes (roda a cada hora pelo pg_cron, veja o SQL 002).
// Deploy: supabase functions deploy lembretes --no-verify-jwt
// Segredos: supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:seu@email.com CRON_KEY=uma-senha-qualquer
import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { avisosEmail } from './avisos.ts'

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const NOMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const ANO_INICIAL = 2027
const chave = (y: number, k: string) => (y === ANO_INICIAL ? k : `${y}:${k}`)

Deno.serve(async (req) => {
  if (req.headers.get('x-cron-key') !== Deno.env.get('CRON_KEY')) return new Response('não autorizado', { status: 401 })
  webpush.setVapidDetails(Deno.env.get('VAPID_SUBJECT')!, Deno.env.get('VAPID_PUBLIC_KEY')!, Deno.env.get('VAPID_PRIVATE_KEY')!)
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { data: subs } = await db.from('push_subscriptions').select('*')
  let enviados = 0
  for (const s of subs ?? []) {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: s.fuso, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', hour12: false })
      .formatToParts(new Date()).map((p) => [p.type, p.value]))
    const y = +parts.year, m = +parts.month, d = +parts.day, h = +parts.hour % 24
    if (h !== s.hora) continue
    const { data: ok } = await db.rpc('tem_acesso', { uid: s.user_id })
    if (!ok) continue
    const msgs: { title: string; body: string; url: string }[] = []
    if (s.post_do_dia) {
      const { data: e } = await db.from('entries').select('data').eq('user_id', s.user_id).eq('key', chave(y, `${MESES[m - 1]}.ed`)).maybeSingle()
      const ideia = e?.data?.[`${d}.ideia`]
      if (ideia && !e?.data?.[`${d}.post`]) msgs.push({ title: 'Hoje tem post 📌', body: ideia, url: `./#/app/mes/${MESES[m - 1]}/editorial` })
    }
    const ultimo = new Date(y, m, 0).getDate()
    if (s.fim_do_mes && d === ultimo) msgs.push({ title: `Fechando ${NOMES[m - 1]}`, body: 'Reserve 15 minutos para a Análise do mês: onde errou, o que funcionou, o que muda.', url: `./#/app/mes/${MESES[m - 1]}/analise` })
    for (const msg of msgs) {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(msg))
        enviados++
      } catch (err) {
        if (err?.statusCode === 404 || err?.statusCode === 410) await db.from('push_subscriptions').delete().eq('endpoint', s.endpoint)
      }
    }
  }
  let emails = 0
  try { emails = await avisosEmail(db) } catch (e) { console.error('e-mails automáticos', (e as Error).message) }
  return new Response(JSON.stringify({ enviados, emails }), { headers: { 'Content-Type': 'application/json' } })
})
