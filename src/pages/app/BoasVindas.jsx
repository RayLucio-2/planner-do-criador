import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ic, T, A, Entry, useF } from '../../components/ui'
import { setField, useEntry } from '../../lib/store'
import { AREAS } from '../../data/content'
import Lembretes from '../../components/Lembretes'

const PASSOS = ['Seu perfil', 'Seu público', 'Onde você está', 'Lembretes']

export default function BoasVindas() {
  const [p, setP] = useState(0); const nav = useNavigate()
  const capa = useEntry('capa')
  const fim = () => { setField('capa', 'onboarded', true); nav('/app', { replace: true }) }
  const prox = () => (p < PASSOS.length - 1 ? setP(p + 1) : fim())
  return (
    <div className="ob">
      <div className="ob-top">
        <div className="ob-bars">{PASSOS.map((_, i) => <i key={i} className={i <= p ? 'on' : ''} />)}</div>
        <button className="link sm" onClick={fim}>Pular por agora</button>
      </div>
      <span className="ob-k">passo {p + 1} de {PASSOS.length} · {PASSOS[p]}</span>

      {p === 0 && (
        <Entry k="capa"><div className="ob-c">
          <div className="ring big"><div><span>{(capa.nome || 'eu').slice(0, 2)}</span></div></div>
          <h1>Boas-vindas ao seu planner!</h1>
          <p className="mut">Primeiro, como você aparece nas redes.</p>
          <T f="nome" ph="Seu nome" className="big" />
          <T f="user" ph="@ do seu perfil" className="big" />
          <T f="bio" ph="Sua bio (opcional)" className="big" />
        </div></Entry>
      )}
      {p === 1 && (
        <Entry k="publico"><div className="ob-c">
          <div className="ring big"><div><Ic n="users" s={30} /></div></div>
          <h1>Para quem você cria?</h1>
          <p className="mut">Uma pessoa específica, não “todo mundo”. Quanto mais clara, mais fácil escrever para ela.</p>
          <A f="quem" rows={3} ph="Ex.: donas de pequenos negócios que querem vender mais pelo Instagram e não têm tempo de gravar" />
          <A f="maior" rows={2} ph="A maior dor dessa pessoa, numa frase" />
        </div></Entry>
      )}
      {p === 2 && (
        <Entry k="hoje"><div className="ob-c">
          <div className="ring big"><div><Ic n="target" s={30} /></div></div>
          <h1>Onde você está hoje?</h1>
          <p className="mut">Dê uma nota de 0 a 10 para cada área, sem pensar muito. Em dezembro você compara.</p>
          <div className="ob-areas">{AREAS.map(([k, l]) => <Nota key={k} k={k} l={l} />)}</div>
        </div></Entry>
      )}
      {p === 3 && (
        <div className="ob-c">
          <div className="ring big"><div><Ic n="spark" s={30} /></div></div>
          <h1>Quer um lembrete por dia?</h1>
          <p className="mut">A gente avisa no celular o post planejado do dia e lembra da análise no fim do mês.</p>
          <Lembretes compacto />
        </div>
      )}

      <div className="ob-ft">
        {p > 0 ? <button className="btn ghost" onClick={() => setP(p - 1)}><Ic n="left" s={16} /> Voltar</button> : <span />}
        <button className="btn big" onClick={prox}>{p < PASSOS.length - 1 ? 'Continuar' : 'Começar meu planner'} <Ic n="right" s={16} w={2.6} /></button>
      </div>
    </div>
  )
}
function Nota({ k, l }) {
  const [v, set] = useF(`${k}.nota`)
  return (
    <div className="ob-n"><div className="area-h"><b>{l}</b><span className="nota">{v === '' ? '–' : v}</span></div>
      <div className="scale">{Array.from({ length: 11 }).map((_, i) => <button key={i} className={String(v) === String(i) ? 'on' : ''} onClick={() => set(String(i))}>{i}</button>)}</div></div>
  )
}
