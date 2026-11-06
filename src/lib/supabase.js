import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// Sem as chaves, o app roda em "modo demonstração": tudo fica salvo só no aparelho.
export const DEMO = !url || !key
export const supabase = DEMO ? null : createClient(url, key, {
  auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})

export const CHECKOUT_URL = import.meta.env.VITE_CHECKOUT_URL || ''   // link de pagamento (ex.: Stripe Payment Link)
export const PORTAL_URL = import.meta.env.VITE_PORTAL_URL || ''       // portal para a pessoa gerenciar/cancelar
export const PRECO = import.meta.env.VITE_PRECO || 'R$ 19,90'
export const DIAS_TESTE = import.meta.env.VITE_DIAS_TESTE || '7'
