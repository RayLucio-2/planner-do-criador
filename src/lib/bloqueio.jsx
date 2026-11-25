// O que fica bloqueado no teste grátis (libera quando a 1ª mensalidade é paga)
import { useState } from 'react'
import { useAuth } from './auth'
import { DEMO, supabase } from './supabase'
import { Ic } from '../components/ui'

export function useBloqueio() {
  const { sub } = useAuth()
  const emTeste = import.meta.env.VITE_TESTE_BLOQUEIO === '1' || (!DEMO && !!sub && sub.status !== 'active' && !sub.pagou_em)
  const h = new Date(); const y = h.getFullYear(), mo = h.getMonth() + 1
  const [py, pm] = mo === 12 ? [y + 1, 1] : [y, mo + 1]
  // no teste: só o mês atual e o próximo
  const mesLiberado = (n, ano) => !emTeste || (ano === y && n === mo) || (ano === py && n === pm)
  return { emTeste, mesLiberado }
}

// botão que encerra o teste e cobra a 1ª mensalidade agora
export function AssinarAgora({ full = true }) {
  const auth = useAuth(); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState(null); const [confirma, setConfirma] = useState(false)
  async function go() {
    setBusy(true); setMsg(null)
    const { data, error } = await supabase.functions.invoke('asaas-assinar-agora', { method: 'POST' })
    if (data?.url) { setMsg({ t: 'Abrindo a fatura para você pagar com o cartão…' }); location.href = data.url; return }
    if (error || data?.erro) { setBusy(false); let m = data?.erro; try { m = m || (await error?.context?.json())?.erro } catch (e) { /* ok */ } setMsg({ erro: true, t: m || 'Não consegui cobrar agora. Tente de novo em instantes.' }); return }
    // espera o Asaas confirmar
    for (let i = 0; i < 10; i++) { await auth.refreshSub(); await new Promise((r) => setTimeout(r, 2500)) }
    setBusy(false); setMsg({ t: 'Pagamento enviado! Assim que o Asaas confirmar, tudo fica liberado.' })
  }
  if (!confirma) return <button className={'btn big' + (full ? ' full' : '')} onClick={() => setConfirma(true)}><Ic n="spark" s={16} /> Assinar agora e liberar tudo</button>
  return (
    <div className="assinar-agora">
      <p className="sm">Seu teste grátis termina agora e a 1ª mensalidade é cobrada hoje no cartão que você cadastrou. Tudo fica liberado na hora.</p>
      <div className="g2 tight"><button className="btn ghost" onClick={() => setConfirma(false)} disabled={busy}>Voltar</button><button className="btn" onClick={go} disabled={busy}>{busy ? 'Cobrando…' : 'Confirmar e liberar'}</button></div>
      {msg && <p className={'note' + (msg.erro ? ' err' : '')}>{msg.t}</p>}
    </div>
  )
}

export function Bloqueado({ titulo = 'Disponível para assinantes', texto }) {
  const { trialDays } = useAuth()
  return (
    <section className="card bloq">
      <div className="ring big"><div><Ic n="lock" s={26} /></div></div>
      <b>{titulo}</b>
      <p className="mut">{texto || 'Você está no teste grátis. Esta parte libera quando a 1ª mensalidade for paga.'}{trialDays != null ? ` Faltam ${trialDays} ${trialDays === 1 ? 'dia' : 'dias'} para a 1ª cobrança.` : ''}</p>
      <AssinarAgora />
    </section>
  )
}
