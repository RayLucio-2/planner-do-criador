// Tarefas: o que fazer hoje (vem sozinho do planner), um quadro estilo Trello para as suas tarefas
// e o passo a passo para chegar ao primeiro contrato, que se marca sozinho conforme a pessoa avança.
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Ic, Head, Card, toast } from '../../components/ui'
import { useEntry, setField, getEntry, num, brl, useStoreVersion, getAno } from '../../lib/store'
import { MESES, mesesDoAno, semanas, D60 } from '../../data/content'
import { mesDeHoje } from '../../lib/ligacoes'
import { anoFinanceiro } from '../../lib/financeiro'
import { useBloqueio } from '../../lib/bloqueio'
import { diaDoDesafio } from './Desafio60'
import { listaClientes, retornosHoje } from './Clientes'

const COLS = [['afazer', 'A fazer', '#8B5CF6'], ['fazendo', 'Fazendo', '#F59E0B'], ['feito', 'Feito', '#10B981']]
const hojeISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }

// tarefas que o próprio planner cria para hoje
export function tarefasDoDia() {
  const out = []; const h = new Date(); const ano = getAno()
  if (h.getFullYear() === ano) {
    const m = MESES[h.getMonth()]; const dia = h.getDate(); const k = `${m.k}.ed`; const ed = getEntry(k)
    const ideia = ed[`${dia}.ideia`]
    if (ideia) {
      const rl = getEntry(`${m.k}.rot`).lista; const rot = (Array.isArray(rl) ? rl : []).find((r) => (r.titulo || '').trim().toLowerCase() === ideia.trim().toLowerCase())
      if (!ed[`${dia}.grav`] && !(rot && (rot.gancho || rot.virada))) out.push({ id: 'rot', t: `Roteirizar: ${ideia}`, s: 'Post de hoje', to: `/app/mes/${m.k}/roteiros` })
      if (!ed[`${dia}.grav`]) out.push({ id: 'grav', t: `Gravar: ${ideia}`, s: 'Post de hoje', to: `/app/mes/${m.k}/roteiros`, ok: () => setField(k, `${dia}.grav`, true) })
      else if (!ed[`${dia}.post`]) out.push({ id: 'post', t: `Postar: ${ideia}`, s: 'Post de hoje', to: `/app/mes/${m.k}/editorial`, ok: () => setField(k, `${dia}.post`, true) })
      else out.push({ id: 'post', t: `Postar: ${ideia}`, s: 'Post de hoje', feito: true })
    } else out.push({ id: 'plan', t: 'Planejar o post de hoje no editorial', s: 'Calendário editorial', to: `/app/mes/${m.k}/editorial` })
    const am = dia + 1
    if (am <= diasMes(h) && ed[`${am}.ideia`] && !ed[`${am}.grav`]) out.push({ id: 'amanha', t: `Roteirizar o post de amanhã: ${ed[`${am}.ideia`]}`, s: 'Adiantar', to: `/app/mes/${m.k}/roteiros` })
    // fim do mês: análise
    if (diasMes(h) - dia <= 2) { const an = getEntry(`${m.k}.an`); if (!an.muda) out.push({ id: 'an', t: `Fazer a análise de ${m.nome.toLowerCase()}`, s: '15 minutos', to: `/app/mes/${m.k}/analise` }) }
  }
  retornosHoje().forEach((c) => out.push({ id: 'ret' + c.i, t: `Dar retorno para ${c.nome || 'cliente'}`, s: c.ret < hojeISO() ? 'Retorno atrasado' : 'Retorno de hoje', to: '/app/clientes', ok: () => { const l = [...listaClientes()]; l[c.i] = { ...l[c.i], ret: '' }; setField('clientes', 'lista', l) } }))
  const f = anoFinanceiro()
  f.aReceber.filter((r) => r.sit === 'atrasado' || r.sit === 'hoje').forEach((r, i) => out.push({ id: 'cob' + i, t: `Cobrar ${r.cli || 'cliente'}: ${brl(num(r.val))}`, s: r.sit === 'atrasado' ? 'Pagamento atrasado' : 'Vence hoje', to: '/app/financeiro' }))
  return out
}
function diasMes(d) { return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate() }

// passo a passo: cada passo se marca sozinho quando a pessoa faz no planner
function passos() {
  const ano = getAno(); const m = mesDeHoje(); const vis = mesesDoAno(ano)
  const capa = getEntry('capa'), pub = getEntry('publico'), per = getEntry('perfil'), g = getEntry('google'), lg = getEntry('linguagem')
  const ed = getEntry(`${m.k}.ed`); let plan = 0; for (const k in ed) if (/^\d+\.ideia$/.test(k) && ed[k]) plan++
  const h = new Date(); const w = semanas(m.n, ano).find(([a, b]) => h.getDate() >= a && h.getDate() <= b) || [1, 7]
  let post = 0; for (let d = w[0]; d <= w[1]; d++) if (ed[`${d}.post`]) post++
  const rots = vis.flatMap((x) => { const l = getEntry(`${x.k}.rot`).lista; return Array.isArray(l) ? l : [] })
  const cli = listaClientes()
  const contratos = vis.some((x) => { const c = getEntry(`${x.k}.neg`).contratos; return Array.isArray(c) && c.some((r) => r.cli || num(r.val)) })
  const props = vis.some((x) => { const p = getEntry(`${x.k}.neg`).props; return Array.isArray(p) && p.some((r) => r.cli) })
  const analise = vis.some((x) => getEntry(`${x.k}.an`).muda)
  const frases = Array.isArray(lg.frases) ? lg.frases.filter((r) => r.frase).length : 0
  const gok = Object.keys(g).filter((k) => /^m\.\d+$/.test(k) && g[k]).length
  return [
    ['Monte o seu planner', 'As 4 perguntas do começo', !!capa.onboarded, '/boas-vindas'],
    ['Descreva o seu público', 'Quem é e qual a maior dor', !!(pub.quem && pub.maior), '/app/ferramentas/publico'],
    ['Escolha 2 pilares de conteúdo', 'Os assuntos fixos do seu perfil', !!(per['p1.nome'] && per['p2.nome']), '/app/ferramentas/perfil'],
    ['Arrume a bio do perfil', 'O que você faz e para quem', !!(per.bio || capa.bio), '/app/ferramentas/perfil'],
    ['Planeje 5 posts no mês', `${Math.min(plan, 5)} de 5 no calendário editorial`, plan >= 5, `/app/mes/${m.k}/editorial`],
    ['Escreva 1 roteiro completo', 'Gancho, problema, virada, prova e chamada', rots.some((r) => r.gancho && r.cham), `/app/mes/${m.k}/roteiros`],
    ['Poste 3 vezes na semana', `${Math.min(post, 3)} de 3 nesta semana`, post >= 3, `/app/mes/${m.k}/editorial`],
    ['Anote 10 frases do seu público', `${Math.min(frases, 10)} de 10 no Banco de linguagem`, frases >= 10, '/app/ferramentas/linguagem'],
    ['Monte o Google Meu Negócio', `${Math.min(gok, 8)} de 8 itens da montagem`, gok >= 8, '/app/ferramentas/google'],
    ['Converse com 5 possíveis clientes', `${Math.min(cli.length, 5)} de 5 em Clientes`, cli.length >= 5, '/app/clientes'],
    ['Mande a 1ª proposta', 'Com valor e prazo', props || cli.some((c) => ['proposta', 'fechado'].includes(c.etapa)), '/app/clientes'],
    ['Feche o 1º contrato', 'E registre no Negócio do mês', contratos || cli.some((c) => c.etapa === 'fechado'), `/app/mes/${m.k}/negocio`],
    ['Faça a análise do mês', 'E escolha uma coisa para mudar', analise, `/app/mes/${m.k}/analise`],
  ]
}

export default function Tarefas() {
  useStoreVersion(); const nav = useNavigate()
  const { emTeste } = useBloqueio()
  const d = useEntry('tarefas'); const ls = Array.isArray(d.lista) ? d.lista : []
  const [col, setCol] = useState('afazer'); const [txt, setTxt] = useState('')
  const salvar = (n) => setField('tarefas', 'lista', n)
  const add = (e) => { e.preventDefault(); if (!txt.trim()) return; salvar([...ls, { t: txt.trim(), col: col === 'feito' ? 'afazer' : col, criada: hojeISO() }]); setTxt('') }
  const mover = (i, c) => { const n = [...ls]; n[i] = { ...n[i], col: c, ...(c === 'feito' ? { feito_em: hojeISO() } : {}) }; salvar(n) }
  const apagar = (i) => { const antes = [...ls]; salvar(ls.filter((_, j) => j !== i)); toast('Tarefa apagada', ['Desfazer', () => salvar(antes)]) }
  // hoje: automáticas + desafio + as minhas com data de hoje
  const auto = tarefasDoDia()
  const d60 = getEntry('d60'); const dd = !emTeste ? diaDoDesafio(d60.inicio) : null
  if (dd) auto.push({ id: 'd60', t: D60[dd - 1].t, s: `Desafio · dia ${dd}`, to: '/app/desafio60', feito: !!d60[`${dd}.ok`], ok: () => setField('d60', `${dd}.ok`, true) })
  const feitasHoje = getEntry('tarefas')[`auto.${hojeISO()}`] || {}
  const marcarAuto = (t) => { if (t.ok) t.ok(); setField('tarefas', `auto.${hojeISO()}`, { ...feitasHoje, [t.id]: true }); toast('Feito! ✓') }
  const hoje = auto.map((t) => ({ ...t, feito: t.feito || !!feitasHoje[t.id] }))
  const pendHoje = hoje.filter((t) => !t.feito).length
  const ps = passos(); const ok = ps.filter((p) => p[2]).length; const prox = ps.findIndex((p) => !p[2])
  const naCol = ls.map((t, i) => ({ ...t, i })).filter((t) => (t.col || 'afazer') === col)
  return (
    <div className="page">
      <Head icon="check" title="Tarefas" sub="O que fazer hoje, o seu quadro e o passo a passo" kicker="rotina" color="#8B5CF6" back="/app" />

      <Card title={pendHoje ? `Hoje · ${pendHoje} ${pendHoje === 1 ? 'tarefa' : 'tarefas'}` : 'Hoje · tudo feito ✓'} icon="cal" color="var(--pink)">
        <div className="tk-l">{hoje.map((t) => (
          <div key={t.id} className={'tk' + (t.feito ? ' on' : '')}>
            <button className="tk-ck" aria-label={`Marcar “${t.t}” como feita`} disabled={t.feito} onClick={() => marcarAuto(t)}>{t.feito && <Ic n="check" s={13} w={3} />}</button>
            <button className="tk-t" onClick={() => t.to && nav(t.to)}><b>{t.t}</b><span>{t.s}</span></button>
            {t.to && <Ic n="right" s={14} />}
          </div>
        ))}</div>
      </Card>

      <Card title="Passo a passo para o primeiro contrato" icon="flag" color="#10B981">
        <div className="kv"><span>{ok} de {ps.length} passos</span><b>{Math.round(ok / ps.length * 100)}%</b></div>
        <div className="prog big"><i style={{ width: (ok / ps.length * 100) + '%', background: '#10B981' }} /></div>
        <div className="trilha">{ps.map(([t, s, feito, to], i) => (
          <Link key={t} to={to} className={'tr' + (feito ? ' on' : '') + (i === prox ? ' prox' : '')}>
            <span className="tr-n">{feito ? <Ic n="check" s={13} w={3} /> : i + 1}</span>
            <div><b>{t}</b><span>{i === prox ? `Próximo passo · ${s}` : s}</span></div>
          </Link>
        ))}</div>
        <p className="mut sm">Cada passo se marca sozinho quando você faz no planner.</p>
      </Card>

      <h2 className="sect"><Ic n="grid" s={16} /> Meu quadro</h2>
      <div className="kb-tabs">{COLS.map(([k, l, c]) => <button key={k} className={'fc' + (col === k ? ' on' : '')} style={{ '--c': c }} onClick={() => setCol(k)}><b>{ls.filter((t) => (t.col || 'afazer') === k).length}</b><span>{l}</span></button>)}</div>
      {col !== 'feito' && <form className="kb-add" onSubmit={add}><input className="in" placeholder={col === 'fazendo' ? 'O que você está fazendo agora?' : 'Nova tarefa (ex.: mandar orçamento para a padaria)'} value={txt} onChange={(e) => setTxt(e.target.value)} /><button className="btn" aria-label="Adicionar tarefa"><Ic n="plus" s={16} w={2.6} /></button></form>}
      <div className="kb-l">{naCol.map((t) => {
        const ci = COLS.findIndex(([k]) => k === (t.col || 'afazer'))
        return (
          <div key={t.i} className={'kb' + (t.col === 'feito' ? ' on' : '')} style={{ '--c': COLS[ci][2] }}>
            <button className="tk-ck" aria-label="Concluir" onClick={() => mover(t.i, t.col === 'feito' ? 'afazer' : 'feito')}>{t.col === 'feito' && <Ic n="check" s={13} w={3} />}</button>
            <span className="kb-t">{t.t}</span>
            <div className="kb-a">
              {ci > 0 && <button aria-label="Voltar uma coluna" onClick={() => mover(t.i, COLS[ci - 1][0])}><Ic n="left" s={15} /></button>}
              {ci < COLS.length - 1 && <button aria-label="Avançar uma coluna" onClick={() => mover(t.i, COLS[ci + 1][0])}><Ic n="right" s={15} /></button>}
              <button aria-label="Apagar tarefa" onClick={() => apagar(t.i)}><Ic n="trash" s={14} /></button>
            </div>
          </div>
        )
      })}</div>
      {!naCol.length && <p className="mut sm">{col === 'afazer' ? 'Nada aqui. Anote o que precisa fazer e vá movendo até “Feito”.' : col === 'fazendo' ? 'Mova para cá o que você começou.' : 'As tarefas concluídas aparecem aqui.'}</p>}
      {col === 'feito' && naCol.length > 0 && <button className="link sm" onClick={() => salvar(ls.filter((t) => t.col !== 'feito'))}>Limpar as concluídas</button>}
    </div>
  )
}
