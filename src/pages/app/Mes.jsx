import { Link, NavLink, useParams, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Ic, Head, Card, Checklist, Rows, Entry, A, T, N, C, S, Field, Calc, useF, Stat, Exemplo, toast } from '../../components/ui'
import { MESES, MES, foco, mesesDoAno, ANOS_BONUS, datasDoAno, WD, ANALISE, FORMATOS, ETAPAS, CHECK_SET, diasDoMes, semanas } from '../../data/content'
import { useEntry, num, brl, int, setField, useStoreVersion, useAno } from '../../lib/store'
import { mesStats } from '../../lib/calc'
import { CATEGORIAS, STATUS_PROP, situacao, mesAnterior, maisUmMes, lista } from '../../lib/financeiro'
import { linkAgenda } from '../../lib/agenda'
import ImportarExtrato from '../../components/ImportarExtrato'

export function MesesIndex() {
  useStoreVersion()
  const ano = useAno(); const ms = mesesDoAno(ano); const bonus = !!ANOS_BONUS[ano]
  const sem = (n) => <Link to={`/app/semestre/${n}`} className="row-link"><span className="rl-n" style={{ background: 'var(--orange)' }}><Ic n="flag" s={16} /></span><div><b>{n}º semestre</b><span>Prioridades de {n === 1 ? 'janeiro a junho' : 'julho a dezembro'}</span></div><Ic n="right" s={16} /></Link>
  const fs = (n) => <Link to={`/app/fechamento/${n}`} className="row-link"><span className="rl-n" style={{ background: 'var(--ink)' }}><Ic n="check" s={16} /></span><div><b>Fechando o {n}º semestre</b><span>Volte nas análises antes de responder</span></div><Ic n="right" s={16} /></Link>
  return (
    <div className="page">
      <Head icon="cal" title="Mês a mês" sub="Registre, grave, analise e ajuste" kicker="parte 3" color="var(--orange)" />
      {bonus ? (
        <>
          <div className="bonus"><span className="pill">bônus {ano}</span><b>Comece agora, sem esperar janeiro</b><p>{ms.map((m) => m.nome).join(' e ')} de {ano} já estão no planner. Use para testar a rotina e chegar em {ano + 1} com tudo planejado.</p></div>
          <div className="mgrid-idx">{ms.map((m) => <MesCard key={m.k} m={m} />)}</div>
        </>
      ) : (
        <>
          {sem(1)}<div className="mgrid-idx">{MESES.slice(0, 6).map((m) => <MesCard key={m.k} m={m} />)}</div>{fs(1)}
          {sem(2)}<div className="mgrid-idx">{MESES.slice(6).map((m) => <MesCard key={m.k} m={m} />)}</div>{fs(2)}
        </>
      )}
      <Link to="/app/fim" className="row-link"><span className="rl-n" style={{ background: 'var(--grad)' }}><Ic n="trophy" s={16} /></span><div><b>Fechando {ano}</b><span>Compare com o começo e leve para {ano + 1}</span></div><Ic n="right" s={16} /></Link>
    </div>
  )
}
function MesCard({ m }) {
  const s = mesStats(m.k); const ano = useAno()
  return (
    <Link to={`/app/mes/${m.k}`} className="mcard" style={{ '--c': m.cor }}>
      <div className="mcard-h"><b>{m.nome}</b><span>{String(m.n).padStart(2, '0')}</span></div>
      <p>{foco(m.n, ano)[0]}</p>
      <div className="mcard-s"><span><Ic n="play" s={12} /> {s.postados}</span><span><Ic n="trophy" s={12} /> {int(s.con)}</span><span><Ic n="coin" s={12} /> {brl(s.ent).replace(',00', '')}</span></div>
    </Link>
  )
}

const TABS = [['', 'Visão', 'cal'], ['editorial', 'Editorial', 'grid'], ['semanas', 'Semanas', 'film'], ['roteiros', 'Roteiros', 'pen'], ['analise', 'Análise', 'chart'], ['negocio', 'Negócio', 'coin']]

export function Mes() {
  const ano = useAno(); const YEAR = ano; const DATAS = datasDoAno(ano)
  const { m: mk, tab = '' } = useParams()
  const m = MES[mk]
  const vis = mesesDoAno(ano)
  if (!m) return <Navigate to="/app/meses" />
  if (!vis.includes(m)) return <Navigate to={`/app/mes/${vis[0].k}`} replace />
  const i = m.n - 1; const vi = vis.indexOf(m)
  const prev = vis[vi - 1], next = vis[vi + 1]; const F = foco(m.n, ano)
  const Comp = { '': Visao, editorial: Editorial, semanas: Semanas, roteiros: Roteiros, analise: Analise, negocio: Negocio }[tab]
  const ek = { '': 'visao', editorial: 'ed', semanas: 'sem', roteiros: 'rot', analise: 'an', negocio: 'neg' }[tab]
  return (
    <div className="page" style={{ '--mc': m.cor }}>
      <div className="mhead">
        {prev ? <Link to={`/app/mes/${prev.k}/${tab}`} className="mnav"><Ic n="left" s={18} w={2.4} /></Link> : <span className="mnav" />}
        <Head icon="cal" title={m.nome} sub={`${String(m.n).padStart(2, '0')} / ${YEAR} · ${F[0]}`} kicker={`mês ${String(m.n).padStart(2, '0')}`} color={m.cor} />
        {next ? <Link to={`/app/mes/${next.k}/${tab}`} className="mnav"><Ic n="right" s={18} w={2.4} /></Link> : <span className="mnav" />}
      </div>
      <nav className="mtabs">{TABS.map(([t, l, ic]) => <NavLink key={t} end to={`/app/mes/${mk}${t ? '/' + t : ''}`} className={({ isActive }) => (isActive ? 'on' : '')}><Ic n={ic} s={15} /><span>{l}</span></NavLink>)}</nav>
      <Entry k={`${mk}.${ek}`}><Comp m={m} /></Entry>
    </div>
  )
}

function Visao({ m }) {
  const ano = useAno(); const YEAR = ano; const DATAS = datasDoAno(ano)
  const first = new Date(YEAR, m.n - 1, 1).getDay()
  const days = diasDoMes(m.n, ano)
  const cells = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)]
  while (cells.length % 7) cells.push(null)
  const [sel, setSel] = useState(null)
  const d = useEntry(`${m.k}.visao`)
  const ed = useEntry(`${m.k}.ed`)
  return (
    <>
      <div className="mcal-big">
        {WD.map((w) => <div key={w} className="wd">{w}</div>)}
        {cells.map((dd, i) => dd ? (
          <button key={i} className={'day' + (sel === dd ? ' sel' : '') + (d[`dia.${dd}`] ? ' has' : '') + (ed[`${dd}.ideia`] ? ' post' : '')} onClick={() => setSel(sel === dd ? null : dd)}>
            <b>{dd}</b>
            {DATAS[`${m.n}-${dd}`] && <span className={'chip ' + DATAS[`${m.n}-${dd}`][1]}>{DATAS[`${m.n}-${dd}`][0]}</span>}
            {d[`dia.${dd}`] && <span className="dtxt">{d[`dia.${dd}`]}</span>}
          </button>
        ) : <div key={i} className="day empty" />)}
      </div>
      {sel && (
        <Card className="daycard" title={`${String(sel).padStart(2, '0')}/${String(m.n).padStart(2, '0')} · ${WD[new Date(YEAR, m.n - 1, sel).getDay()]}`} icon="cal" color={m.cor}>
          <A f={`dia.${sel}`} rows={2} ph="Compromissos, gravações, entregas…" />
          <div className="kv"><span>Post do dia</span><T k={`${m.k}.ed`} f={`${sel}.ideia`} ph="Ideia / tema" /></div>
        </Card>
      )}
      <div className="foco" style={{ '--c': m.cor }}><span className="foco-k"><Ic n="spark" s={13} /> foco sugerido do mês</span><b>{foco(m.n, ano)[0]}</b><p>{foco(m.n, ano)[1]}</p></div>
      <div className="g2">
        <Card title="3 metas do mês" icon="target" color={m.cor}>{[1, 2, 3].map((k) => <div className="mt" key={k}><C f={`metaok${k}`} /><T f={`meta${k}`} ph={`Meta ${k}`} /></div>)}</Card>
        <Card title="Prospecção do mês" icon="door" color={m.cor}>
          {[['panf', 'Panfletos entregues'], ['vis', 'Visitas'], ['conv', 'Conversas'], ['contr', 'Contratos']].map(([k, l]) => <div className="kv" key={k}><span>{l}</span><N f={`pro.${k}`} /></div>)}
        </Card>
      </div>
      <Card><Field label="Conteúdos principais do mês"><A f="principais" rows={4} /></Field></Card>
      <Card title="Anotações" icon="note"><A f="notas" rows={3} /></Card>
    </>
  )
}

function Editorial({ m }) {
  const ano = useAno(); const YEAR = ano; const DATAS = datasDoAno(ano)
  const days = diasDoMes(m.n, ano)
  const d = useEntry(`${m.k}.ed`)
  let post = 0, grav = 0, plan = 0
  for (let i = 1; i <= days; i++) { if (d[`${i}.post`]) post++; if (d[`${i}.grav`]) grav++; if (d[`${i}.ideia`]) plan++ }
  return (
    <>
      <div className="stats three"><Stat icon="idea" label="Planejados" value={plan} color="#8B5CF6" /><Stat icon="cam" label="Gravados" value={grav} color="#FF7A2F" /><Stat icon="send" label="Postados" value={post} color="#10B981" /></div>
      <div className="ed">
        {Array.from({ length: days }, (_, i) => i + 1).map((dd) => {
          const dt = DATAS[`${m.n}-${dd}`]; const wd = WD[new Date(YEAR, m.n - 1, dd).getDay()]
          return (
            <div key={dd} className={'ed-r' + (dt ? ' ' + dt[1] : '') + (wd === 'sáb' || wd === 'dom' ? ' we' : '')}>
              <div className="ed-d"><b>{String(dd).padStart(2, '0')}</b><span>{wd}</span></div>
              <div className="ed-f">
                {dt && <span className={'chip ' + dt[1]}>{dt[0]}</span>}
                <T f={`${dd}.ideia`} ph="Ideia / tema" />
                <div className="ed-2"><S f={`${dd}.fmt`} opts={FORMATOS} /><T f={`${dd}.dor`} ph="Dor que responde" /></div>
              </div>
              <div className="ed-c"><C f={`${dd}.grav`} /><span>grav</span><C f={`${dd}.post`} /><span>post</span>
                <a className="sino" href={linkAgenda({ ano: YEAR, mes: m.n, dia: dd, titulo: d[`${dd}.ideia`] ? `Conteúdo: ${d[`${dd}.ideia`]}` : 'Conteúdo do dia', detalhes: [d[`${dd}.fmt`] && `Formato: ${d[`${dd}.fmt`]}`, d[`${dd}.dor`] && `Dor que responde: ${d[`${dd}.dor`]}`, 'Planner do Criador: ' + location.origin + location.pathname + `#/app/mes/${m.k}/editorial`].filter(Boolean).join('\n') })} target="_blank" rel="noreferrer" aria-label={`Lembrete no Google Agenda para o dia ${dd}`} title="Lembrar no Google Agenda"><Ic n="bell" s={15} /></a></div>
            </div>
          )
        })}
      </div>
    </>
  )
}

function Semanas({ m }) {
  const ano = useAno(); const YEAR = ano; const DATAS = datasDoAno(ano)
  const ws = semanas(m.n, ano)
  const dias = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom']
  return (
    <>
      <Card title="Ritmo do mês" icon="check" color={m.cor}>
        <p className="mut sm">Marque cada etapa concluída na semana.</p>
        {ws.map(([a, b], w) => (
          <div className="wk" key={w}>
            <div className="wk-h"><b>Semana {w + 1}</b><span className="mut">{String(a).padStart(2, '0')}–{String(b).padStart(2, '0')}</span></div>
            <div className="wk-c">{ETAPAS.map(([k, l]) => <C key={k} f={`rit.${w + 1}.${k}`} label={l.split(' /')[0]} />)}</div>
            <T f={`rit.${w + 1}.como`} ph="Como foi a semana (uma linha basta)" />
          </div>
        ))}
      </Card>
      <Card title="Semana modelo" icon="film" color={m.cor}>
        <div className="g2 tight"><T f="de" ph="de (data)" /><T f="ate" ph="até (data)" /></div>
        <div className="scroll"><table className="wkt"><thead><tr><th></th>{dias.map((x) => <th key={x}>{x}</th>)}</tr></thead>
          <tbody>{ETAPAS.map(([k, l]) => <tr key={k}><td className="rl">{l}</td>{dias.map((_, i) => <td key={i}><T f={`${k}.${i}`} /></td>)}</tr>)}</tbody></table></div>
      </Card>
      <div className="g2">
        <Card title="Checklist de set" icon="check" color={m.cor}><Checklist f="set" itens={CHECK_SET} /></Card>
        <div><Card><Field label="Lista de cenas e b-roll"><A f="cenas" rows={3} /></Field></Card><Card><Field label="Locais, pessoas e objetos"><A f="locais" rows={3} /></Field></Card></div>
      </div>
    </>
  )
}

const EX_ROTEIRO = {
  titulo: '3 erros que fazem seu Reels parecer amador', fmt: 'Reels', status: 'Roteirizado', quem: 'Donas de pequenos negócios', dor: 'Gravam e ninguém assiste até o fim', faz: 'Desistem de gravar e acham que não levam jeito',
  gancho: 'Seu vídeo não é ruim. Ele só começa do jeito errado.', prob: 'Você grava com carinho, posta, e as pessoas saem nos primeiros segundos.', virada: 'Três ajustes resolvem: comece pela frase mais forte, grave de frente para a janela e corte as pausas.',
  prova: 'Mostre o antes e depois do mesmo vídeo com os três ajustes.', cham: 'Salve para lembrar na próxima gravação e me conte qual erro você comete.', leg: 'Cenas: eu na janela, tela do app de edição. Palavras: reels, gravar, iniciante',
}

function Roteiros({ m }) {
  const [lista, set] = useF('lista')
  const rs = Array.isArray(lista) && lista.length ? lista : [{}]
  const upd = (i, k, v) => { const n = [...rs]; n[i] = { ...n[i], [k]: v }; set(n) }
  const partes = [['gancho', 'Gancho', '0 a 3 s'], ['prob', 'Problema', '3 a 10 s'], ['virada', 'Virada', 'a ideia'], ['prova', 'Prova', 'exemplo'], ['cham', 'Chamada', 'ação']]
  return (
    <>
      {rs.map((r, i) => (
        <section className="rt card" key={i} style={{ '--c': m.cor }}>
          <div className="rt-h"><span className="rt-n">#{i + 1}</span><input className="in big" placeholder="Título / tema do vídeo" value={r.titulo || ''} onChange={(e) => upd(i, 'titulo', e.target.value)} />
            {rs.length > 1 && <DelBtn onDel={() => { const tirado = rs[i]; set(rs.filter((_, j) => j !== i)); toast('Roteiro apagado', ['Desfazer', () => { const n = rs.filter((_, j) => j !== i); n.splice(i, 0, tirado); set(n) }]) }} />}</div>
          {!r.titulo && !r.gancho && !r.prob && <Exemplo onFill={() => { const n = [...rs]; n[i] = { ...EX_ROTEIRO, ...Object.fromEntries(Object.entries(r).filter(([, v]) => v)) }; set(n) }}>Ver um roteiro de exemplo</Exemplo>}
          <div className="g3 tight">
            <select className="in sel" value={r.fmt || ''} onChange={(e) => upd(i, 'fmt', e.target.value)}>{FORMATOS.map((o) => <option key={o} value={o}>{o || 'formato'}</option>)}</select>
            <input className="in" placeholder="Data de postagem" value={r.data || ''} onChange={(e) => upd(i, 'data', e.target.value)} />
            <select className="in sel" value={r.status || ''} onChange={(e) => upd(i, 'status', e.target.value)}>{['', 'Ideia', 'Roteirizado', 'Gravado', 'Editado', 'Postado'].map((o) => <option key={o} value={o}>{o || 'status'}</option>)}</select>
          </div>
          <div className="g3 tight">{[['quem', 'Para quem?'], ['dor', 'Qual a dor?'], ['faz', 'O que ela sente e faz?']].map(([k, l]) => <input key={k} className="in" placeholder={l} value={r[k] || ''} onChange={(e) => upd(i, k, e.target.value)} />)}</div>
          {partes.map(([k, l, s]) => (
            <div className="rt-r" key={k}><div className="rt-l"><b>{l}</b><span>{s}</span></div><textarea className="in ta" rows={2} value={r[k] || ''} onChange={(e) => upd(i, k, e.target.value)} /></div>
          ))}
          <textarea className="in ta" rows={2} placeholder="Cenas / b-roll · legenda e palavras-chave" value={r.leg || ''} onChange={(e) => upd(i, 'leg', e.target.value)} />
          <div className="rt-ck">{['Usei palavras do público', 'Uma ideia só', 'Gancho testado em voz alta', 'Chamada clara'].map((l, j) => (
            <label key={j} className={'ck' + (r['ck' + j] ? ' on' : '')}><input type="checkbox" checked={!!r['ck' + j]} onChange={(e) => upd(i, 'ck' + j, e.target.checked)} /><span className="box"><Ic n="check" s={12} w={3} /></span><span className="ckl">{l}</span></label>
          ))}</div>
        </section>
      ))}
      <button className="btn full" onClick={() => set([...rs, {}])}><Ic n="plus" s={16} w={2.6} /> Novo roteiro</button>
    </>
  )
}

function DelBtn({ onDel }) {
  const [ask, setAsk] = useState(false)
  return ask ? <span className="delask"><button className="btn sm" onClick={() => { setAsk(false); onDel() }}>Apagar</button><button className="btn ghost sm" onClick={() => setAsk(false)}>Não</button></span>
    : <button className="rdel" onClick={() => setAsk(true)} aria-label="Apagar roteiro"><Ic n="trash" s={16} /></button>
}

function Analise({ m }) {
  const ano = useAno(); const YEAR = ano; const DATAS = datasDoAno(ano)
  const d = useEntry(`${m.k}.an`); const ed = useEntry(`${m.k}.ed`)
  let postados = 0; for (let i = 1; i <= diasDoMes(m.n, ano); i++) if (ed[`${i}.post`]) postados++
  return (
    <>
      <div className="an">{ANALISE.map(([k, l]) => {
        const meta = num(d[`${k}.meta`]), real = num(d[`${k}.real`]); const pct = meta ? Math.round(real / meta * 100) : null
        return (
          <div className="an-r card" key={k}>
            <div className="an-h"><b>{l}</b>{pct != null && <span className={'pct ' + (pct >= 100 ? 'ok' : pct >= 60 ? 'mid' : 'low')}>{pct}%</span>}</div>
            <div className="an-n"><label>Meta<N f={`${k}.meta`} /></label><label>Real<N f={`${k}.real`} /></label></div>
            {pct != null && <div className="prog"><i style={{ width: Math.min(100, pct) + '%', background: m.cor }} /></div>}
            {k === 'pub' && postados > 0 && <button className="link sm" onClick={() => setField(`${m.k}.an`, 'pub.real', String(postados))}>Usar {postados} postados do editorial</button>}
            <T f={`${k}.diz`} ph="O que isso me diz" />
          </div>
        )
      })}</div>
      <Card title="Top 3 conteúdos do mês e por quê" icon="trophy" color={m.cor}>
        <Rows f="top" min={3} cols={[{ k: 'cont', l: 'Conteúdo', w: '1.4fr' }, { k: 'fmt', l: 'Formato', t: 'select', opts: FORMATOS, w: '110px' }, { k: 'pq', l: 'Por que funcionou', w: '1.4fr' }]} />
      </Card>
      <div className="g2">
        <Card><Field label="Onde eu errei"><A f="errei" /></Field></Card>
        <Card><Field label="Por que acho que errei"><A f="porque" /></Field></Card>
        <Card><Field label="O que mudo no próximo mês (uma coisa)" hl><A f="muda" /></Field></Card>
        <Card><Field label="Frases novas do público que ouvi"><A f="frases" /></Field></Card>
      </div>
    </>
  )
}

function Negocio({ m }) {
  useStoreVersion()
  const ano = useAno()
  const k = `${m.k}.neg`; const neg = useEntry(k)
  const s = mesStats(m.k)
  // primeira vez no mês: traz do mês anterior o que é fixo (cliente mensal, assinaturas)
  useEffect(() => {
    if (Array.isArray(neg.contratos) || Array.isArray(neg.gastos) || neg.semeado) return
    const ant = mesAnterior(m, ano)
    const c = lista(ant.contratos).filter((r) => r.rep).map((r) => ({ ...r, pago: false, venc: maisUmMes(r.venc), ref: undefined }))
    const g = lista(ant.gastos).filter((r) => r.rep).map((r) => ({ ...r, ref: undefined }))
    if (c.length) setField(k, 'contratos', c)
    if (g.length) setField(k, 'gastos', g)
    if (c.length || g.length) setField(k, 'semeado', true)
  }, [k])
  const pend = lista(neg.contratos).filter((r) => !r.pago && num(r.val)).map((r) => ({ ...r, sit: situacao(r) }))
  const cats = {}; lista(neg.gastos).forEach((r) => { if (num(r.val)) cats[r.cat || 'Sem categoria'] = (cats[r.cat || 'Sem categoria'] || 0) + num(r.val) })
  const catL = Object.entries(cats).sort((a, b) => b[1] - a[1])
  const props = lista(neg.props).filter((p) => p.cli || num(p.val))
  const fech = props.filter((p) => p.st === 'Fechada').length; const decid = props.filter((p) => p.st === 'Fechada' || p.st === 'Perdida').length
  const emNeg = props.filter((p) => p.st !== 'Fechada' && p.st !== 'Perdida').reduce((t, p) => t + num(p.val), 0)
  return (
    <>
      <div className="stats"><Stat icon="coin" label="Entradas" value={brl(s.ent)} color="#3B82F6" /><Stat icon="check" label="Já recebido" value={brl(s.rec)} color="#10B981" /><Stat icon="user" label="Seu pró-labore" value={brl(s.pro)} color="#EC4899" /><Stat icon="spark" label="Sobrou no caixa" value={brl(s.sob)} color={s.sob < 0 ? '#E11D48' : '#8B5CF6'} /></div>
      <Card title="Meta de faturamento" icon="target" color={m.cor}>
        <div className="kv"><span>Quero faturar em {m.nome.toLowerCase()}</span><N f="meta" money /></div>
        {s.meta > 0 && <><div className="prog big"><i style={{ width: Math.min(100, s.ent / s.meta * 100) + '%' }} /></div><p className="mut sm">{s.ent >= s.meta ? 'Meta batida! 🎉' : `${Math.round(s.ent / s.meta * 100)}% da meta · faltam ${brl(s.meta - s.ent)}`}</p></>}
      </Card>
      <ImportarExtrato m={m} />
      <Card title="Contratos e entradas" fold id="neg-contratos" resumo={brl(s.ent)} icon="coin" color={m.cor}>
        <Rows f="contratos" min={3} add="Adicionar contrato" cols={[{ k: 'cli', l: 'Cliente' }, { k: 'srv', l: 'Serviço', w: '1.2fr' }, { k: 'val', l: 'Valor', t: 'money', w: '110px' }, { k: 'venc', l: 'Vencimento', t: 'date', w: '140px' }, { k: 'pago', l: 'Pago', t: 'check', w: '44px' }, { k: 'rep', l: 'Fixo', t: 'check', w: '44px' }]} />
        <p className="mut sm"><b>Fixo</b> = cliente mensal: ele já aparece no mês seguinte, com o vencimento do mês seguinte.</p>
      </Card>
      {pend.length > 0 && <Card title={`A receber · ${brl(pend.reduce((t, r) => t + num(r.val), 0))}`} icon="bell" color="#F59E0B">
        <ReceberLista itens={pend} />
      </Card>}
      <div className="g2">
        <Card title="Gastos do negócio" icon="flyer" color={m.cor} fold id="neg-gastos" resumo={brl(s.gas)}>
          <Rows f="gastos" min={3} add="Adicionar gasto" cols={[{ k: 'item', l: 'Item' }, { k: 'cat', l: 'Categoria', t: 'select', opts: CATEGORIAS, w: '1fr' }, { k: 'val', l: 'Valor', t: 'money', w: '110px' }, { k: 'rep', l: 'Fixo', t: 'check', w: '44px' }]} />
          <p className="mut sm"><b>Fixo</b> = assinatura ou conta que se repete: já aparece no mês seguinte.</p>
        </Card>
        <Card title="Resumo do mês" icon="chart" color={m.cor}>
          <div className="kv"><span>Entradas</span><Calc value={brl(s.ent)} money /></div>
          <div className="kv sub"><span>· já recebido</span><Calc value={brl(s.rec)} money /></div>
          <div className="kv sub"><span>· a receber</span><Calc value={brl(s.arec)} money /></div>
          <div className="kv"><span>Gastos</span><Calc value={brl(s.gas)} money /></div>
          <div className="kv"><span>Para a caixinha <Link to="/app/ferramentas/escada" className="auto">% da escada</Link></span><Calc value={brl(s.cx)} money /></div>
          <div className="kv"><span>Parcelas de equipamento</span><N f="parc" money /></div>
          <div className="kv"><span>Meu pró-labore <em className="auto">o seu salário</em></span><N f="prolabore" money /></div>
          <div className="kv"><span>Reserva do negócio</span><N f="reserva" money /></div>
          <div className="kv big"><span>Sobrou no caixa</span><Calc value={brl(s.sob)} money /></div>
          <p className="mut sm">Pró-labore é o que você tira para você. Separar isso mostra se o trabalho está pagando as suas contas.</p>
        </Card>
      </div>
      {catL.length > 0 && <Card title="Para onde foi o dinheiro" icon="chart" color="#E11D48" fold aberto={false} id="neg-cats" resumo={`${catL.length} ${catL.length === 1 ? 'categoria' : 'categorias'}`}>
        {catL.map(([c, v]) => <div key={c} className="catl"><div className="kv"><span>{c}</span><b>{brl(v)}</b></div><div className="prog"><i style={{ width: (v / catL[0][1] * 100) + '%', background: '#E11D48' }} /></div></div>)}
      </Card>}
      <Card title="Propostas" icon="send" color={m.cor} fold aberto={props.length > 0} id="neg-props" resumo={props.length ? `${props.length} · ${fech} ${fech === 1 ? 'fechada' : 'fechadas'}` : ''}>
        {props.length > 0 && <div className="kv"><span>{props.length} {props.length === 1 ? 'enviada' : 'enviadas'} · {fech} {fech === 1 ? 'fechada' : 'fechadas'}{decid ? ` · taxa de fechamento ${Math.round(fech / decid * 100)}%` : ''}</span>{emNeg > 0 && <b>{brl(emNeg)} em negociação</b>}</div>}
        <Rows f="props" min={2} add="Adicionar proposta" cols={[{ k: 'cli', l: 'Cliente' }, { k: 'val', l: 'Valor', t: 'money', w: '110px' }, { k: 'env', l: 'Enviada em', t: 'date', w: '140px' }, { k: 'st', l: 'Status', t: 'select', opts: STATUS_PROP, w: '130px' }]} />
        {!props.length && <Exemplo onFill={() => setField(k, 'props', [{ cli: 'Studio Fit (exemplo)', val: '900', env: new Date().toISOString().slice(0, 10), st: 'Enviada' }])}>Ver um exemplo de proposta</Exemplo>}
        {neg.propostas && <Field label="Anotações antigas"><A f="propostas" /></Field>}
      </Card>
      <Card title="Avaliações pedidas no Google" icon="globe" color={m.cor} fold aberto={!!neg.aval} id="neg-aval"><A f="aval" /></Card>
    </>
  )
}

const SIT = { atrasado: ['atrasado', '#E11D48'], hoje: ['vence hoje', '#F59E0B'], 'a-vencer': ['a vencer', '#3B82F6'], 'sem-data': ['sem data', '#9CA3AF'] }
export function ReceberLista({ itens, comMes }) {
  return (
    <div className="rec-l">{itens.map((r, i) => {
      const [y, mo, d] = (r.venc || '').split('-').map(Number)
      return (
        <div key={i} className="rec-r">
          <span className="rec-s" style={{ '--c': SIT[r.sit][1] }}>{SIT[r.sit][0]}</span>
          <span className="rec-t"><b>{r.cli || 'Cliente'}</b>{r.srv && <em> · {r.srv}</em>}{comMes && r.m && <Link to={`/app/mes/${r.m.k}/negocio`} className="auto"> {r.m.nome}</Link>}</span>
          <span className="rec-v">{r.venc && <span className="mut sm">{String(d).padStart(2, '0')}/{String(mo).padStart(2, '0')}</span>}<b>{brl(num(r.val))}</b></span>
          {r.venc && <a className="sino" href={linkAgenda({ ano: y, mes: mo, dia: d, titulo: `Cobrar ${r.cli || 'cliente'}: ${brl(num(r.val))}`, detalhes: [r.srv && `Serviço: ${r.srv}`, 'Planner do Criador: ' + location.origin + location.pathname + '#/app/financeiro'].filter(Boolean).join('\n') })} target="_blank" rel="noreferrer" aria-label={`Lembrete de cobrança de ${r.cli || 'cliente'} no Google Agenda`} title="Lembrar de cobrar no Google Agenda"><Ic n="bell" s={15} /></a>}
        </div>
      )
    })}</div>
  )
}
