import { Link, useNavigate } from 'react-router-dom'
import { Ic, Md, Head, Stat, Tweet } from '../../components/ui'
import { anoFinanceiro } from '../../lib/financeiro'
import { useBloqueio } from '../../lib/bloqueio'
import { diaDoDesafio } from './Desafio60'
import { MESES, foco, mesesDoAno, ANOS_BONUS, CARTA, datasDoAno, LICOES, D60, semanas, diasDoMes } from '../../data/content'
import { useEntry, useStoreVersion, brl, int, getAno, useAno, setField, getEntry, num } from '../../lib/store'
import { anoStats } from '../../lib/calc'

export function mesAtual() {
  const d = new Date()
  const vis = mesesDoAno(getAno())
  return d.getFullYear() === getAno() && vis.includes(MESES[d.getMonth()]) ? MESES[d.getMonth()] : vis[0]
}

export default function Home() {
  useStoreVersion()
  const ano = useAno(); const YEAR = ano; const DATAS = datasDoAno(ano)
  const capa = useEntry('capa')
  const { mesLiberado } = useBloqueio()
  const m = mesAtual()
  const t = anoStats()
  const stories = [['/app/guia', 'Guia', 'bulb', 'var(--pink)'], ['/app/ferramentas', 'Ferramentas', 'target', 'var(--violet)'], [`/app/mes/${m.k}`, m.nome, 'cal', m.cor],
    ['/app/financeiro', 'Financeiro', 'coin', '#10B981'], ['/app/2027', `Meu ${ano}`, 'trophy', '#8B5CF6'], ['/app/ideias', 'Ideias', 'idea', '#F59E0B'], ['/app/notas', 'Notas', 'note', '#3B82F6']]
  const hoje = new Date(); const ehAno = hoje.getFullYear() === YEAR
  const ed = useEntry(`${m.k}.ed`)
  const dia = ehAno ? hoje.getDate() : 1
  return (
    <div className="page">
      <section className="prof">
        <Link to="/app/perfil" className="ring big"><div><span>{(capa.nome || 'eu').slice(0, 2)}</span></div></Link>
        <div className="prof-st">
          <div><b>{int(t.pub)}</b><span>posts</span></div>
          <div><b>{int(t.con)}</b><span>contratos</span></div>
          <div><b>{capa.meta || '—'}</b><span>meta seg.</span></div>
        </div>
      </section>
      <div className="prof-n"><b>{capa.nome || 'Seu nome'}</b> {capa.user && <span className="mut">@{capa.user.replace('@', '')}</span>}<p>{capa.bio || <Link to="/app/perfil" className="mut">Toque para preencher seu perfil</Link>}</p></div>

      <div className="stories">{stories.map(([to, l, ic, c]) => (
        <Link key={l} to={to} className="story" style={{ '--c': c }}><div className="ring"><div><Ic n={ic} s={22} /></div></div><span>{l}</span></Link>
      ))}</div>

      <Link to={`/app/mes/${m.k}`} className="foco" style={{ '--c': m.cor }}>
        <span className="foco-k"><Ic n="spark" s={13} /> foco de {m.nome.toLowerCase()}</span>
        <b>{foco(m.n, ano)[0]}</b><p>{foco(m.n, ano)[1]}</p>
      </Link>

      <HojeCard m={m} dia={dia} ehAno={ehAno} ed={ed} DATAS={DATAS} />

      <div className="stats">
        <Stat icon="play" label="Publicados no ano" value={int(t.pub)} color="#FF3D77" />
        <Stat icon="trophy" label="Contratos" value={int(t.con)} color="#10B981" />
        <Link to="/app/financeiro" className="stat-l"><Stat icon="coin" label="Entradas · ver financeiro" value={brl(t.ent)} color="#3B82F6" /></Link>
        <Stat icon="cam" label="Caixinha" value={brl(t.cx)} color="#F59E0B" />
      </div>

      <h2 className="sect"><Ic n="grid" s={16} /> {ano} mês a mês</h2>
      {ANOS_BONUS[ano] && <div className="bonus"><span className="pill">bônus {ano}</span><b>{mesesDoAno(ano).map((x) => x.nome).join(' e ')} de {ano} já estão aqui</b><p>Comece agora e chegue em {ano + 1} com a rotina pronta. Troque o ano no topo quando quiser.</p></div>}
      <div className="feed">{mesesDoAno(ano).map((x) => (
        <Link key={x.k} to={`/app/mes/${x.k}`} className={'post' + (mesLiberado(x.n, ano) ? '' : ' trancado')} style={{ '--c': x.cor }}><b>{x.nome}</b><span>{foco(x.n, ano)[0]}</span><i>{mesLiberado(x.n, ano) ? String(x.n).padStart(2, '0') : <Ic n="lock" s={22} />}</i></Link>
      ))}</div>

      <Link to="/app/carta" className="card letter"><div className="ch"><Ic n="heart" s={16} /><span>Antes de começar</span></div><p className="mut">Uma conversa sincera sobre como eu comecei. Leia antes de planejar o ano.</p></Link>
    </div>
  )
}

export function Carta() {
  const ano = useAno()
  return (
    <div className="page">
      <Head icon="heart" title="Antes de começar" sub="Uma conversa sincera sobre como eu comecei" back="/app" />
      <article className="igpost">
        <div className="igp-h"><div className="mava" /><b>planner.do.criador</b><span className="more">•••</span></div>
        <div className="igp-b">{CARTA.map((p, i) => <p key={i}><Md t={p.replace('{ano}', ano)} /></p>)}<p className="sign">com carinho, e bora começar ♡</p></div>
        <div className="igp-a"><Ic n="heart" /><Ic n="comment" /><Ic n="send" /><span style={{ flex: 1 }} /><Ic n="bookmark" /></div>
      </article>
      <Tweet text="“Não espere ter tudo para começar. Comece, e deixe o trabalho pagar o próximo passo.”" />
    </div>
  )
}

// "Hoje": o que fazer agora, sem precisar navegar
function HojeCard({ m, dia, ehAno, ed, DATAS }) {
  const vis = useEntry(`${m.k}.visao`)
  const f = anoFinanceiro()
  const cobrar = f.aReceber.filter((r) => r.sit === 'atrasado' || r.sit === 'hoje')
  const metas = [1, 2, 3].filter((k) => vis[`meta${k}`] && !vis[`metaok${k}`])
  const prox = LICOES.find((l) => !getEntry(l.id).feita)
  const d60 = useEntry('d60'); const { emTeste } = useBloqueio(); const dd = !emTeste ? diaDoDesafio(d60.inicio) : null; const tarefa = dd ? D60[dd - 1] : null
  const tg = (k, f2, v) => setField(k, f2, v)
  const ideia = ed[`${dia}.ideia`]
  return (
    <section className="card today">
      <div className="ch"><Ic n="cal" s={16} /><span>{ehAno ? 'Hoje' : 'Primeiro post do período'} · {String(dia).padStart(2, '0')}/{String(m.n).padStart(2, '0')}</span>{DATAS[`${m.n}-${dia}`] && <em className="chip">{DATAS[`${m.n}-${dia}`][0]}</em>}</div>
      <Tarefa m={m} dia={dia} ehAno={ehAno} ed={ed} />
      {cobrar.length > 0 && <Link to="/app/financeiro" className="hj-i warn"><Ic n="bell" s={16} /><span><b>{cobrar.length === 1 ? '1 cobrança' : `${cobrar.length} cobranças`}</b> para hoje ou atrasada{cobrar.length > 1 ? 's' : ''} · {brl(cobrar.reduce((s2, r) => s2 + num(r.val), 0))}</span><Ic n="right" s={14} /></Link>}
      {metas.map((k) => (
        <div key={k} className="hj-i"><button className="hj-bx" aria-label="Marcar meta como feita" onClick={() => tg(`${m.k}.visao`, `metaok${k}`, true)} /><span><small>meta do mês</small> {vis[`meta${k}`]}</span></div>
      ))}
      {tarefa && <Link to="/app/desafio60" className="hj-i"><Ic n="flag" s={16} /><span><small>desafio · dia {tarefa.n}{d60[`${tarefa.n}.ok`] ? ' · feito ✓' : ''}</small> {tarefa.t}</span><Ic n="right" s={14} /></Link>}
      {prox && <Link to={`/app/guia/${prox.id}`} className="hj-i"><Ic n="bulb" s={16} /><span><small>próxima lição</small> {prox.titulo}</span><Ic n="right" s={14} /></Link>}
    </section>
  )
}

// postou neste dia? (olha o Editorial do mês certo)
function postouEm(dt) { const ed = getEntry(`${MESES[dt.getMonth()].k}.ed`); return !!ed[`${dt.getDate()}.post`] }
export function sequencia() {
  const ano = getAno(); const d = new Date(); let n = 0
  if (!postouEm(d)) d.setDate(d.getDate() - 1)
  while (d.getFullYear() === ano && postouEm(d) && n < 400) { n++; d.setDate(d.getDate() - 1) }
  return n
}

// Sua tarefa de hoje: uma ação clara, o progresso da semana e a sequência de dias postando
function Tarefa({ m, dia, ehAno, ed }) {
  const nav = useNavigate()
  const capa = useEntry('capa'); const rot = useEntry(`${m.k}.rot`)
  const ideia = ed[`${dia}.ideia`]; const fmt = ed[`${dia}.fmt`]
  const lista = Array.isArray(rot.lista) ? rot.lista : []
  const idx = ideia ? lista.findIndex((r) => (r.titulo || '').trim().toLowerCase() === ideia.trim().toLowerCase()) : -1
  const temRoteiro = idx >= 0 && (lista[idx].gancho || lista[idx].virada)
  const roteirizar = (txt, dd) => {
    if (idx < 0) setField(`${m.k}.rot`, 'lista', [...lista.filter((r) => Object.values(r).some(Boolean)), { titulo: txt, fmt: ed[`${dd}.fmt`] || '', dor: ed[`${dd}.dor`] || '', data: `${getAno()}-${String(m.n).padStart(2, '0')}-${String(dd).padStart(2, '0')}`, status: 'Ideia' }])
    nav(`/app/mes/${m.k}/roteiros`)
  }
  // próximo dia com post planejado (para quando hoje está livre)
  let prox = null
  for (let d = dia + 1; d <= Math.min(diasDoMes(m.n, getAno()), dia + 7); d++) if (ed[`${d}.ideia`] && !ed[`${d}.post`]) { prox = d; break }
  let t
  if (!capa.onboarded) t = { k: 'comece por aqui', b: 'Termine de montar o seu planner', s: '4 perguntas, 2 minutos. No fim, os seus 5 primeiros posts já ficam no calendário.', btn: 'Continuar', go: () => nav('/boas-vindas') }
  else if (ideia && ed[`${dia}.post`]) t = { k: 'feito por hoje ✓', b: ideia, s: prox ? `Próximo: dia ${String(prox).padStart(2, '0')}, ${ed[`${prox}.ideia`]}` : 'Planeje os próximos posts quando der.', btn: prox ? 'Adiantar o roteiro' : 'Abrir o editorial', go: () => (prox ? roteirizar(ed[`${prox}.ideia`], prox) : nav(`/app/mes/${m.k}/editorial`)), ok: true }
  else if (ideia && ed[`${dia}.grav`]) t = { k: 'sua tarefa de hoje', b: `Postar: “${ideia}”`, s: [fmt, 'Depois de postar, marque aqui.'].filter(Boolean).join(' · '), btn: 'Marquei como postado', go: () => setField(`${m.k}.ed`, `${dia}.post`, true) }
  else if (ideia && temRoteiro) t = { k: 'sua tarefa de hoje', b: `Gravar: “${ideia}”`, s: [fmt, 'O roteiro já está pronto.'].filter(Boolean).join(' · '), btn: 'Abrir o roteiro', go: () => nav(`/app/mes/${m.k}/roteiros`), extra: ['Gravei', () => setField(`${m.k}.ed`, `${dia}.grav`, true)] }
  else if (ideia) t = { k: 'sua tarefa de hoje', b: `Roteirizar: “${ideia}”`, s: [fmt, ed[`${dia}.dor`] && `dor: ${ed[`${dia}.dor`]}`].filter(Boolean).join(' · ') || 'Gancho, problema, virada, prova e chamada.', btn: 'Escrever o roteiro', go: () => roteirizar(ideia, dia), extra: ['Já gravei', () => setField(`${m.k}.ed`, `${dia}.grav`, true)] }
  else if (prox) t = { k: 'sua tarefa de hoje', b: `Adiantar o post do dia ${String(prox).padStart(2, '0')}`, s: ed[`${prox}.ideia`], btn: 'Escrever o roteiro', go: () => roteirizar(ed[`${prox}.ideia`], prox) }
  else t = { k: 'sua tarefa de hoje', b: 'Planejar os posts da semana', s: 'Escolha 3 ideias e coloque no calendário. Sem ideia? Use os ganchos prontos.', btn: 'Abrir o editorial', go: () => nav(`/app/mes/${m.k}/editorial`), extra: ['Ganchos prontos', () => nav('/app/ferramentas/ganchos')] }
  // semana atual
  const w = semanas(m.n, getAno()).find(([a, b]) => dia >= a && dia <= b) || [dia, dia]
  let pl = 0, gr = 0, po = 0
  for (let d = w[0]; d <= w[1]; d++) { if (ed[`${d}.ideia`]) pl++; if (ed[`${d}.grav`]) gr++; if (ed[`${d}.post`]) po++ }
  const seq = ehAno ? sequencia() : 0
  const marco = [30, 14, 7, 3].find((x) => seq >= x)
  return (
    <>
      <div className={'tarefa' + (t.ok ? ' ok' : '')}>
        <small>{t.k}</small><b>{t.b}</b>{t.s && <span>{t.s}</span>}
        <div className="tarefa-b"><button className="btn" onClick={t.go}>{t.btn}</button>{t.extra && <button className="btn ghost" onClick={t.extra[1]}>{t.extra[0]}</button>}</div>
      </div>
      {capa.onboarded && <div className="semana">
        <div className="sem-h"><small>esta semana</small>{seq > 0 && <em>{marco ? '🔥 ' : ''}{seq} {seq === 1 ? 'dia' : 'dias'} seguidos postando</em>}</div>
        <div className="sem-l">{[['Planejados', pl, pl], ['Gravados', gr, pl], ['Postados', po, pl]].map(([l, v, tot]) => (
          <div key={l} className={'sem-i' + (l !== 'Planejados' && tot && v >= tot ? ' on' : '')}><b>{v}{tot ? `/${tot}` : ''}</b><span>{l}</span></div>
        ))}</div>
        {marco && <p className="sem-m">Medalha de {marco} dias conquistada! Não deixe a sequência cair.</p>}
      </div>}
    </>
  )
}
