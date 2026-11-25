import { useEffect, useState } from 'react'
import { Ic, Head, Card, Entry, A, T, N, Field } from '../../components/ui'
import { useAuth } from '../../lib/auth'
import { DEMO, PRECO, DIAS_TESTE, supabase } from '../../lib/supabase'
import { Link } from 'react-router-dom'
import Lembretes from '../../components/Lembretes'
import { track } from '../../lib/analytics'
import { exportAll, importAll, clearLocal, setField } from '../../lib/store'
const WHATS = (import.meta.env.VITE_WHATSAPP || '').replace(/\D/g, '')
const EMAIL = import.meta.env.VITE_EMAIL_CONTATO || ''
import { IG_URL } from '../../data/content'
import Preco from '../../components/Preco'
import { AssinarAgora } from '../../lib/bloqueio'

const dataBR = (d) => d ? new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''
const MARCA = 'pdc:checkout'
const marcar = () => { try { localStorage.setItem(MARCA, String(Date.now())) } catch (e) { /* ok */ } }
const voltouDoCheckout = () => { try { return Date.now() - Number(localStorage.getItem(MARCA) || 0) < 45 * 60 * 1000 } catch (e) { return false } }
const limparMarca = () => { try { localStorage.removeItem(MARCA) } catch (e) { /* ok */ } }

// Formulário que abre a página de cartão do Asaas
export function Assinar({ teste = true, botao }) {
  const auth = useAuth()
  const [nome, setNome] = useState(''); const [cpf, setCpf] = useState(''); const [cel, setCel] = useState(''); const [cep, setCep] = useState(''); const [num, setNum] = useState('')
  const [busy, setBusy] = useState(false); const [erro, setErro] = useState('')
  const mascCpf = (v) => v.replace(/\D/g, '').slice(0, 11).replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  const mascCep = (v) => v.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2')
  const mascCel = (v) => v.replace(/\D/g, '').slice(0, 11).replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')
  async function ir(e) {
    e.preventDefault(); setBusy(true); setErro('')
    const { data, error } = await supabase.functions.invoke('asaas-checkout', { body: { nome, cpf, celular: cel, cep, numero: num } })
    if (error || !data?.url) {
      let m = data?.erro
      try { m = m || (await error?.context?.json())?.erro } catch (x) { /* ok */ }
      setBusy(false); setErro(m || 'Não consegui abrir o pagamento agora. Tente de novo em instantes.'); return
    }
    track('checkout'); marcar(); location.href = data.url
  }
  const d8 = new Date(Date.now() + 7 * 864e5).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  return (
    <form className="assinar" onSubmit={ir}>
      <input className="in big" placeholder="Nome completo (como no cartão)" value={nome} onChange={(e) => setNome(e.target.value)} required autoComplete="name" />
      <input className="in big" placeholder="CPF" inputMode="numeric" value={cpf} onChange={(e) => setCpf(mascCpf(e.target.value))} required />
      <input className="in big" placeholder="Celular com DDD" inputMode="tel" value={cel} onChange={(e) => setCel(mascCel(e.target.value))} required autoComplete="tel" />
      <div className="g2 tight"><input className="in big" placeholder="CEP" inputMode="numeric" value={cep} onChange={(e) => setCep(mascCep(e.target.value))} required autoComplete="postal-code" /><input className="in big" placeholder="Número da casa" value={num} onChange={(e) => setNum(e.target.value.slice(0, 10))} required /></div>
      <button className="btn big full" disabled={busy}>{busy ? 'Abrindo o pagamento…' : botao || (teste ? `Começar meus ${DIAS_TESTE} dias grátis` : `Assinar por ${PRECO}/mês`)}</button>
      {erro && <p className="note err">{erro}</p>}
      <p className="mut sm">{teste ? <>Na próxima tela você cadastra o cartão no ambiente seguro do Asaas. <b>Nada é cobrado agora:</b> a 1ª cobrança de {PRECO} acontece em {d8}. Cancele antes, em Perfil › Assinatura, e não paga nada.</> : <>Na próxima tela você cadastra o cartão no ambiente seguro do Asaas. A cobrança de {PRECO} é mensal e você cancela quando quiser.</>}</p>
    </form>
  )
}

// Indique uma amiga: quando ela assinar e pagar a 1ª mensalidade, as duas ganham 1 mês grátis
function Indicar() {
  const { user, sub } = useAuth(); const [lista, setLista] = useState(null); const [ok, setOk] = useState('')
  const codigo = (user?.id || '').slice(0, 8)
  const link = `${location.origin}${location.pathname}#/?ref=${codigo}`
  useEffect(() => { if (user) supabase.from('indicacoes').select('status').then(({ data }) => setLista(data || [])) }, [user?.id])
  async function compartilhar() {
    const texto = `Estou usando o Planner do Criador para organizar meus conteúdos e contratos. Testa 7 dias grátis pelo meu link: ${link}`
    try { if (navigator.share) { await navigator.share({ title: 'Planner do Criador', text: texto }); return } } catch (e) { return }
    try { await navigator.clipboard.writeText(texto); setOk('Link copiado! Cole no WhatsApp ou no Direct.') } catch (e) { setOk(link) }
  }
  const premiadas = (lista || []).filter((x) => x.status === 'premiada').length
  return (
    <Card title="Indique uma amiga" icon="users" color="#10B981">
      <p className="sm">Quando a sua amiga assinar pelo seu link e pagar a 1ª mensalidade, <b>vocês duas ganham 1 mês grátis</b>: a próxima mensalidade de cada uma não é cobrada.</p>
      <div className="ind-l"><code>{link}</code></div>
      <button className="btn full" onClick={compartilhar}><Ic n="send" s={16} /> Compartilhar meu link</button>
      {ok && <p className="note">{ok}</p>}
      {lista && lista.length > 0 && <div className="kv"><span>{lista.length} {lista.length === 1 ? 'amiga indicada' : 'amigas indicadas'} · {premiadas} {premiadas === 1 ? 'já assinou' : 'já assinaram'}</span>{sub?.meses_gratis > 0 && <b>{sub.meses_gratis} {sub.meses_gratis === 1 ? 'mês grátis' : 'meses grátis'} a usar</b>}</div>}
    </Card>
  )
}

const MOTIVOS = ['Está caro para mim agora', 'Não tive tempo de usar', 'Achei difícil de usar', 'Faltou algo que eu precisava', 'Prefiro o PDF ou o papel', 'Outro motivo']
function Cancelar() {
  const auth = useAuth(); const [abrir, setAbrir] = useState(false); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState('')
  const [motivo, setMotivo] = useState(''); const [obs, setObs] = useState('')
  async function cancelar() {
    setBusy(true); setMsg('')
    const { data, error } = await supabase.functions.invoke('asaas-cancelar', { method: 'POST', body: { motivo: [motivo, obs.trim()].filter(Boolean).join(' · ') } })
    setBusy(false)
    if (error || data?.erro) { setMsg(data?.erro || 'Não consegui cancelar agora. Tente de novo em instantes.'); return }
    setAbrir(false); auth.refreshSub()
  }
  if (!abrir) return <button className="btn ghost full danger" onClick={() => setAbrir(true)}>Cancelar assinatura</button>
  return (
    <div className="cancelar">
      <p className="sm">Tem certeza? Você continua usando até o fim do período já liberado e não será cobrada de novo.</p>
      <p className="sm"><b>Pode contar por que está cancelando?</b> Isso ajuda a melhorar o planner.</p>
      <div className="motivos">{MOTIVOS.map((m) => <button key={m} className={'mchip' + (motivo === m ? ' on' : '')} aria-pressed={motivo === m} onClick={() => setMotivo(motivo === m ? '' : m)}>{m}</button>)}</div>
      <textarea className="in ta" rows={2} placeholder="Quer contar mais? (opcional)" value={obs} onChange={(e) => setObs(e.target.value)} />
      <div className="g2 tight"><button className="btn ghost" onClick={() => setAbrir(false)}>Voltar</button><button className="btn danger-f" disabled={busy} onClick={cancelar}>{busy ? 'Cancelando…' : 'Sim, cancelar'}</button></div>
      {msg && <p className="note err">{msg}</p>}
    </div>
  )
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
  const st = sub?.status
  const statusTxt = DEMO ? 'Modo demonstração'
    : st === 'active' ? `Assinatura ativa${sub.current_period_end ? ` · renova em ${dataBR(new Date(new Date(sub.current_period_end).getTime() - 864e5))}` : ''}`
    : st === 'trialing' ? `Teste grátis: ${trialDays} ${trialDays === 1 ? 'dia restante' : 'dias restantes'}${sub.trial_end ? ` · 1ª cobrança em ${dataBR(sub.trial_end)}` : ''}`
    : st === 'canceled' ? (access ? `Cancelada · você usa até ${dataBR(sub.current_period_end)}` : 'Assinatura cancelada')
    : st === 'past_due' ? 'Pagamento não aprovado' : 'Sem assinatura ativa'
  const podeCancelar = !DEMO && sub?.provider === 'asaas' && (st === 'active' || st === 'trialing' || st === 'past_due')
  return (
    <Entry k="capa"><div className="page">
      <Head icon="user" title="Perfil" sub="Este planner é de…" color="var(--pink)" />
      <Card className="persona"><div className="ring big"><div><Ic n="user" s={28} /></div></div>
        <div className="pf"><T f="nome" ph="Seu nome" /><T f="user" ph="@ do seu perfil" /><T f="bio" ph="Bio" /><div className="kv"><span>Meta de seguidores</span><N f="meta" /></div></div></Card>

      <Card title="Assinatura" icon="spark" color="var(--violet)">
        <div className={'subst ' + (access ? 'ok' : 'no')}>{statusTxt}</div>
        {!DEMO && st === 'trialing' && sub?.provider_subscription_id && !sub?.pagou_em && <><p className="mut sm">No teste grátis, os meses à frente, o financeiro avançado e o desafio de 90 dias ficam bloqueados. Quer liberar tudo agora?</p><AssinarAgora /></>}
        {sub?.preco_promo_ate && sub?.valor_apos_promo && <p className="mut sm">Seu preço promocional vale até {dataBR(sub.preco_promo_ate)}. Depois, a mensalidade passa a {Number(sub.valor_apos_promo).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.</p>}
        {podeCancelar && <Cancelar />}
        {!DEMO && (st === 'canceled' || st === 'past_due') && <Assinar teste={false} botao={st === 'past_due' ? 'Atualizar cartão e assinar' : undefined} />}
        {!DEMO && <button className="link sm" onClick={auth.refreshSub}>Atualizar status</button>}
      </Card>

      <Card title="Lembretes" icon="spark" color="var(--pink)"><Lembretes /></Card>


      {!DEMO && <Indicar />}

      <Card title="Precisa de ajuda?" icon="help" color="var(--violet)">
        <p className="mut sm">Ficou com dúvida ou algo não funcionou? Fale com a gente, respondemos rapidinho.</p>
        <div className="g2 tight">
          {WHATS && <a className="btn ghost" href={`https://wa.me/${WHATS}?text=${encodeURIComponent('Oi! Preciso de ajuda com o Planner do Criador.')}`} target="_blank" rel="noreferrer"><Ic n="comment" s={16} /> WhatsApp</a>}
          <a className="btn ghost" href="https://ig.me/m/aritamende.s" target="_blank" rel="noreferrer"><Ic n="send" s={16} /> Direct no Instagram</a>
          {EMAIL && <a className="btn ghost" href={`mailto:${EMAIL}?subject=${encodeURIComponent('Ajuda com o Planner do Criador')}`}><Ic n="at" s={16} /> E-mail</a>}
        </div>
        <button className="link sm" onClick={() => setField('capa', 'tour', false)}>Ver de novo o tour do app</button>
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

export function Paywall() {
  const auth = useAuth(); const st = auth.sub?.status
  const [esperando, setEsperando] = useState(voltouDoCheckout())
  // voltou da página de cartão: espera o aviso do Asaas chegar (normalmente leva segundos)
  useEffect(() => {
    if (!esperando) return
    let n = 0
    const t = setInterval(() => { n++; auth.refreshSub(); if (n >= 20) { clearInterval(t); setEsperando(false); limparMarca() } }, 3000)
    return () => clearInterval(t)
  }, [esperando])
  useEffect(() => { if (auth.access) limparMarca() }, [auth.access])
  const novo = !st || st === 'pendente' || st === 'none' || st === 'trialing'
  return (
    <div className="page paywall">
      <div className="ring big"><div><Ic n={esperando ? 'cloud' : novo ? 'spark' : 'lock'} s={30} /></div></div>
      {esperando ? <>
        <h1>Confirmando seu cartão…</h1>
        <p className="mut">Assim que o Asaas confirmar, o planner abre sozinho. Leva poucos segundos.</p>
        <button className="link sm" onClick={() => { setEsperando(false); limparMarca() }}>Voltar para o formulário</button>
      </> : <>
        <h1>{novo ? `Comece seus ${DIAS_TESTE} dias grátis` : st === 'past_due' ? 'Pagamento não aprovado' : 'Sua assinatura terminou'}</h1>
        <p className="mut">{novo ? 'Cadastre o cartão para liberar o planner completo. Você só paga se continuar depois do teste.' : st === 'past_due' ? 'Não conseguimos cobrar no seu cartão. Cadastre um cartão válido para continuar. Seus dados estão guardados.' : 'Seus dados continuam guardados. Assine de novo para voltar a planejar, gravar e analisar o seu ano.'}</p>
        <div className="price">
          <Preco sufixo={novo ? `/mês depois de ${DIAS_TESTE} dias grátis` : '/mês'} />
          <ul>{['Planner completo, ano após ano', 'Roteiros e ideias ilimitados', 'Somas e retrospectiva automáticas', 'Sincroniza celular e computador', 'Cancele quando quiser, sem multa'].map((x) => <li key={x}><Ic n="check" s={15} w={3} />{x}</li>)}</ul>
          <Assinar teste={novo} />
        </div>
      </>}
      <button className="link" onClick={auth.signOut}>Sair</button>
    </div>
  )
}
