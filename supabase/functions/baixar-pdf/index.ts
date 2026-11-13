// Link de download do PDF comprado: confere a compra e abre o arquivo (link temporário do Storage).
// ?c=<id>&t=<token>            → baixa o PDF (se pago) ou volta para a página de obrigado
// ?c=<id>&t=<token>&status=1   → responde { pago: true/false } para a página de obrigado
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { BUCKET, ARQUIVO, linkObrigada } from '../_shared/pdf.ts'

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'GET, OPTIONS' }
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const LIMITE_DOWNLOADS = 50

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  const u = new URL(req.url)
  const c = u.searchParams.get('c') || '', t = u.searchParams.get('t') || ''
  const site = (Deno.env.get('SITE_URL') || '').replace(/\/$/, '')
  if (!uuid.test(c) || !uuid.test(t)) return u.searchParams.get('status') ? json({ pago: false }, 400) : Response.redirect(site, 302)

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { data: compra } = await db.from('compras_pdf').select('id,token,status,downloads').eq('id', c).eq('token', t).maybeSingle()
  const pago = compra?.status === 'pago'
  if (u.searchParams.get('status')) return json({ pago })
  if (!compra) return Response.redirect(site, 302)
  if (!pago || compra.downloads >= LIMITE_DOWNLOADS) return Response.redirect(linkObrigada(compra), 302)

  const { data, error } = await db.storage.from(BUCKET).createSignedUrl(ARQUIVO(), 300, { download: 'Planner-do-Criador-2027.pdf' })
  if (error || !data?.signedUrl) { console.error('arquivo do PDF não encontrado no Storage', error?.message); return Response.redirect(linkObrigada(compra), 302) }
  await db.from('compras_pdf').update({ downloads: compra.downloads + 1 }).eq('id', compra.id)
  return Response.redirect(data.signedUrl, 302)
})
