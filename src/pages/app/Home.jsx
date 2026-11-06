import { Link } from 'react-router-dom'
import { Ic, Md, Head, Stat, Tweet } from '../../components/ui'
import { MESES, foco, mesesDoAno, ANOS_BONUS, CARTA, datasDoAno } from '../../data/content'
import { useEntry, useStoreVersion, brl, int, getAno, useAno } from '../../lib/store'
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
  const m = mesAtual()
  const t = anoStats()
  const stories = [['/app/guia', 'Guia', 'bulb', 'var(--pink)'], ['/app/ferramentas', 'Ferramentas', 'target', 'var(--violet)'], [`/app/mes/${m.k}`, m.nome, 'cal', m.cor],
    ['/app/2027', `Meu ${ano}`, 'trophy', '#10B981'], ['/app/ideias', 'Ideias', 'idea', '#F59E0B'], ['/app/notas', 'Notas', 'note', '#3B82F6']]
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

      <Link to={`/app/mes/${m.k}/editorial`} className="card today">
        <div className="ch"><Ic n="cal" s={16} /><span>{ehAno ? 'Hoje' : 'Primeiro post do período'} · {String(dia).padStart(2, '0')}/{String(m.n).padStart(2, '0')}</span>{DATAS[`${m.n}-${dia}`] && <em className="chip">{DATAS[`${m.n}-${dia}`][0]}</em>}</div>
        <p className="big">{ed[`${dia}.ideia`] || <span className="mut">Nenhuma ideia planejada. Toque para abrir o calendário editorial.</span>}</p>
        {ed[`${dia}.fmt`] && <span className="chip">{ed[`${dia}.fmt`]}</span>}
      </Link>

      <div className="stats">
        <Stat icon="play" label="Publicados no ano" value={int(t.pub)} color="#FF3D77" />
        <Stat icon="trophy" label="Contratos" value={int(t.con)} color="#10B981" />
        <Stat icon="coin" label="Entradas" value={brl(t.ent)} color="#3B82F6" />
        <Stat icon="cam" label="Caixinha" value={brl(t.cx)} color="#F59E0B" />
      </div>

      <h2 className="sect"><Ic n="grid" s={16} /> {ano} mês a mês</h2>
      {ANOS_BONUS[ano] && <div className="bonus"><span className="pill">bônus {ano}</span><b>{mesesDoAno(ano).map((x) => x.nome).join(' e ')} de {ano} já estão aqui</b><p>Comece agora e chegue em {ano + 1} com a rotina pronta. Troque o ano no topo quando quiser.</p></div>}
      <div className="feed">{mesesDoAno(ano).map((x) => (
        <Link key={x.k} to={`/app/mes/${x.k}`} className="post" style={{ '--c': x.cor }}><b>{x.nome}</b><span>{foco(x.n, ano)[0]}</span><i>{String(x.n).padStart(2, '0')}</i></Link>
      ))}</div>

      <Link to="/app/carta" className="card letter"><div className="ch"><Ic n="heart" s={16} /><span>Antes de começar</span></div><p className="mut">Uma conversa sincera sobre como eu comecei. Leia antes de planejar o ano.</p></Link>
    </div>
  )
}

export function Carta() {
  return (
    <div className="page">
      <Head icon="heart" title="Antes de começar" sub="Uma conversa sincera sobre como eu comecei" back="/app" />
      <article className="igpost">
        <div className="igp-h"><div className="mava" /><b>planner.do.criador</b><span className="more">•••</span></div>
        <div className="igp-b">{CARTA.map((p, i) => <p key={i}><Md t={p} /></p>)}<p className="sign">com carinho, e bora começar ♡</p></div>
        <div className="igp-a"><Ic n="heart" /><Ic n="comment" /><Ic n="send" /><span style={{ flex: 1 }} /><Ic n="bookmark" /></div>
      </article>
      <Tweet text="“Não espere ter tudo para começar. Comece, e deixe o trabalho pagar o próximo passo.”" />
    </div>
  )
}
