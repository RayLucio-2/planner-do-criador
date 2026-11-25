// Funil de clientes: contato → conversa → proposta → fechado ou perdido, com data de retorno.
// Junta o que antes ficava separado em Porta em porta e Propostas.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Ic, Head, Card, toast } from '../../components/ui'
import { useEntry, setField, getEntry, num, brl, useStoreVersion, getAno } from '../../lib/store'
import { novoContrato } from '../../lib/ligacoes'
import { linkAgenda } from '../../lib/agenda'
import { mesesDoAno } from '../../data/content'

export const ETAPAS_CLI = [['contato', 'Contato', '#8B5CF6'], ['conversa', 'Conversa', '#3B82F6'], ['proposta', 'Proposta', '#F59E0B'], ['fechado', 'Fechado', '#10B981'], ['perdido', 'Perdido', '#9CA3AF']]
const ORIGENS = ['', 'Instagram', 'WhatsApp', 'Indicação', 'Google', 'Porta em porta', 'Panfleto', 'Outro']
const hojeISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
const dataBR = (s) => (s ? s.split('-').reverse().slice(0, 2).join('/') : '')
export const listaClientes = () => { const c = getEntry('clientes').lista; return Array.isArray(c) ? c : [] }
// retornos para hoje ou atrasados (usado no Início e nas Tarefas)
export const retornosHoje = () => listaClientes().map((c, i) => ({ ...c, i })).filter((c) => c.ret && c.ret <= hojeISO() && !['fechado', 'perdido'].includes(c.etapa))

export default function Clientes() {
  useStoreVersion()
  const d = useEntry('clientes'); const ls = Array.isArray(d.lista) ? d.lista : []
  const [aberto, setAberto] = useState(null); const [ver, setVer] = useState('contato')
  const salvar = (n) => setField('clientes', 'lista', n)
  const upd = (i, k, v) => { const n = [...ls]; n[i] = { ...n[i], [k]: v }; salvar(n) }
  const novo = () => { salvar([...ls, { nome: '', etapa: ver === 'fechado' || ver === 'perdido' ? 'contato' : ver, desde: hojeISO() }]); setAberto(ls.length); if (ver === 'fechado' || ver === 'perdido') setVer('contato') }
  const mover = (i, etapa) => {
    const n = [...ls]; n[i] = { ...n[i], etapa, ...(etapa === 'fechado' ? { fechado_em: hojeISO() } : {}) }; salvar(n)
    if (etapa === 'fechado') toast(`${ls[i].nome || 'Cliente'} fechou! Crie o contrato no Negócio.`)
  }
  const contrato = (i) => { const c = ls[i]; const m = novoContrato({ cli: c.nome || '', val: c.val || '', srv: c.srv || '' }); upd(i, 'contr', true); toast(`Contrato criado em ${m.nome} › Negócio`) }
  const apagar = (i) => { const t = ls[i]; salvar(ls.filter((_, j) => j !== i)); setAberto(null); toast('Cliente apagado', ['Desfazer', () => { const n = listaClientes().slice(); n.splice(i, 0, t); salvar(n) }]) }

  // trazer, uma vez, o que já estava em Porta em porta e nas Propostas dos meses
  const importar = () => {
    const novos = []
    const porta = getEntry('porta').visitas
    ;(Array.isArray(porta) ? porta : []).filter((r) => r.local || r.pessoa).forEach((r) => novos.push({ nome: r.local || r.pessoa, contato: r.local && r.pessoa ? r.pessoa : '', origem: 'Porta em porta', dor: r.dor || '', etapa: r.res === 'Fechou' ? 'fechado' : r.res === 'Não agora' ? 'perdido' : 'conversa', contr: !!r.contr, desde: hojeISO() }))
    mesesDoAno(getAno()).forEach((m) => { const p = getEntry(`${m.k}.neg`).props; (Array.isArray(p) ? p : []).filter((r) => r.cli).forEach((r) => novos.push({ nome: r.cli, val: r.val || '', etapa: r.st === 'Fechada' ? 'fechado' : r.st === 'Perdida' ? 'perdido' : 'proposta', contr: !!r.contr, desde: r.env || hojeISO() })) })
    const nomes = new Set(ls.map((c) => (c.nome || '').toLowerCase()))
    const add = novos.filter((c) => !nomes.has(c.nome.toLowerCase()))
    salvar([...ls, ...add]); setField('clientes', 'importado', true)
    toast(add.length ? `${add.length} ${add.length === 1 ? 'cliente trazido' : 'clientes trazidos'}` : 'Nada novo para trazer')
  }

  const cont = Object.fromEntries(ETAPAS_CLI.map(([k]) => [k, ls.filter((c) => (c.etapa || 'contato') === k).length]))
  const emAberto = ls.filter((c) => c.etapa === 'proposta').reduce((t, c) => t + num(c.val), 0)
  const decid = cont.fechado + cont.perdido
  const ret = retornosHoje()
  const col = ls.map((c, i) => ({ ...c, i })).filter((c) => (c.etapa || 'contato') === ver)
  return (
    <div className="page">
      <Head icon="users" title="Clientes" sub="Do primeiro contato ao contrato fechado" kicker="funil" color="#10B981" back="/app" />
      <div className="funil-cli">{ETAPAS_CLI.map(([k, l, c]) => (
        <button key={k} className={'fc' + (ver === k ? ' on' : '')} style={{ '--c': c }} onClick={() => { setVer(k); setAberto(null) }}><b>{cont[k]}</b><span>{l}</span></button>
      ))}</div>
      <p className="mut sm">{decid ? `Taxa de fechamento: ${Math.round(cont.fechado / decid * 100)}%` : 'Toque numa etapa para ver os clientes dela.'}{emAberto > 0 && ` · ${brl(emAberto)} em propostas abertas`}</p>
      {ret.length > 0 && <Card title={`Retornos para hoje · ${ret.length}`} icon="bell" color="#F59E0B">{ret.map((c) => <button key={c.i} className="kv ret-b" onClick={() => { setVer(c.etapa || 'contato'); setAberto(c.i) }}><span><b>{c.nome || 'Cliente'}</b> · {ETAPAS_CLI.find(([k]) => k === (c.etapa || 'contato'))[1]}</span><span className={c.ret < hojeISO() ? 'atras' : ''}>{c.ret < hojeISO() ? `atrasado ${dataBR(c.ret)}` : 'hoje'}</span></button>)}</Card>}

      <div className="cli-l">{col.map((c) => {
        const et = ETAPAS_CLI.findIndex(([k]) => k === (c.etapa || 'contato'))
        return (
          <div key={c.i} className={'cli' + (aberto === c.i ? ' on' : '')} style={{ '--c': ETAPAS_CLI[et][2] }}>
            <button className="cli-h" onClick={() => setAberto(aberto === c.i ? null : c.i)}>
              <div><b>{c.nome || 'Sem nome'}</b><span>{[c.origem, c.val && brl(num(c.val)), c.ret && `retorno ${dataBR(c.ret)}`].filter(Boolean).join(' · ') || 'toque para preencher'}</span></div>
              <Ic n="chev" s={16} />
            </button>
            {aberto === c.i && <div className="cli-c">
              <input className="in" placeholder="Nome do cliente ou negócio" value={c.nome || ''} onChange={(e) => upd(c.i, 'nome', e.target.value)} autoFocus={!c.nome} />
              <div className="g2 tight"><input className="in" placeholder="WhatsApp ou @" value={c.contato || ''} onChange={(e) => upd(c.i, 'contato', e.target.value)} />
                <select className="in sel" value={c.origem || ''} onChange={(e) => upd(c.i, 'origem', e.target.value)}>{ORIGENS.map((o) => <option key={o} value={o}>{o || 'Como chegou'}</option>)}</select></div>
              <input className="in" placeholder="O que ele precisa (a dor)" value={c.dor || ''} onChange={(e) => upd(c.i, 'dor', e.target.value)} />
              <div className="g2 tight"><span className="numw money"><i>R$</i><input className="in num" inputMode="decimal" placeholder="Valor" value={c.val || ''} onChange={(e) => upd(c.i, 'val', e.target.value.replace(/[^\d.,-]/g, ''))} /></span>
                <label className="cli-r"><span>Retorno em</span><input type="date" className="in" value={c.ret || ''} onChange={(e) => upd(c.i, 'ret', e.target.value)} /></label></div>
              <textarea className="in ta" rows={2} placeholder="Anotações da conversa" value={c.obs || ''} onChange={(e) => upd(c.i, 'obs', e.target.value)} />
              <div className="cli-mv">{ETAPAS_CLI.map(([k, l, cor]) => <button key={k} className={'chipb' + ((c.etapa || 'contato') === k ? ' on' : '')} style={(c.etapa || 'contato') === k ? { background: cor, borderColor: cor } : null} onClick={() => mover(c.i, k)}>{l}</button>)}</div>
              <div className="cli-a">
                {c.etapa === 'fechado' && !c.contr && <button className="btn sm" onClick={() => contrato(c.i)}><Ic n="coin" s={14} /> Criar contrato no Negócio</button>}
                {c.etapa === 'fechado' && c.contr && <span className="mut sm">Contrato criado ✓</span>}
                {c.ret && <a className="btn ghost sm" href={linkAgenda({ ano: +c.ret.slice(0, 4), mes: +c.ret.slice(5, 7), dia: +c.ret.slice(8, 10), titulo: `Retorno: ${c.nome || 'cliente'}`, detalhes: [c.contato && `Contato: ${c.contato}`, c.dor && `Precisa de: ${c.dor}`, c.obs].filter(Boolean).join('\n') })} target="_blank" rel="noreferrer"><Ic n="bell" s={14} /> Lembrar no Google Agenda</a>}
                {c.contato && /\d{8,}/.test(c.contato.replace(/\D/g, '')) && <a className="btn ghost sm" href={`https://wa.me/55${c.contato.replace(/\D/g, '').replace(/^55/, '')}`} target="_blank" rel="noreferrer"><Ic n="comment" s={14} /> WhatsApp</a>}
                <button className="link sm" onClick={() => apagar(c.i)}>Apagar</button>
              </div>
            </div>}
          </div>
        )
      })}</div>
      {!col.length && <p className="mut sm cli-v">{ver === 'contato' ? 'Ninguém aqui ainda. Anote cada pessoa que demonstrou interesse, mesmo que só tenha curtido ou perguntado o preço.' : 'Nenhum cliente nesta etapa.'}</p>}
      <button className="btn full" onClick={novo}><Ic n="plus" s={16} w={2.6} /> Novo cliente</button>
      {!d.importado && <button className="link sm" onClick={importar}>Trazer clientes do Porta em porta e das Propostas</button>}
      <Card title="Como usar" icon="help" color="var(--violet)">
        <ul className="bl">{['Contato: alguém curtiu, perguntou o preço ou você visitou.', 'Conversa: vocês já trocaram mensagens sobre o trabalho.', 'Proposta: você mandou o valor.', 'Fechado: virou contrato. Crie o contrato no Negócio com um toque.', 'Perdido: anote o motivo. Ele vira conteúdo.'].map((x) => <li key={x}><i style={{ color: '#10B981' }}>→</i><span>{x}</span></li>)}</ul>
        <p className="mut sm">Coloque sempre uma data de retorno: ela aparece no Início e nas Tarefas no dia certo. <Link to="/app/tarefas" className="auto">Ver tarefas</Link></p>
      </Card>
    </div>
  )
}
