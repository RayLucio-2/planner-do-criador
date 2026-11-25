// Armazena tudo o que a pessoa preenche.
// - salva no aparelho na hora (funciona offline);
// - envia para o Supabase só os CAMPOS alterados (dois aparelhos editando páginas ou campos diferentes não se atropelam);
// - recebe em tempo real o que foi alterado em outro aparelho;
// - separa os dados por ano (2027 usa as chaves antigas, sem prefixo).
import { useSyncExternalStore } from 'react'
import { supabase, DEMO } from './supabase'
import { ANO_INICIAL, ANOS_BONUS } from '../data/content'

let uid = null
let data = {}               // chave real -> objeto
let dirty = new Map()       // chave real -> Set(campos) | '*'
let version = 0
let status = 'salvo'        // salvo | salvando | offline | erro | sem-acesso
const subs = new Set()
let timer = null
let channel = null
let loaded = false

// ------------------------------------------------------------------ anos
// Páginas que valem para todos os anos (perfil, público, guia, ideias…)
const GLOBAL = new Set(['capa', 'perfil', 'publico', 'linguagem', 'escada', 'ideias', 'notas', 'porta', 'onboarding', 'lembretes',
  'l1a', 'l1b', 'l2a', 'l2b', 'l3', 'l4', 'l5', 'l6', 'd90', 'preco', 'd60'])
const hoje = new Date().getFullYear()
const primeiro = ANOS_BONUS[hoje] ? hoje : ANO_INICIAL
export const ANOS = Array.from({ length: Math.max(ANO_INICIAL, hoje) + 2 - primeiro }, (_, i) => primeiro + i)
function anoPadrao() {
  try { const s = parseInt(localStorage.getItem('pdc:ano')); if (ANOS.includes(s)) return s } catch (e) { /* ok */ }
  if (ANOS.includes(hoje)) return hoje
  return ANO_INICIAL
}
let ano = anoPadrao()
export function getAno() { return ano }
export function setAno(y) { ano = y; try { localStorage.setItem('pdc:ano', String(y)) } catch (e) { /* ok */ } emit() }
export function useAno() { useStoreVersion(); return ano }
export function rk(key) {
  const base = key.split('.')[0]
  return GLOBAL.has(base) || ano === ANO_INICIAL ? key : `${ano}:${key}`
}

// ------------------------------------------------------------------ núcleo
const LS = () => `pdc:${uid}:dados`
function emit() { version++; subs.forEach((f) => f()) }
function persistLocal() {
  try {
    const d = {}; dirty.forEach((v, k) => { d[k] = v === '*' ? '*' : [...v] })
    localStorage.setItem(LS(), JSON.stringify({ data, dirty: d }))
  } catch (e) { /* cheio ou bloqueado */ }
}
function markDirty(k, f) {
  if (f === '*') { dirty.set(k, '*'); return }
  const cur = dirty.get(k)
  if (cur === '*') return
  if (cur) cur.add(f); else dirty.set(k, new Set([f]))
}
function localPart(k) {
  const fs = dirty.get(k); if (!fs) return {}
  if (fs === '*') return data[k] || {}
  const out = {}; fs.forEach((f) => { if (data[k] && f in data[k]) out[f] = data[k][f] }); return out
}
function mergeRemote(k, remote) {
  if (!dirty.has(k)) data = { ...data, [k]: remote || {} }
  else data = { ...data, [k]: { ...(remote || {}), ...localPart(k) } }
}

export async function loadStore(userId) {
  uid = userId; data = {}; dirty = new Map(); loaded = DEMO
  try {
    const raw = JSON.parse(localStorage.getItem(LS()) || 'null')
    if (raw) {
      data = raw.data || {}
      const d = raw.dirty || {}
      if (Array.isArray(d)) d.forEach((k) => dirty.set(k, '*'))   // formato antigo
      else Object.entries(d).forEach(([k, v]) => dirty.set(k, v === '*' ? '*' : new Set(v)))
    }
  } catch (e) { /* ignora */ }
  emit()
  if (!DEMO && supabase) {
    await pull()
    if (channel) supabase.removeChannel(channel)
    channel = supabase.channel('entries-' + userId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'entries', filter: `user_id=eq.${userId}` }, (p) => {
        if (p.new && p.new.key) { mergeRemote(p.new.key, p.new.data); persistLocal(); emit() }
      })
      .subscribe()
  }
}
async function pull() {
  if (!supabase || !uid) return
  const { data: rows, error } = await supabase.from('entries').select('key,data')
  loaded = true
  if (error) { status = 'offline'; emit(); return }
  for (const r of rows) mergeRemote(r.key, r.data)
  persistLocal(); emit()
  if (dirty.size) flush()
}

export function resetStore() {
  if (channel && supabase) supabase.removeChannel(channel)
  channel = null; uid = null; data = {}; dirty = new Map(); emit()
}

export function setField(key, field, value) {
  const k = rk(key)
  data = { ...data, [k]: { ...(data[k] || {}), [field]: value } }
  markDirty(k, field); persistLocal(); emit(); schedule()
}
export function setEntry(key, obj) {
  const k = rk(key)
  data = { ...data, [k]: obj }
  markDirty(k, '*'); persistLocal(); emit(); schedule()
}

function schedule() {
  if (DEMO) { dirty.clear(); persistLocal(); return }
  status = 'salvando'; emit()
  clearTimeout(timer); timer = setTimeout(flush, 900)
}

let flushing = false
async function flush() {
  if (!supabase || !uid) return
  if (!dirty.size) { status = 'salvo'; emit(); return }
  if (flushing) { clearTimeout(timer); timer = setTimeout(flush, 600); return }
  flushing = true
  const sent = {}
  dirty.forEach((fs, k) => { sent[k] = fs === '*' ? { ...(data[k] || {}) } : localPart(k) })
  const replace = [...dirty].filter(([, fs]) => fs === '*').map(([k]) => k)
  const { error } = await supabase.rpc('merge_entries', { p: sent, p_replace: replace })
  flushing = false
  if (error) {
    status = /row-level|permission|policy|acesso/i.test(error.message) ? 'sem-acesso' : 'offline'
  } else {
    // remove só o que não mudou enquanto a requisição estava no ar
    for (const [k, patch] of Object.entries(sent)) {
      const fs = dirty.get(k); if (!fs) continue
      if (fs === '*') { if (JSON.stringify(data[k]) === JSON.stringify(patch)) dirty.delete(k); continue }
      for (const f of Object.keys(patch)) if (data[k] && data[k][f] === patch[f]) fs.delete(f)
      for (const f of [...fs]) if (!(data[k] && f in data[k])) fs.delete(f)
      if (!fs.size) dirty.delete(k)
    }
    status = dirty.size ? 'salvando' : 'salvo'
    if (dirty.size) { clearTimeout(timer); timer = setTimeout(flush, 600) }
  }
  persistLocal(); emit()
}
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => { flush(); pull() })
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && !DEMO) pull() })
  setInterval(() => { if (dirty.size && !DEMO) flush() }, 15000)
}

function subscribe(f) { subs.add(f); return () => subs.delete(f) }
export function useStoreVersion() { return useSyncExternalStore(subscribe, () => version) }
export function useEntry(key) { useStoreVersion(); return data[rk(key)] || {} }
export function getEntry(key) { return data[rk(key)] || {} }
// todas as páginas do ano aberto (e as que valem para todos os anos), sem o prefixo do ano. Usado na busca.
export function entradasVisiveis() {
  const out = []
  for (const [k, v] of Object.entries(data)) {
    const m = k.match(/^(\d{4}):(.*)$/)
    if (m) { if (Number(m[1]) === ano) out.push([m[2], v]) }
    else if (ano === ANO_INICIAL || GLOBAL.has(k.split('.')[0])) out.push([k, v])
  }
  return out
}
// lê uma página de outro ano (ex.: dezembro do ano anterior)
export function getEntryAno(key, y) { const base = key.split('.')[0]; return data[GLOBAL.has(base) || y === ANO_INICIAL ? key : `${y}:${key}`] || {} }
export function useLoaded() { useStoreVersion(); return loaded }
export function useStatus() { useStoreVersion(); return status }
export function exportAll() { return JSON.stringify(data, null, 2) }
export function importAll(obj) { for (const k of Object.keys(obj)) { data[k] = obj[k]; dirty.set(k, '*') } data = { ...data }; persistLocal(); emit(); schedule() }
export function clearLocal() { try { localStorage.removeItem(LS()) } catch (e) { /* ok */ } data = {}; dirty = new Map(); emit() }

// helpers de número
export const num = (v) => {
  let s = String(v ?? '').trim(); if (!s) return 0
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.')          // 1.500,50
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '')      // 1.500
  const n = parseFloat(s); return isNaN(n) ? 0 : n
}
export const brl = (n) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
export const int = (n) => Math.round(n).toLocaleString('pt-BR')
