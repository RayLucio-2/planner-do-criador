// Desafio de 60 dias de conteúdo: uma tarefa por dia, com progresso, sequência e anotação do que foi postado
import { useEffect, useRef } from 'react'
import { Ic, Head, Card, Entry } from '../../components/ui'
import { useEntry, setField } from '../../lib/store'
import { DESAFIO60, D60 } from '../../data/content'
import { useBloqueio, Bloqueado } from '../../lib/bloqueio'

const hojeISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
const deISO = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }
// em que dia do desafio a pessoa está hoje (1 a 60), ou null se ainda não começou
export function diaDoDesafio(inicio) {
  if (!inicio) return null
  const n = Math.round((deISO(hojeISO()) - deISO(inicio)) / 864e5) + 1
  return n < 1 ? 0 : Math.min(n, 60)
}
const REGRAS = ['Uma tarefa por dia. Nem todo dia é postar: alguns são para gravar em lote ou analisar.', 'Feito é melhor que perfeito. Melhorar 1% por dia já muda tudo em 60 dias.', 'Perdeu um dia? Continue de onde parou, sem recomeçar do zero.', 'Anote o que postou. No fim, compare o dia 1 com o dia 60.']

export default function Desafio60() {
  const { emTeste } = useBloqueio()
  return (
    <div className="page">
      <Head icon="flag" title="Desafio de 60 dias" sub="Um conteúdo por dia, do primeiro post à primeira venda" kicker="desafio" color="#FF3D77" back="/app/guia" />
      {emTeste ? <Bloqueado titulo="O desafio de 60 dias é para assinantes" texto="As 60 tarefas, com progresso e sequência, liberam quando a 1ª mensalidade for paga." /> : <Entry k="d60"><Conteudo /></Entry>}
    </div>
  )
}

function Conteudo() {
  const d = useEntry('d60')
  const dia = diaDoDesafio(d.inicio)
  const feitos = D60.filter((x) => d[`${x.n}.ok`]).length
  // sequência: dias seguidos feitos até hoje (ou até ontem, se hoje ainda não foi)
  let seq = 0
  if (dia) { let i = d[`${dia}.ok`] ? dia : dia - 1; while (i >= 1 && d[`${i}.ok`]) { seq++; i-- } }
  const hoje = dia ? D60[dia - 1] : null
  const ref = useRef(null)
  useEffect(() => { if (dia && ref.current) ref.current.scrollIntoView({ block: 'center' }) }, [])
  return (
    <>
      <Card title="Regras do desafio" icon="check" color="#FF3D77" fold aberto={!d.inicio} id="d60-regras">
        <ul className="bl">{REGRAS.map((r) => <li key={r}><i style={{ color: '#FF3D77' }}>→</i><span>{r}</span></li>)}</ul>
      </Card>
      <Card title="Começar" icon="cal" color="#8B5CF6">
        <div className="kv"><span>Data de início</span><input type="date" className="in d60-ini" value={d.inicio || ''} onChange={(e) => setField('d60', 'inicio', e.target.value)} aria-label="Data de início do desafio" /></div>
        {!d.inicio && <button className="btn full" onClick={() => setField('d60', 'inicio', hojeISO())}><Ic n="flag" s={16} /> Começar hoje</button>}
      </Card>
      {d.inicio && <div className="stats three">
        <div className="stat" style={{ '--c': '#FF3D77' }}><div className="stat-i"><Ic n="cal" s={16} /></div><span>Hoje é o dia</span><b>{dia || '—'}</b></div>
        <div className="stat" style={{ '--c': '#10B981' }}><div className="stat-i"><Ic n="check" s={16} /></div><span>Feitos</span><b>{feitos}/60</b></div>
        <div className="stat" style={{ '--c': '#F59E0B' }}><div className="stat-i"><Ic n="spark" s={16} /></div><span>Dias seguidos</span><b>{seq}</b></div>
      </div>}
      {d.inicio && <div className="prog big"><i style={{ width: (feitos / 60 * 100) + '%' }} /></div>}
      {hoje && <div className="d60-hoje" style={{ '--c': hoje.cor }}><small>hoje · dia {hoje.n} · {hoje.fase}</small><b>{hoje.t}</b><em>{hoje.fmt}</em></div>}
      {DESAFIO60.map((f, i) => {
        const nums = f.dias.map((_, j) => i * 10 + j + 1); const ok = nums.filter((n) => d[`${n}.ok`]).length
        return (
          <Card key={f.fase} title={`Fase ${i + 1} · ${f.fase}`} icon="flag" color={f.cor} fold aberto={!dia || (dia >= nums[0] && dia <= nums[9]) || (!d.inicio && i === 0)} id={`d60-f${i}`} resumo={`${ok}/10`}>
            <div className="d60-l">{nums.map((n) => { const x = D60[n - 1]; const on = !!d[`${n}.ok`]; return (
              <div key={n} ref={n === dia ? ref : null} className={'d60-r' + (on ? ' on' : '') + (n === dia ? ' hoje' : '')} style={{ '--c': f.cor }}>
                <button className="d60-ck" aria-pressed={on} aria-label={`Marcar dia ${n} como feito`} onClick={() => setField('d60', `${n}.ok`, !on)}>{on ? <Ic n="check" s={14} w={3} /> : n}</button>
                <div className="d60-t"><span>{x.t}</span><em>{x.fmt}</em>
                  <input className="in" placeholder="O que eu postei (tema ou link)" value={d[`${n}.post`] || ''} onChange={(e) => setField('d60', `${n}.post`, e.target.value)} aria-label={`O que postei no dia ${n}`} /></div>
              </div>
            ) })}</div>
          </Card>
        )
      })}
    </>
  )
}
