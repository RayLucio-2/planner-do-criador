import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// Sem as chaves, o app roda em "modo demonstração": tudo fica salvo só no aparelho.
export const DEMO = !url || !key
export const supabase = DEMO ? null : createClient(url, key, {
  auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})

// Promoção: preço "de" riscado e nome da campanha. Com VITE_PROMO_ATE (AAAA-MM-DD), ela termina sozinha
// às 23h59 desse dia (horário de Brasília) e o site volta para o preço "de".
const PROMO_ATE = import.meta.env.VITE_PROMO_ATE || ''
export const PROMO_ATIVA = !!import.meta.env.VITE_PROMO && (!PROMO_ATE || Date.now() <= new Date(`${PROMO_ATE}T23:59:59-03:00`).getTime())
const ddmm = (s) => s ? `${s.slice(8, 10)}/${s.slice(5, 7)}` : ''
export const PRECO = PROMO_ATIVA ? (import.meta.env.VITE_PRECO || 'R$ 19,90') : (import.meta.env.VITE_PRECO_DE || import.meta.env.VITE_PRECO || 'R$ 19,90')
export const PRECO_DE = PROMO_ATIVA ? (import.meta.env.VITE_PRECO_DE || '') : ''
export const PROMO = PROMO_ATIVA ? `${import.meta.env.VITE_PROMO}${PROMO_ATE ? ` até ${ddmm(PROMO_ATE)}` : ''}` : ''
// quanto tempo o preço da promoção vale para quem assina durante ela
export const PROMO_MESES = 12
export const PRECO_PDF = import.meta.env.VITE_PRECO_PDF || 'R$ 8,99'
export const DIAS_TESTE = import.meta.env.VITE_DIAS_TESTE || '7'
