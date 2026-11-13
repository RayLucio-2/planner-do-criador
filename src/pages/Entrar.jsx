import { useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { DEMO, DIAS_TESTE } from '../lib/supabase'
import { Ic } from '../components/ui'
import { track } from '../lib/analytics'
// Cadastro aberto com teste grátis. Para fechar de novo: VITE_CADASTRO=false no Netlify
const CADASTRO = import.meta.env.VITE_CADASTRO !== 'false'

export default function Entrar() {
  const [sp] = useSearchParams()
  const auth = useAuth()
  const [modo, setModo] = useState(sp.get('criar') && CADASTRO ? 'criar' : 'entrar')
  const [email, setEmail] = useState(''); const [senha, setSenha] = useState(''); const [nome, setNome] = useState('')
  const [msg, setMsg] = useState(null); const [busy, setBusy] = useState(false); const [aceite, setAceite] = useState(false)

  const [tipo, setTipo] = useState('signup')   // signup | recovery (qual código estamos esperando)
  const [codigo, setCodigo] = useState('')

  if (auth.user && !auth.recovery) return <Navigate to="/app" replace />
  if (auth.recovery) return <NovaSenha />

  function pedirCodigo(t, texto) { setTipo(t); setCodigo(''); setModo('codigo'); setMsg({ t: texto }) }

  async function go(e) {
    e.preventDefault(); setBusy(true); setMsg(null)
    let r
    if (modo === 'entrar') r = await auth.signIn(email, senha)
    else if (modo === 'criar') r = await auth.signUp(email, senha, nome)
    else r = await auth.reset(email)
    setBusy(false)
    if (r?.error) {
      if (modo === 'entrar' && /Email not confirmed/i.test(r.error.message)) {
        await auth.resendCode(email, 'signup')
        return pedirCodigo('signup', `Sua conta ainda não foi confirmada. Enviamos um código para ${email}.`)
      }
      return setMsg({ erro: true, t: traduz(r.error.message) })
    }
    if (modo === 'criar') {
      track('cadastro'); track('teste')
      if (!r.data?.session) pedirCodigo('signup', `Enviamos um e-mail para ${email}. Digite o código que veio nele ou toque no link do e-mail para ativar sua conta.`)
    }
    if (modo === 'esqueci') pedirCodigo('recovery', `Enviamos um e-mail para ${email}. Digite o código que veio nele ou toque no link do e-mail para criar uma nova senha.`)
  }

  async function confirmar(e) {
    e.preventDefault(); setBusy(true); setMsg(null)
    if (tipo === 'recovery') auth.setRecovery(true)
    const r = await auth.verifyCode(email, codigo.trim(), tipo)
    setBusy(false)
    if (r.error) { if (tipo === 'recovery') auth.setRecovery(false); setMsg({ erro: true, t: traduz(r.error.message) }) }
  }
  async function reenviar() {
    setBusy(true); const r = await auth.resendCode(email, tipo); setBusy(false)
    setMsg(r?.error ? { erro: true, t: traduz(r.error.message) } : { t: 'Enviamos um novo código. Confira também a caixa de spam.' })
  }

  return (
    <div className="auth">
      <Link to="/" className="brand">planner<i>.</i>do<i>.</i>criador</Link>
      <div className="auth-card">
        <div className="ring big"><div><Ic n="user" s={30} /></div></div>
        {DEMO ? (
          <>
            <h1>Modo demonstração</h1>
            <p className="mut">O app ainda não foi ligado ao Supabase, então tudo fica salvo só neste aparelho. Use para testar o planner.</p>
            <button className="btn big full" onClick={() => auth.signIn()}>Entrar na demonstração</button>
          </>
        ) : (
          <>
            {modo === 'codigo' ? (
              <>
                <h1>Digite o código</h1>
                {msg && <div className={'note' + (msg.erro ? ' err' : '')}>{msg.t}</div>}
                <form onSubmit={confirmar}>
                  <input className="in big codigo" inputMode="numeric" autoComplete="one-time-code" placeholder="000000" maxLength={10}
                    value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))} required minLength={6} autoFocus />
                  <button className="btn big full" disabled={busy || codigo.length < 6}>{busy ? 'Conferindo…' : tipo === 'signup' ? 'Ativar minha conta' : 'Continuar'}</button>
                </form>
                <button className="link" onClick={reenviar} disabled={busy}>Não chegou? Enviar outro código</button>
                <button className="link" onClick={() => { setModo('entrar'); setMsg(null) }}>Voltar</button>
              </>
            ) : (<>
            <div className="seg">
              <button className={modo === 'entrar' ? 'on' : ''} onClick={() => setModo('entrar')}>Entrar</button>
              {CADASTRO && <button className={modo === 'criar' ? 'on' : ''} onClick={() => setModo('criar')}>Criar conta</button>}
            </div>
            {!CADASTRO && modo === 'entrar' && <p className="mut sm">O app ainda não foi lançado. Este acesso é só para a equipe. <Link to="/">Entre na lista de espera</Link>.</p>}
            {CADASTRO && modo === 'entrar' && <p className="mut sm">Ainda não tem conta? Toque em “Criar conta” e use {DIAS_TESTE} dias grátis.</p>}
            {modo === 'criar' && <p className="mut sm">Depois de criar a conta, você ativa os {DIAS_TESTE} dias grátis com o cartão. A 1ª cobrança só acontece no 8º dia, e você pode cancelar antes.</p>}
            {modo === 'esqueci' && <p className="mut sm">Digite seu e-mail e enviaremos um código para criar uma nova senha.</p>}
            <form onSubmit={go}>
              {modo === 'criar' && <input className="in big" placeholder="Seu nome" value={nome} onChange={(e) => setNome(e.target.value)} required />}
              <input className="in big" type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
              {modo !== 'esqueci' && <input className="in big" type="password" placeholder={modo === 'criar' ? 'Crie uma senha (mínimo 8 caracteres)' : 'Senha'} value={senha} onChange={(e) => setSenha(e.target.value)} required minLength={modo === 'criar' ? 8 : 6} autoComplete={modo === 'criar' ? 'new-password' : 'current-password'} />}
              {modo === 'criar' && <label className={'ck aceite' + (aceite ? ' on' : '')}><input type="checkbox" checked={aceite} onChange={(e) => setAceite(e.target.checked)} required /><span className="box"><Ic n="check" s={12} w={3} /></span><span className="ckl2">Li e aceito os <Link to="/termos">Termos de uso</Link> e a <Link to="/privacidade">Política de privacidade</Link></span></label>}
              <button className="btn big full" disabled={busy || (modo === 'criar' && !aceite)}>{busy ? 'Aguarde…' : modo === 'entrar' ? 'Entrar' : modo === 'criar' ? 'Criar conta grátis' : 'Enviar código'}</button>
            </form>
            {msg && <div className={'note' + (msg.erro ? ' err' : '')}>{msg.t}</div>}
            {modo === 'entrar' && <button className="link" onClick={() => setModo('esqueci')}>Esqueci minha senha</button>}
            {modo === 'esqueci' && <button className="link" onClick={() => setModo('entrar')}>Voltar para entrar</button>}
            </>)}
          </>
        )}
      </div>
    </div>
  )
}

function NovaSenha() {
  const auth = useAuth(); const [s, setS] = useState(''); const [ok, setOk] = useState(null)
  async function go(e) { e.preventDefault(); const r = await auth.newPassword(s); if (r.error) setOk(traduz(r.error.message)); else { auth.setRecovery(false) } }
  return (
    <div className="auth"><div className="auth-card">
      <h1>Criar nova senha</h1>
      <form onSubmit={go}><input className="in big" type="password" placeholder="Nova senha" value={s} onChange={(e) => setS(e.target.value)} minLength={8} required /><button className="btn big full">Salvar senha</button></form>
      {ok && <div className="note err">{ok}</div>}
    </div></div>
  )
}

function traduz(m) {
  if (/Invalid login/i.test(m)) return 'E-mail ou senha incorretos.'
  if (/already registered/i.test(m)) return 'Este e-mail já tem conta. Use “Entrar”.'
  if (/Email not confirmed/i.test(m)) return 'Confirme seu e-mail com o código que enviamos antes de entrar.'
  if (/expired|invalid.*(otp|token)|token.*(invalid|expired)/i.test(m)) return 'Código errado ou vencido. Confira os números ou peça um novo código.'
  if (/Password should|weak|pwned/i.test(m)) return 'Essa senha é fraca ou já apareceu em vazamentos. Use pelo menos 8 caracteres, com letras e números.'
  if (/rate limit|too many/i.test(m)) return 'Muitas tentativas seguidas. Espere alguns minutos e tente de novo.'
  return m
}
