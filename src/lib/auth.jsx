import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, DEMO } from './supabase'
import { loadStore, resetStore, clearLocal } from './store'

const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined) // undefined = carregando
  const [sub, setSub] = useState(null)
  const [recovery, setRecovery] = useState(false)

  useEffect(() => {
    if (DEMO) {
      let on = false; try { on = !!localStorage.getItem('pdc:demo') } catch (e) { /* sem storage */ }
      setUser(on ? { id: 'demo', email: 'demo@planner' } : null)
      return
    }
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null))
    const { data: l } = supabase.auth.onAuthStateChange((ev, session) => {
      if (ev === 'PASSWORD_RECOVERY') setRecovery(true)
      setUser(session?.user ?? null)
    })
    return () => l.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) { resetStore(); setSub(null); return }
    loadStore(user.id)
    refreshSub()
  }, [user?.id])

  async function refreshSub() {
    if (DEMO || !user) { setSub({ status: 'demo' }); return }
    const { data } = await supabase.from('subscriptions').select('*').eq('user_id', user.id).maybeSingle()
    setSub(data || { status: 'none' })
  }

  const now = Date.now()
  const access = DEMO || !!sub && (
    (sub.status === 'active' && (!sub.current_period_end || new Date(sub.current_period_end).getTime() > now - 3 * 864e5)) ||
    (sub.status === 'trialing' && sub.trial_end && new Date(sub.trial_end).getTime() > now) ||
    (sub.status === 'canceled' && sub.current_period_end && new Date(sub.current_period_end).getTime() > now)
  )
  const trialDays = sub?.status === 'trialing' && sub.trial_end ? Math.max(0, Math.ceil((new Date(sub.trial_end) - now) / 864e5)) : null

  const value = {
    user, sub, access, trialDays, recovery, setRecovery, refreshSub,
    async signIn(email, password) {
      if (DEMO) { try { localStorage.setItem('pdc:demo', '1') } catch (e) { /* ok */ } setUser({ id: 'demo', email: 'demo@planner' }); return {} }
      return supabase.auth.signInWithPassword({ email, password })
    },
    async signUp(email, password, nome) {
      if (DEMO) return value.signIn()
      return supabase.auth.signUp({ email, password, options: { data: { nome, termos: 'sim' }, emailRedirectTo: location.origin + location.pathname } })
    },
    async reset(email) {
      return supabase.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname })
    },
    async newPassword(password) { return supabase.auth.updateUser({ password }) },
    async signOut() {
      if (DEMO) { try { localStorage.removeItem('pdc:demo') } catch (e) { /* ok */ } setUser(null); return }
      clearLocal()   // não deixa cópia dos dados no aparelho depois de sair
      try { localStorage.removeItem('pdc:ano') } catch (e) { /* ok */ }
      await supabase.auth.signOut(); setUser(null)
    },
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
