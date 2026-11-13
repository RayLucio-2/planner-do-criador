// Funções comuns para falar com o Asaas
export const ASAAS_API = () => Deno.env.get('ASAAS_API_URL') || 'https://api.asaas.com/v3'
export const ASAAS_CHECKOUT = () => (Deno.env.get('ASAAS_CHECKOUT_URL') || 'https://asaas.com').replace(/\/$/, '')
export async function asaas(path: string, init: RequestInit = {}) {
  const r = await fetch(ASAAS_API() + path, {
    ...init,
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'planner-do-criador', access_token: Deno.env.get('ASAAS_API_KEY')!, ...(init.headers || {}) },
  })
  const txt = await r.text()
  let body: any = null
  try { body = txt ? JSON.parse(txt) : null } catch { body = { raw: txt } }
  return { ok: r.ok, status: r.status, body }
}
export const erroAsaas = (b: any) => b?.errors?.map((e: any) => e.description).join(' ') || 'Erro no Asaas'
// data no formato do Asaas (fuso de Brasília)
export function dataAsaas(d: Date, comHora = true) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).formatToParts(d).map((x) => [x.type, x.value]))
  const dia = `${p.year}-${p.month}-${p.day}`
  return comHora ? `${dia} ${p.hour === '24' ? '00' : p.hour}:${p.minute}:${p.second}` : dia
}
