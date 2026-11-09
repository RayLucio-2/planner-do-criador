// Página aberta pelo link do e-mail de convite: confirma o convite e pede para a pessoa criar a senha.
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Ic } from '../components/ui'

export default function Convite() {
  const [sp] = useSearchParams(); const nav = useNavigate()
  const [etapa, setEtapa] = useState('conferindo')   // conferindo | senha | erro
  const [senha, setSenha] = useState(''); const [nome, setNome] = useState('')
  const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false)
  const feito = useRef(false)

  useEffect(() => {
    if (feito.current) return; feito.current = true
    const token_hash = sp.get('token_hash'); const type = sp.get('type') || 'invite'
    if (!supabase || !token_hash) { setEtapa('erro'); return }
    supabase.auth.verifyOtp({ token_hash, type }).then(({ data, error }) => {
      if (error) { setEtapa('erro'); return }
      setNome(data.user?.user_metadata?.nome || ''); setEtapa('senha')
    })
  }, [])

  async function salvar(e) {
    e.preventDefault(); setBusy(true); setMsg('')
    const { error } = await supabase.auth.updateUser({ password: senha, data: { nome, termos: 'sim' } })
    setBusy(false)
    if (error) { setMsg(/weak|should/i.test(error.message) ? 'Use uma senha com pelo menos 8 caracteres.' : error.message); return }
    nav('/boas-vindas', { replace: true })
  }

  return (
    <div className="auth">
      <Link to="/" className="brand">planner<i>.</i>do<i>.</i>criador</Link>
      <div className="auth-card">
        <div className="ring big"><div><Ic n={etapa === 'erro' ? 'x' : 'spark'} s={30} /></div></div>
        {etapa === 'conferindo' && <><h1>Abrindo seu convite…</h1><p className="mut">Só um instante.</p></>}
        {etapa === 'erro' && <>
          <h1>Convite vencido</h1>
          <p className="mut">Este link já foi usado ou passou do prazo. Peça um novo convite para quem te enviou ou entre com seu e-mail e senha.</p>
          <Link to="/entrar" className="btn big full">Ir para o login</Link>
        </>}
        {etapa === 'senha' && <>
          <h1>Boas-vindas ao planner!</h1>
          <p className="mut">Seu convite foi aceito. Agora crie a sua senha para entrar sempre que quiser.</p>
          <form onSubmit={salvar}>
            <input className="in big" placeholder="Seu nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
            <input className="in big" type="password" placeholder="Crie uma senha (mínimo 8 caracteres)" value={senha} onChange={(e) => setSenha(e.target.value)} minLength={8} required autoComplete="new-password" />
            <p className="mut sm">Ao continuar, você aceita os <Link to="/termos">Termos de uso</Link> e a <Link to="/privacidade">Política de privacidade</Link>.</p>
            <button className="btn big full" disabled={busy}>{busy ? 'Salvando…' : 'Criar senha e entrar'}</button>
          </form>
          {msg && <div className="note err">{msg}</div>}
        </>}
      </div>
    </div>
  )
}
