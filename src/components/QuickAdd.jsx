// Botão "+" flutuante: anota ideia, contrato, gasto ou proposta em dois toques, no mês atual
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ic, toast } from './ui'
import { getEntry, setField, useAno } from '../lib/store'
import { mesesDoAno, FORMATOS } from '../data/content'
import { CATEGORIAS, STATUS_PROP, lista } from '../lib/financeiro'

const TIPOS = [['ideia', 'Ideia', 'idea', '#F59E0B'], ['contrato', 'Contrato', 'coin', '#3B82F6'], ['gasto', 'Gasto', 'flyer', '#E11D48'], ['proposta', 'Proposta', 'send', '#8B5CF6']]
const hojeISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
const cheia = (r) => r && Object.values(r).some((v) => v !== '' && v !== false && v != null)

export default function QuickAdd() {
  const ano = useAno(); const nav = useNavigate()
  const meses = mesesDoAno(ano); const hoje = new Date()
  const m = meses.find((x) => x.n === hoje.getMonth() + 1 && hoje.getFullYear() === ano) || meses[0]
  const [aberto, setAberto] = useState(false); const [tipo, setTipo] = useState('ideia'); const [f, setF] = useState({})
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const fechar = () => { setAberto(false); setF({}) }

  function salvar(e) {
    e.preventDefault()
    const junta = (k, campo, item) => setField(k, campo, [...lista(getEntry(k)[campo]).filter(cheia), item])
    let onde, rota
    if (tipo === 'ideia') { junta('ideias', 'lista', { ideia: f.a || '', quem: f.b || '', fmt: f.fmt || '' }); onde = 'Ideias'; rota = '/app/ideias' }
    else {
      const k = `${m.k}.neg`; rota = `/app/mes/${m.k}/negocio`; onde = `${m.nome} › Negócio`
      if (tipo === 'contrato') junta(k, 'contratos', { cli: f.a || '', srv: f.b || '', val: f.val || '', venc: f.venc || '', rep: !!f.rep })
      if (tipo === 'gasto') junta(k, 'gastos', { item: f.a || '', cat: f.cat || '', val: f.val || '', rep: !!f.rep })
      if (tipo === 'proposta') junta(k, 'props', { cli: f.a || '', val: f.val || '', env: hojeISO(), st: f.st || 'Enviada' })
    }
    fechar(); toast(`Salvo em ${onde}`, ['Ver', () => nav(rota)])
  }
  const rotA = { ideia: 'Ideia ou gancho', contrato: 'Cliente', gasto: 'O que foi', proposta: 'Cliente' }[tipo]
  return (
    <>
      <button className="fab" onClick={() => setAberto(true)} aria-label="Adicionar ideia, contrato, gasto ou proposta"><Ic n="plus" s={26} w={2.6} /></button>
      {aberto && <div className="sheet-bg" onClick={fechar}>
        <form className="sheet" onClick={(e) => e.stopPropagation()} onSubmit={salvar}>
          <div className="sheet-h"><b>Adicionar</b><button type="button" className="sheet-x" onClick={fechar} aria-label="Fechar"><Ic n="x" s={18} w={2.4} /></button></div>
          <div className="qa-tipos">{TIPOS.map(([t, l, ic, c]) => (
            <button type="button" key={t} className={'qa-t' + (tipo === t ? ' on' : '')} style={{ '--c': c }} onClick={() => { setTipo(t); setF({}) }} aria-pressed={tipo === t}><Ic n={ic} s={18} /><span>{l}</span></button>
          ))}</div>
          <label className="qa-l"><span>{rotA}</span><input className="in big" value={f.a || ''} onChange={set('a')} required autoFocus /></label>
          {tipo === 'ideia' && <>
            <label className="qa-l"><span>Para quem ou qual dor (opcional)</span><input className="in" value={f.b || ''} onChange={set('b')} /></label>
            <label className="qa-l"><span>Formato</span><select className="in sel" value={f.fmt || ''} onChange={set('fmt')}>{FORMATOS.map((o) => <option key={o} value={o}>{o || 'escolha'}</option>)}</select></label>
          </>}
          {tipo !== 'ideia' && <label className="qa-l"><span>Valor</span><span className="numw money"><i>R$</i><input className="in num" inputMode="decimal" value={f.val || ''} onChange={(e) => setF({ ...f, val: e.target.value.replace(/[^\d.,]/g, '') })} placeholder="0" /></span></label>}
          {tipo === 'contrato' && <>
            <label className="qa-l"><span>Serviço (opcional)</span><input className="in" value={f.b || ''} onChange={set('b')} /></label>
            <label className="qa-l"><span>Vencimento (opcional)</span><input className="in" type="date" value={f.venc || ''} onChange={set('venc')} /></label>
          </>}
          {tipo === 'gasto' && <label className="qa-l"><span>Categoria</span><select className="in sel" value={f.cat || ''} onChange={set('cat')}>{CATEGORIAS.map((o) => <option key={o} value={o}>{o || 'escolha'}</option>)}</select></label>}
          {tipo === 'proposta' && <label className="qa-l"><span>Status</span><select className="in sel" value={f.st || 'Enviada'} onChange={set('st')}>{STATUS_PROP.filter(Boolean).map((o) => <option key={o} value={o}>{o}</option>)}</select></label>}
          {(tipo === 'contrato' || tipo === 'gasto') && <label className={'ck' + (f.rep ? ' on' : '')}><input type="checkbox" checked={!!f.rep} onChange={set('rep')} /><span className="box"><Ic n="check" s={12} w={3} /></span><span className="ckl">Fixo: repete todo mês</span></label>}
          <button className="btn big full">Salvar {tipo !== 'ideia' ? `em ${m.nome.toLowerCase()}` : 'nas ideias'}</button>
        </form>
      </div>}
    </>
  )
}
