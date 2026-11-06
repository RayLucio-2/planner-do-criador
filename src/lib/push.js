// Lembretes no celular (Web Push)
import { supabase, DEMO } from './supabase'
const VAPID = import.meta.env.VITE_VAPID_PUBLIC_KEY || ''

export function pushSuportado() {
  return !DEMO && !!VAPID && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}
export const ehIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent)
export const instalado = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true

function b64(base64) {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + pad).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

export async function lembreteAtual(userId) {
  if (!pushSuportado()) return null
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = reg && await reg.pushManager.getSubscription()
  if (!sub) return null
  const { data } = await supabase.from('push_subscriptions').select('*').eq('endpoint', sub.endpoint).eq('user_id', userId).maybeSingle()
  return data
}

export async function ativarLembretes(userId, { hora = 9, post_do_dia = true, fim_do_mes = true } = {}) {
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') throw new Error('Você não permitiu notificações. Libere nas configurações do navegador e tente de novo.')
  const reg = await navigator.serviceWorker.ready
  const sub = (await reg.pushManager.getSubscription()) || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(VAPID) })
  const j = sub.toJSON()
  const row = { endpoint: j.endpoint, user_id: userId, p256dh: j.keys.p256dh, auth: j.keys.auth, hora, post_do_dia, fim_do_mes, fuso: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo' }
  const { error } = await supabase.from('push_subscriptions').upsert(row)
  if (error) throw new Error('Não consegui salvar o lembrete. Tente de novo.')
  return row
}

export async function atualizarLembrete(endpoint, campos) {
  return supabase.from('push_subscriptions').update(campos).eq('endpoint', endpoint)
}

export async function desativarLembretes() {
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = reg && await reg.pushManager.getSubscription()
  if (sub) { await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint); await sub.unsubscribe() }
}
