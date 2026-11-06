import { useState } from 'react'
import { Ic, Head, Card, Entry, A, T, N, Field } from '../../components/ui'
import { useAuth } from '../../lib/auth'
import { DEMO, CHECKOUT_URL, PORTAL_URL, PRECO, DIAS_TESTE, supabase } from '../../lib/supabase'
import { Link } from 'react-router-dom'
import Lembretes from '../../components/Lembretes'
import { track } from '../../lib/analytics'
import { exportAll, importAll, clearLocal } from '../../lib/store'
import { IG_URL } from '../../data/content'

export function checkoutLink(user) {
  if (!CHECKOUT_URL) return ''
  const u = new URL(CHECKOUT_URL)
  if (user?.id) u.searchParams.set('client_reference_id', user.id)
  if (user?.email) u.searchParams.set('prefilled_email', user.email)
  return u.toString()
}

export default function Perfil() {
  const auth = useAuth(); const { user, sub, trialDays, access } = auth
  const [msg, setMsg] = useState('')
  function baixar() {
    const blob = new Blob([exportAll()], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'planner-do-criador-backup.json'; a.click()
  }
  function importar(e) {
    const f = e.target.files[0]; if (!f) return
    f.text().then((t) => { try { importAll(JSON.parse(t)); setMsg('Backup importado!') } catch { setMsg('Arquivo inválido.') } })
  }
  const statusTxt = DEMO ? 'Modo demonstração' : sub?.status === 'active' ? 'Assinatura ativa' : sub?.status === 'trialing' ? `Teste grátis: ${trialDays} ${trialDays === 1 ? 'dia restante' : 'dias restantes'}` : sub?.status === 'canceled' ? 'Assinatura cancelada' : 'Sem assinatura ativa'
  return (
    <Entry k="capa"><div className="page">
      <Head icon="user" title="Perfil" sub="Este planner é de…" color="var(--pink)" />
      <Card className="persona"><div className="ring big"><div><Ic n="user" s={28} /></div></div>
        <div className="pf"><T f="nome" ph="Seu nome" /><T f="user" ph="@ do seu perfil" /><T f="bio" ph="Bio" /><div className="kv"><span>Meta de seguidores</span><N f="meta" /></div></div></Card>

      <Card title="Assinatura" icon="spark" color="var(--violet)">
        <div className={'subst ' + (access ? 'ok' : 'no')}>{statusTxt}</div>
        {!DEMO && sub?.status !== 'active' && (CHECKOUT_URL ? <a className="btn full" href={checkoutLink(user)} onClick={() => track('checkout')}>Assinar por {PRECO}/mês</a> : <p className="mut sm">Link de pagamento ainda não configurado (VITE_CHECKOUT_URL).</p>)}
        {!DEMO && sub?.status === 'active' && PORTAL_URL && <a className="btn ghost full" href={PORTAL_URL} target="_blank" rel="noreferrer">Gerenciar ou cancelar assinatura</a>}
        {!DEMO && <button className="link sm" onClick={auth.refreshSub}>Já paguei, atualizar status</button>}
      </Card>

      <Card title="Lembretes" icon="spark" color="var(--pink)"><Lembretes /></Card>

      <Card title="Instalar como app" icon="download" color="#10B981">
        <p className="sm"><b>Android (Chrome):</b> menu ⋮ › “Instalar app” ou “Adicionar à tela inicial”.</p>
        <p className="sm"><b>iPhone (Safari):</b> botão compartilhar › “Adicionar à Tela de Início”.</p>
        <InstallBtn />
      </Card>

      <Card title="Backup" icon="cloud" color="#3B82F6">
        <p className="mut sm">{DEMO ? 'Na demonstração os dados ficam só neste aparelho. Baixe um backup para não perder.' : 'Seus dados já ficam salvos na sua conta. O backup é uma cópia extra.'}</p>
        <div className="g2 tight"><button className="btn ghost" onClick={baixar}><Ic n="download" s={16} /> Baixar backup</button><label className="btn ghost"><Ic n="cloud" s={16} /> Importar<input type="file" accept="application/json" hidden onChange={importar} /></label></div>
        {msg && <p className="note">{msg}</p>}
      </Card>

      <Card>
        <p className="sm mut">Conectado como {user?.email}</p>
        <a className="igb big" href={IG_URL} target="_blank" rel="noreferrer"><Ic n="at" s={15} w={2.2} /> @aritamende.s</a>
        <button className="btn ghost full" onClick={auth.signOut}>Sair</button>
        <p className="mut sm legal-l"><Link to="/termos">Termos de uso</Link> · <Link to="/privacidade">Política de privacidade</Link></p>
      </Card>
      <Excluir />
    </div></Entry>
  )
}

function Excluir() {
  const auth = useAuth(); const [abrir, setAbrir] = useState(false); const [txt, setTxt] = useState(''); const [busy, setBusy] = useState(false); const [erro, setErro] = useState('')
  async function excluir() {
    setBusy(true); setErro('')
    if (!DEMO) {
      const { data, error } = await supabase.functions.invoke('excluir-conta', { method: 'POST' })
      if (error || data?.erro) { setBusy(false); setErro(data?.erro || 'Não consegui excluir agora. Tente de novo em alguns minutos.'); return }
    }
    clearLocal(); await auth.signOut()
  }
  return (
    <Card title="Excluir minha conta" icon="trash" color="#E11D48">
      {!abrir ? <><p className="mut sm">Cancela a assinatura e apaga a sua conta e tudo o que você escreveu. Não dá para desfazer. Se quiser guardar uma cópia, baixe o backup antes.</p>
        <button className="btn ghost full danger" onClick={() => setAbrir(true)}>Quero excluir minha conta</button></> : (
        <>
          <p className="sm">Para confirmar, digite <b>EXCLUIR</b> abaixo.</p>
          <input className="in" value={txt} onChange={(e) => setTxt(e.target.value)} placeholder="EXCLUIR" />
          <div className="g2 tight"><button className="btn ghost" onClick={() => { setAbrir(false); setTxt('') }}>Cancelar</button>
            <button className="btn danger-f" disabled={txt.trim().toUpperCase() !== 'EXCLUIR' || busy} onClick={excluir}>{busy ? 'Excluindo…' : 'Excluir para sempre'}</button></div>
          {erro && <p className="note err">{erro}</p>}
        </>
      )}
    </Card>
  )
}

let deferred = null
if (typeof window !== 'undefined') window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e })
function InstallBtn() {
  const [ok, setOk] = useState(!!deferred)
  if (!ok && !deferred) return null
  return <button className="btn full" onClick={async () => { deferred.prompt(); await deferred.userChoice; deferred = null; setOk(false) }}>Instalar agora</button>
}

export function Paywall() {
  const auth = useAuth(); const link = checkoutLink(auth.user)
  return (
    <div className="page paywall">
      <div className="ring big"><div><Ic n="lock" s={30} /></div></div>
      <h1>Seu teste grátis terminou</h1>
      <p className="mut">Seus dados continuam guardados. Assine para continuar planejando, gravando e analisando o seu ano.</p>
      <div className="price"><div className="pv"><b>{PRECO}</b><span>/mês</span></div>
        <ul>{['Planner completo, ano após ano', 'Roteiros e ideias ilimitados', 'Somas e retrospectiva automáticas', 'Sincroniza celular e computador'].map((x) => <li key={x}><Ic n="check" s={15} w={3} />{x}</li>)}</ul>
        {link ? <a className="btn big full" href={link} onClick={() => track('checkout')}>Assinar agora</a> : <p className="mut sm">Link de pagamento ainda não configurado.</p>}
        <button className="link sm" onClick={auth.refreshSub}>Já paguei, atualizar</button>
      </div>
      <button className="link" onClick={auth.signOut}>Sair</button>
    </div>
  )
}
