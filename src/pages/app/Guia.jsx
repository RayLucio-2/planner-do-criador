import { Link, useParams } from 'react-router-dom'
import { Ic, Md, Head, Card, Checklist, Rows, Entry, Tip, Tweet, A, Field } from '../../components/ui'
import { LICOES } from '../../data/content'
import { useEntry, setField, useStoreVersion, getEntry } from '../../lib/store'

export function GuiaIndex() {
  useStoreVersion()
  const feitas = LICOES.filter((l) => getEntry(l.id).feita).length
  return (
    <div className="page">
      <Head icon="bulb" title="O guia" sub="As lições de quem começou só com o celular" kicker="parte 1" />
      <div className="guia-p"><div className="kv"><span>{feitas} de {LICOES.length} lições concluídas</span><b>{Math.round(feitas / LICOES.length * 100)}%</b></div><div className="prog big"><i style={{ width: (feitas / LICOES.length * 100) + '%' }} /></div></div>
      <Link to="/app/carta" className="row-link"><span className="rl-n" style={{ background: 'var(--grad)' }}><Ic n="heart" s={16} /></span><div><b>Antes de começar</b><span>Uma conversa sincera sobre como eu comecei</span></div><Ic n="right" s={16} /></Link>
      {LICOES.map((l) => <LessonLink key={l.id} l={l} />)}
    </div>
  )
}
function LessonLink({ l }) {
  const d = useEntry(l.id)
  const total = l.blocos.filter((b) => b.tipo === 'check').reduce((s, b) => s + b.itens.length, 0)
  const feitos = Object.entries(d).filter(([k, v]) => /^c\d+\.\d+$/.test(k) && v).length
  return (
    <Link to={`/app/guia/${l.id}`} className="row-link" style={{ '--c': l.cor }}>
      <span className="rl-n" style={{ background: l.cor }}><Ic n={l.icon} s={16} /></span>
      <div><small>{l.n ? `lição ${String(l.n).padStart(2, '0')}` : 'desafio'}{d.feita && <em className="feita"> · concluída ✓</em>}</small><b>{l.titulo}</b><span>{l.sub}</span>
        {total > 0 && <div className="prog"><i style={{ width: `${(feitos / total) * 100}%`, background: l.cor }} /></div>}</div>
      <Ic n="right" s={16} />
    </Link>
  )
}

export function Licao() {
  const { id } = useParams()
  const i = LICOES.findIndex((x) => x.id === id); const l = LICOES[i]
  if (!l) return <div className="page">Lição não encontrada.</div>
  const prev = LICOES[i - 1], next = LICOES[i + 1]
  return (
    <Entry k={l.id}>
      <div className="page">
        <Head icon={l.icon} title={l.titulo} sub={l.sub} kicker={l.n ? `lição ${String(l.n).padStart(2, '0')}` : 'desafio'} color={l.cor} back="/app/guia" />
        {l.intro && <p className="cap"><Md t={l.intro} /></p>}
        {l.blocos.map((b, j) => <Bloco key={j} b={b} j={j} />)}
        <Card title="Anotações" icon="note"><A f="notas" rows={4} ph="Escreva aqui…" /></Card>
        <Concluir id={l.id} />
        <div className="pn">
          {prev ? <Link to={`/app/guia/${prev.id}`} className="btn ghost"><Ic n="left" s={16} /> {prev.titulo}</Link> : <span />}
          {next ? <Link to={`/app/guia/${next.id}`} className="btn ghost">{next.titulo} <Ic n="right" s={16} /></Link> : <Link to="/app/ferramentas" className="btn">Ir para as ferramentas <Ic n="right" s={16} /></Link>}
        </div>
      </div>
    </Entry>
  )
}

function Bloco({ b, j }) {
  switch (b.tipo) {
    case 'check': return <Card title={b.titulo} icon="check" color={b.cor}><Checklist f={`c${j}`} itens={b.itens} />{b.nota && <p className="mut sm">{b.nota}</p>}</Card>
    case 'lista': return <Card title={b.titulo} color={b.cor}><ul className="bl">{b.itens.map((x, i) => <li key={i}><i style={{ color: b.cor }}>{b.marca}</i><span><Md t={x} /></span></li>)}</ul>{b.nota && <p className="mut sm">{b.nota}</p>}</Card>
    case 'tabela': return <Card title={b.titulo} icon="pen"><Rows f={`t${j}`} cols={b.cols.map(([k, l]) => ({ k, l }))} min={3} /></Card>
    case 'frase': return <Tweet text={b.texto} />
    case 'dica': return <Tip k={b.k}>{b.texto}</Tip>
    case 'campo': return <Card><Field label={b.titulo} hl><A f={b.f} rows={4} /></Field></Card>
    case 'passos': return <div className="steps">{b.itens.map(([t, d, s, c], i) => <div className="step" key={t} style={{ '--c': c }}><span className="step-n">{i + 1}</span><b>{t}</b><p>{d}</p><div className="step-s"><b>Comece com:</b> {s}</div></div>)}</div>
    case 'vs': return <div className="vs"><div className="vs-h"><span className="bad-t">{b.a}</span><span className="good-t">{b.b}</span></div>{b.itens.map(([x, y], i) => <div className="vs-r" key={i}><div><i className="bad"><Ic n="x" s={10} w={3} /></i>{x}</div><div><i className="good"><Ic n="check" s={10} w={3} /></i>{y}</div></div>)}</div>
    case 'cards': return <div className="qcs">{b.itens.map(([t, d, c]) => <div className="qc" key={t} style={{ '--c': c }}><b>{t}</b><span>{d}</span></div>)}</div>
    case 'timeline': return <Card title="A linha do tempo do vídeo" icon="play"><div className="tl">{b.itens.map(([t, tm, d], i) => <div className="tl-s" key={t}><div className="tl-b" style={{ background: ['#FFB020', '#FF7A2F', '#FF3D77', '#C04CE0', '#8B5CF6'][i] }} /><b>{i + 1}. {t}</b><em>{tm}</em><p>{d}</p></div>)}</div></Card>
    case 'antesdepois': return <><h2 className="sect">{b.titulo}</h2><div className="ad"><div className="phone bad"><span className="tag">antes</span><p><Md t={b.antes[0]} /></p><div className="why"><i className="bad"><Ic n="x" s={10} w={3} /></i>{b.antes[1]}</div></div><div className="phone good"><span className="tag">depois</span><p><Md t={b.depois[0]} /></p><div className="why"><i className="good"><Ic n="check" s={10} w={3} /></i>{b.depois[1]}</div></div></div></>
    case 'numerados': return <><h2 className="sect"><Ic n="flyer" s={16} /> {b.titulo}</h2><div className="g6">{b.itens.map(([t, d], i) => <div className="c6" key={t}><span className="c6-n">{i + 1}</span><b>{t}</b><p>{d}</p></div>)}</div></>
    case 'ciclo': return <div className="cyc">{b.itens.map(([t, s], i) => <div className="cyc-i" key={t}><b>{t}</b><span>{s}</span>{i < b.itens.length - 1 ? <Ic n="right" s={14} w={2.4} /> : <Ic n="loop" s={14} w={2.4} />}</div>)}</div>
    default: return null
  }
}

function Concluir({ id }) {
  const d = useEntry(id)
  return d.feita
    ? <div className="concl on"><Ic n="check" s={18} w={3} /><b>Lição concluída</b><button className="link sm" onClick={() => setField(id, 'feita', false)}>desfazer</button></div>
    : <button className="btn big full concl-b" onClick={() => setField(id, 'feita', true)}><Ic n="check" s={18} w={3} /> Marcar lição como concluída</button>
}
