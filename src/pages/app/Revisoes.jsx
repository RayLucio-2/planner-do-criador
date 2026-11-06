import { Link, useParams } from 'react-router-dom'
import { Ic, Head, Card, Rows, Entry, A, T, N, Field, Stat, useF } from '../../components/ui'
import { MESES as TODOS, foco, mesesDoAno, AREAS, FORMATOS } from '../../data/content'
const MESES = TODOS
import { useEntry, num, brl, int, useStoreVersion, useAno } from '../../lib/store'
import { mesStats, anoStats } from '../../lib/calc'

export function Semestre() {
  const { n } = useParams(); const k = `s${n}`; const ano = useAno()
  const ms = n === '1' ? MESES.slice(0, 6) : MESES.slice(6)
  return (
    <Entry k={k}><div className="page">
      <Head icon="flag" title={`${n}º semestre`} sub={n === '1' ? 'Janeiro a Junho' : 'Julho a Dezembro'} kicker="planejamento" color="var(--orange)" back="/app/meses" />
      <Card title="Prioridades" icon="flag" color="var(--orange)">{[1, 2, 3].map((i) => <div className="pri" key={i}><span className="pri-n">{i}</span><div><T f={`pri${i}.oque`} ph="O quê" /><T f={`pri${i}.como`} ph="Como vou saber que deu certo" /></div></div>)}</Card>
      <h2 className="sect">Mês a mês</h2>
      {ms.map((m) => <Card key={m.k} className="smr"><Link to={`/app/mes/${m.k}`} className="smr-h" style={{ '--c': m.cor }}><b>{m.nome}</b><span>{foco(m.n, ano)[0]}</span><Ic n="right" s={14} /></Link><A f={m.k} rows={2} ph="O que precisa acontecer" /></Card>)}
      <div className="g2"><Card><Field label="Hábito de criador para começar"><A f="habito" /></Field></Card><Card><Field label="O que vou deixar de lado"><A f="deixar" /></Field></Card></div>
    </div></Entry>
  )
}

export function Fechamento() {
  useStoreVersion()
  const { n } = useParams(); const k = `fs${n}`
  const ms = (n === '1' ? MESES.slice(0, 6) : MESES.slice(6)).map((m) => m.k)
  const t = anoStats(ms); const s = useEntry(`s${n}`)
  return (
    <Entry k={k}><div className="page">
      <Head icon="check" title={`Fechando o ${n}º semestre`} sub="Volte nas análises de cada mês antes de responder" kicker="revisão" color="var(--orange)" back="/app/meses" />
      <div className="stats three"><Stat icon="play" label="Publicados" value={int(t.pub)} color="#FF3D77" /><Stat icon="trophy" label="Contratos" value={int(t.con)} color="#10B981" /><Stat icon="coin" label="Entradas" value={brl(t.ent)} color="#3B82F6" /></div>
      <Card title="Prioridades do semestre" icon="flag" color="var(--orange)">{[1, 2, 3].map((i) => (
        <div className="pri" key={i}><span className="pri-n">{i}</span><div><b>{s[`pri${i}.oque`] || <span className="mut">Prioridade {i} (preencha em {n}º semestre)</span>}</b>
          <Resp f={`pri${i}.ok`} /><T f={`pri${i}.porque`} ph="O que ajudou ou atrapalhou" /></div></div>
      ))}</Card>
      <div className="g2">{[['erros', 'Erros que mais se repetiram'], ['funcionou', 'O que funcionou e vale repetir'], ['contratos', 'Contratos fechados no semestre'], ['equip', 'Equipamento que agreguei']].map(([f, l]) => <Card key={f}><Field label={l}><A f={f} /></Field></Card>)}</div>
      <Card><Field label="O que eu aprendi sobre o meu público"><A f="publico" /></Field></Card>
    </div></Entry>
  )
}
function Resp({ f }) {
  const [v, set] = useF(f)
  return <div className="seg sm">{['Sim', 'Em parte', 'Não'].map((o) => <button key={o} className={v === o ? 'on' : ''} onClick={() => set(v === o ? '' : o)}>{o}</button>)}</div>
}

export function Fim() {
  const ano = useAno()
  const hoje = useEntry('hoje'); const d = useEntry('fim')
  return (
    <Entry k="fim"><div className="page">
      <Head icon="trophy" title={`Fechando ${ano}`} sub="A nota de janeiro vem sozinha de “Onde estou hoje”" kicker="revisão" color="var(--orange)" back="/app/meses" />
      <Card title="Evolução por área" icon="chart" color="var(--orange)">
        {AREAS.map(([k, l]) => {
          const a = hoje[`${k}.nota`], b = d[`${k}.dez`]; const dif = a !== undefined && a !== '' && b !== undefined && b !== '' ? num(b) - num(a) : null
          return (
            <div className="evo" key={k}><b>{l}</b>
              <div className="evo-n"><span className="mut">jan</span><span className="nota">{a === undefined || a === '' ? '–' : a}</span><Ic n="right" s={14} /><span className="mut">dez</span><N f={`${k}.dez`} />
                {dif != null && <span className={'pct ' + (dif > 0 ? 'ok' : dif < 0 ? 'low' : 'mid')}>{dif > 0 ? '+' : ''}{dif}</span>}</div>
              <T f={`${k}.mudou`} ph="O que mudou" />
            </div>
          )
        })}
      </Card>
      <div className="g2">{[['iphone', 'Do celular que eu tinha ao equipamento que eu tenho'], ['licao', 'Minha maior lição do ano'], ['diria', 'O que eu diria para quem está começando'], ['l2028', `Levo para ${ano + 1}`]].map(([f, l]) => <Card key={f}><Field label={l} hl={f === 'licao'}><A f={f} /></Field></Card>)}</div>
    </div></Entry>
  )
}

export function Ano() {
  useStoreVersion(); const ano = useAno(); const MESES = mesesDoAno(ano)
  const t = anoStats()
  const maxEnt = Math.max(1, ...MESES.map((m) => mesStats(m.k).ent))
  return (
    <Entry k="wrapped"><div className="page">
      <Head icon="trophy" title={`Meu ${ano} em números`} sub="A sua retrospectiva do ano, automática" kicker={String(ano)} color="var(--orange)" back="/app" />
      <div className="wrap-h"><b>Seu ano em números</b><span>Tudo aqui se preenche sozinho a partir da Análise e do Negócio de cada mês.</span></div>
      <div className="stats">
        <Stat icon="play" label="Conteúdos publicados" value={int(t.pub)} color="#FF3D77" /><Stat icon="eye" label="Visualizações" value={int(t.alc)} color="#8B5CF6" />
        <Stat icon="users" label="Seguidores novos" value={int(t.seg)} color="#FF7A2F" /><Stat icon="trophy" label="Contratos" value={int(t.con)} color="#10B981" />
        <Stat icon="coin" label="Entradas no ano" value={brl(t.ent)} color="#3B82F6" /><Stat icon="cam" label="Para a caixinha" value={brl(t.cx)} color="#F59E0B" />
        <Stat icon="flyer" label="Panfletos entregues" value={int(t.panf)} color="#EC4899" /><Stat icon="comment" label="Conversas" value={int(t.conv)} color="#14B8A6" />
      </div>
      <Card title="Entradas mês a mês" icon="chart" color="var(--orange)">
        <div className="bars">{MESES.map((m) => { const s = mesStats(m.k); return (
          <Link to={`/app/mes/${m.k}/negocio`} key={m.k} className="bar"><div className="bar-c"><i style={{ height: (s.ent / maxEnt * 100) + '%', background: m.cor }} /></div><span>{m.k}</span></Link>) })}</div>
        <div className="scroll"><table className="wm"><thead><tr><th>Mês</th><th>Publicados</th><th>Visualiz.</th><th>Contratos</th><th>Entradas</th><th>Sobrou</th></tr></thead>
          <tbody>{MESES.map((m) => { const s = mesStats(m.k); return <tr key={m.k}><td><Link to={`/app/mes/${m.k}`}><i className="mdot" style={{ background: m.cor }} />{m.nome}</Link></td><td>{int(s.pub)}</td><td>{int(s.alc)}</td><td>{int(s.con)}</td><td>{brl(s.ent)}</td><td>{brl(s.sob)}</td></tr> })}</tbody></table></div>
      </Card>
      <Card><Field label={`Se o meu ${ano} fosse um post, a legenda seria…`} hl><A f="post" rows={3} /></Field></Card>
    </div></Entry>
  )
}

export function Ideias() {
  return (
    <Entry k="ideias"><div className="page">
      <Head icon="idea" title="Ideias soltas" sub="Ganchos, pautas e frases que aparecem fora de hora" kicker="salvos" color="#F59E0B" back="/app" />
      <Card><Rows f="lista" min={5} add="Nova ideia" cols={[{ k: 'ideia', l: 'Ideia / gancho', w: '1.6fr' }, { k: 'quem', l: 'Para quem / qual dor', w: '1.2fr' }, { k: 'fmt', l: 'Formato', t: 'select', opts: FORMATOS, w: '104px' }, { k: 'ok', l: 'Usei', t: 'check', w: '40px' }]} /></Card>
    </div></Entry>
  )
}
export function Notas() {
  return (
    <Entry k="notas"><div className="page">
      <Head icon="note" title="Notas" sub="Escreva livre" kicker="livre" color="#3B82F6" back="/app" />
      <Card><A f="txt" rows={18} ph="Comece a escrever…" /></Card>
    </div></Entry>
  )
}
