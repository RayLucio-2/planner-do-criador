import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// Sem as chaves, o app roda em "modo demonstração": tudo fica salvo só no aparelho.
export const DEMO = !url || !key
export const supabase = DEMO ? null : createClient(url, key, {
  auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})

export const PRECO = import.meta.env.VITE_PRECO || 'R$ 19,90'
// Promoção: preço "de" riscado e nome da campanha. Para encerrar, apague VITE_PRECO_DE e VITE_PROMO no netlify.toml
export const PRECO_DE = import.meta.env.VITE_PRECO_DE || ''
export const PROMO = import.meta.env.VITE_PROMO || ''
export const PRECO_PDF = import.meta.env.VITE_PRECO_PDF || 'R$ 8,99'
export const DIAS_TESTE = import.meta.env.VITE_DIAS_TESTE || '7'
