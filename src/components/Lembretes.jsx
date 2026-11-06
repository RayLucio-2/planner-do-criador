import { useEffect, useState } from 'react'
import { Ic } from './ui'
import { useAuth } from '../lib/auth'
import { DEMO } from '../lib/supabase'
import { pushSuportado, ehIOS, instalado, lembreteAtual, ativarLembretes, atualizarLembrete, desativarLembretes } from '../lib/push'

export default function Lembretes({ compacto }) {
  const { user } = useAuth()
  const [sub, setSub] = useState(null); const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false)
  const [hora, setHora] = useState(9)
  useEffect(() => { if (user && pushSuportado()) lembreteAtual(user.id).then((s) => { setSub(s); if (s) setHora(s.hora) }).catch(() => {}) }, [user?.id])

  if (DEMO) return <p className="mut sm">Os lembretes funcionam no app publicado com a sua conta. Na demonstração eles ficam desligados.</p>
  if (ehIOS() && !instalado()) return <p className="sm"><b>No iPhone</b>, os lembretes só funcionam com o app instalado: toque em compartilhar › “Adicionar à Tela de Início”, abra pelo ícone e volte aqui.</p>
  if (!pushSuportado()) return <p className="mut sm">Este navegador não aceita notificações. Use o Chrome no Android ou o app instalado no iPhone.</p>

  async function ligar() {
    setBusy(true); setMsg('')
    try { const r = await ativarLembretes(user.id, { hora }); setSub(r); setMsg('Pronto! Você vai receber os lembretes.') } catch (e) { setMsg(e.message) }
    setBusy(false)
  }
  async function mudar(c) { const n = { ...sub, ...c }; setSub(n); await atualizarLembrete(sub.endpoint, c) }

  return (
    <div className="lemb">
      {!sub ? (
        <>
          {!compacto && <p className="sm">Receba no celular o post planejado do dia e um aviso para fazer a Análise no último dia do mês.</p>}
          <div className="kv"><span>Horário do lembrete</span><HoraSel v={hora} on={setHora} /></div>
          <button className="btn full" onClick={ligar} disabled={busy}><Ic n="spark" s={16} /> {busy ? 'Ativando…' : 'Ativar lembretes'}</button>
        </>
      ) : (
        <>
          <div className="subst ok">Lembretes ativos neste aparelho</div>
          <div className="kv"><span>Horário</span><HoraSel v={sub.hora} on={(h) => mudar({ hora: h })} /></div>
          <Tog l="Post do dia" v={sub.post_do_dia} on={(v) => mudar({ post_do_dia: v })} />
          <Tog l="Análise no fim do mês" v={sub.fim_do_mes} on={(v) => mudar({ fim_do_mes: v })} />
          <button className="link sm" onClick={async () => { await desativarLembretes(); setSub(null) }}>Desativar neste aparelho</button>
        </>
      )}
      {msg && <p className="note">{msg}</p>}
    </div>
  )
}
function HoraSel({ v, on }) {
  return <select className="in sel hsel" value={v} onChange={(e) => on(Number(e.target.value))}>{Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>)}</select>
}
function Tog({ l, v, on }) {
  return <label className="tog"><span>{l}</span><input type="checkbox" checked={!!v} onChange={(e) => on(e.target.checked)} /><i /></label>
}
