// Referências por nicho: a curadoria da Télora e as referências que a pessoa salva, com o que observar em cada uma
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ic, Head, Card, toast } from '../../components/ui'
import { useEntry, setField } from '../../lib/store'
import { NICHOS, NICHO } from '../../data/nichos'
import { REFERENCIAS } from '../../data/referencias'
import { mesDeHoje, novoRoteiro } from '../../lib/ligacoes'

const TAGS = ['Gancho', 'Edição', 'Legenda', 'Áudio', 'Cenário', 'Roteiro']

export default function Referencias() {
  const capa = useEntry('capa'); const d = useEntry('refs'); const nav = useNavigate()
  const ls = Array.isArray(d.lista) ? d.lista : []
  const [f, setF] = useState({ link: '', nota: '', tags: [] })
  const nicho = capa.nicho; const n = NICHO[nicho]
  const cur = (nicho && REFERENCIAS[nicho]) || []
  const salvar = (e) => {
    e.preventDefault(); if (!f.link.trim() && !f.nota.trim()) return
    setField('refs', 'lista', [{ ...f, link: f.link.trim(), nicho: nicho || '', em: new Date().toISOString().slice(0, 10) }, ...ls]); setF({ link: '', nota: '', tags: [] }); toast('Referência salva')
  }
  const virar = (r, i) => {
    const m = mesDeHoje(); const k = novoRoteiro(m.k, { titulo: r.titulo || (r.nota ? `Inspirado em: ${r.nota}` : 'Inspirado numa referência'), leg: [r.link && `Referência: ${r.link}`, r.observe || r.nota, (r.tags || []).length && `Observar: ${r.tags.join(', ')}`].filter(Boolean).join('\n') })
    if (i != null) { const l = [...ls]; l[i] = { ...l[i], usei: true }; setField('refs', 'lista', l) }
    toast(`Roteiro #${k} criado em ${m.nome}`); nav(`/app/mes/${m.k}/roteiros`)
  }
  const tg = (t) => setF({ ...f, tags: f.tags.includes(t) ? f.tags.filter((x) => x !== t) : [...f.tags, t] })
  const minhas = ls.map((r, i) => ({ ...r, i })).filter((r) => !nicho || !r.nicho || r.nicho === nicho)
  return (
    <div className="page">
      <Head icon="play" title="Referências" sub="Vídeos bons do seu nicho para estudar o estilo" kicker="inspiração" color="#FF7A2F" back="/app/ferramentas" />
      <Card title="Seu nicho" icon="users" color="var(--violet)">
        <div className="ob-chips">{NICHOS.map((x) => <button key={x.id} className={'chipb' + (nicho === x.id ? ' on' : '')} onClick={() => setField('capa', 'nicho', x.id)}>{x.nome}</button>)}</div>
      </Card>
      <Card title={n ? `Seleção da Télora · ${n.nome.toLowerCase()}` : 'Seleção da Télora'} icon="spark" color="#FF7A2F">
        {cur.length ? <div className="vg">{cur.map((r) => (
          <div key={r.link} className="vg-r gch"><div><b>{r.titulo}</b><span>{[r.perfil, r.observe].filter(Boolean).join(' · ')}</span>{r.tags && <span className="ref-t">{r.tags.join(' · ')}</span>}</div>
            <div className="ref-b"><a className="btn ghost sm" href={r.link} target="_blank" rel="noreferrer">Ver</a><button className="btn sm" onClick={() => virar(r)}>Usar</button></div></div>
        ))}</div> : <p className="mut sm">{n ? 'A seleção de vídeos deste nicho chega em breve. Enquanto isso, salve abaixo os vídeos que você achar bons.' : 'Escolha o seu nicho para ver a seleção.'}</p>}
      </Card>
      <Card title="Minhas referências" icon="bookmark" color="var(--pink)">
        <p className="mut sm">Viu um vídeo bom? Copie o link no Instagram ou TikTok (⋯ › Copiar link), cole aqui e anote o que quer aprender com ele.</p>
        <form className="ref-f" onSubmit={salvar}>
          <input className="in" inputMode="url" placeholder="Link do vídeo" value={f.link} onChange={(e) => setF({ ...f, link: e.target.value })} />
          <input className="in" placeholder="O que chamou atenção (ex.: o gancho com pergunta)" value={f.nota} onChange={(e) => setF({ ...f, nota: e.target.value })} />
          <div className="ob-chips">{TAGS.map((t) => <button type="button" key={t} className={'chipb' + (f.tags.includes(t) ? ' on' : '')} onClick={() => tg(t)}>{t}</button>)}</div>
          <button className="btn full"><Ic n="plus" s={16} w={2.6} /> Salvar referência</button>
        </form>
        {minhas.length > 0 && <div className="vg ref-l">{minhas.map((r) => (
          <div key={r.i} className={'vg-r gch' + (r.usei ? ' usei' : '')}><div><b>{r.nota || 'Referência'}</b>{(r.tags || []).length > 0 && <span className="ref-t">{r.tags.join(' · ')}</span>}{r.usei && <span>virou roteiro ✓</span>}</div>
            <div className="ref-b">{r.link && <a className="btn ghost sm" href={/^https?:/.test(r.link) ? r.link : `https://${r.link}`} target="_blank" rel="noreferrer">Ver</a>}<button className="btn sm" onClick={() => virar(r, r.i)}>Usar</button>
              <button className="rdel" aria-label="Apagar referência" onClick={() => setField('refs', 'lista', ls.filter((_, j) => j !== r.i))}><Ic n="trash" s={14} /></button></div></div>
        ))}</div>}
      </Card>
    </div>
  )
}
