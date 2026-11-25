import { Link, useParams, useNavigate } from 'react-router-dom'
import { Ic, Head, Card, Checklist, Rows, Entry, Tip, A, T, N, C, Field, Calc, useF, sumRows, Exemplo } from '../../components/ui'
import { AREAS, METAS_AREAS, MESES, mesesDoAno, datasDoAno, diasDoMes } from '../../data/content'
import { NICHOS, NICHO, PAUTA_GERAL } from '../../data/nichos'
import { useEntry, num, brl, useStoreVersion, useAno, setField, getEntry } from '../../lib/store'
import { anoStats } from '../../lib/calc'
import { useBloqueio, Bloqueado } from '../../lib/bloqueio'
import { mesDeHoje, novoRoteiro, novoContrato } from '../../lib/ligacoes'
import { toast } from '../../components/ui'

export const fmtAno = (t, ano) => t.replace('{ano}', ano).replace('{ant}', ano - 1)
export const TOOLS = [
  ['retro', 'Olhando para {ant}', 'Antes de planejar, olhe com honestidade para onde você está vindo', 'eye', Retro],
  ['hoje', 'Onde estou hoje', 'Dê uma nota de 0 a 10 para cada área, sem pensar muito', 'target', Hoje],
  ['metas', 'Metas {ano} do criador', 'Poucas metas, bem claras', 'flag', Metas],
  ['publico', 'Meu público', 'Uma pessoa específica e o mapa de dores', 'users', Publico],
  ['linguagem', 'Banco de linguagem do público', 'Frases reais que você ouviu ou leu', 'comment', Linguagem],
  ['perfil', 'Meu perfil e pilares de conteúdo', 'O que o seu perfil promete e sobre o que você fala', 'grid', Perfil],
  ['escada', 'Escada de equipamento', 'Cada degrau pago por um contrato: luz, microfone, câmera', 'stair', Escada],
  ['google', 'Checklist do Google Meu Negócio', 'Montar uma vez, cuidar todo mês', 'globe', Google],
  ['panfleto', 'Rascunho do meu panfleto', 'Escreva para uma dor real. Não copie, compreenda.', 'flyer', Panfleto],
  ['ganchos', 'Ganchos e roteiros prontos', 'Modelos por nicho para não travar na página em branco', 'pen', Ganchos],
  ['porta', 'Porta em porta', 'Registro de visitas e conversas', 'door', Porta],
  ['calendario', 'Calendário {ano}', 'Feriados, datas para conteúdo e datas do seu nicho', 'cal', Calendario],
  ['preco', 'Calculadora de preço', 'Quanto cobrar por hora e por pacote sem trabalhar no prejuízo', 'coin', Preco],
  ['datas', 'Datas para não esquecer', 'Gravações, entregas, pagamentos, eventos do seu público', 'bookmark', Datas],
]

export function FerramentasIndex() {
  const ano = useAno(); const { emTeste } = useBloqueio()
  return (
    <div className="page">
      <Head icon="target" title="Ferramentas" sub="Para estudar, mapear e se organizar" kicker="parte 2" color="var(--violet)" />
      <div className="tiles">{TOOLS.map(([id, t, s, ic]) => (
        <Link key={id} to={`/app/ferramentas/${id}`} className={'tile' + (id === 'preco' && emTeste ? ' trancado' : '')}><span className="tile-i"><Ic n={id === 'preco' && emTeste ? 'lock' : ic} s={18} /></span><b>{fmtAno(t, ano)}</b><span>{s}</span></Link>
      ))}
        <Link to="/app/clientes" className="tile"><span className="tile-i"><Ic n="users" s={18} /></span><b>Clientes</b><span>Do primeiro contato ao contrato, com data de retorno</span></Link>
        <Link to="/app/referencias" className="tile"><span className="tile-i"><Ic n="play" s={18} /></span><b>Referências do nicho</b><span>Vídeos bons para estudar gancho, edição e estilo</span></Link>
        <Link to="/app/tarefas" className="tile"><span className="tile-i"><Ic n="check" s={18} /></span><b>Tarefas</b><span>O que fazer hoje e o passo a passo</span></Link>
      </div>
    </div>
  )
}

export function Ferramenta() {
  const { id } = useParams(); const ano = useAno(); const { emTeste } = useBloqueio()
  const t = TOOLS.find((x) => x[0] === id)
  if (!t) return <div className="page">Ferramenta não encontrada.</div>
  const [, title, sub, icon, Comp] = t
  const bloq = id === 'preco' && emTeste
  return (
    <Entry k={id}>
      <div className="page">
        <Head icon={icon} title={fmtAno(title, ano)} sub={sub} kicker="ferramenta" color="var(--violet)" back="/app/ferramentas" />
        {bloq ? <Bloqueado texto="A calculadora de preço libera quando a 1ª mensalidade for paga." /> : <Comp />}
        {id !== 'calendario' && <Card title="Anotações" icon="note"><A f="notas" rows={3} /></Card>}
      </div>
    </Entry>
  )
}

function Retro() {
  const b = [['certo', 'O que deu certo'], ['nao', 'O que não deu'], ['aprendi', 'O que eu aprendi sobre conteúdo'], ['naolevar', 'O que não quero levar para o próximo ano'], ['portas', 'Trabalhos e pessoas que me abriram portas'], ['orgulho', 'Momentos de orgulho']]
  return <div className="g2">{b.map(([f, l]) => <Card key={f}><Field label={l}><A f={f} rows={4} /></Field></Card>)}</div>
}

function Hoje() {
  const d = useEntry('hoje')
  const notas = AREAS.map(([k]) => d[`${k}.nota`]).filter((v) => v !== undefined && v !== '')
  const media = notas.length ? notas.reduce((s, v) => s + num(v), 0) / notas.length : null
  return (
    <>
      <div className="areas">{AREAS.map(([k, l]) => <AreaRow key={k} k={k} l={l} />)}</div>
      <div className="avg"><span>Minha média hoje</span><b>{media == null ? '—' : media.toFixed(1).replace('.', ',')}</b><em>compare em dezembro em “Fechando o ano”</em></div>
      <div className="g2"><Card><Field label="Equipamento que eu já tenho"><A f="equip" /></Field></Card><Card><Field label="Em dezembro, quero estar…"><A f="dez" /></Field></Card></div>
    </>
  )
}
function AreaRow({ k, l }) {
  const [v, set] = useF(`${k}.nota`)
  return (
    <div className="area card">
      <div className="area-h"><b>{l}</b><span className="nota">{v === '' ? '–' : v}</span></div>
      <div className="scale">{Array.from({ length: 11 }).map((_, i) => <button key={i} className={String(v) === String(i) ? 'on' : ''} onClick={() => set(String(v) === String(i) ? '' : String(i))}>{i}</button>)}</div>
      <div className="g2 tight"><T f={`${k}.bom`} ph="O que está bom" /><T f={`${k}.falta`} ph="O que está faltando" /></div>
    </div>
  )
}

function Metas() {
  return (
    <>
      {METAS_AREAS.map((a, i) => (
        <Card key={a} className="meta">
          <div className="meta-h"><b>{a}</b><C f={`${i}.ok`} label="feito" /></div>
          <A f={`${i}.meta`} rows={2} ph="Meta" />
          <div className="g2 tight"><T f={`${i}.passo`} ph="Primeiro passo" /><T f={`${i}.ate`} ph="Até quando" /></div>
        </Card>
      ))}
      <Card><Field label="Se eu só pudesse cumprir uma meta, seria…" hl><A f="uma" rows={2} /></Field></Card>
    </>
  )
}

function Publico() {
  const d = useEntry('publico')
  const vazio = !['nome', 'quem', 'dores', 'desejos', 'maior'].some((f) => d[f])
  const ex = { nome: 'Carla', prof: '34 anos · dona de uma loja de roupas', segue: 'Perfis de moda, empreendedoras locais', quem: 'Tem uma loja física pequena, vende bem no boca a boca, mas o Instagram está parado. Faz tudo sozinha.', onde: 'Instagram e grupos de WhatsApp do bairro; na rua, na própria loja e em feiras.', dores: 'Não tem tempo de gravar; sente vergonha de aparecer; posta e ninguém interage; já pagou alguém e não viu resultado.', desejos: 'Vender mais sem depender só de quem passa na porta; ter um perfil bonito que passe confiança.', obj: 'Acha caro; tem medo de ser mais um gasto sem retorno; acha que o público dela não está no Instagram.', pal: '“Eu não tenho tempo nem de respirar.” “Eu travo na frente da câmera.”', maior: 'Ela sabe vender pessoalmente, mas não consegue mostrar isso no Instagram.' }
  return (
    <>
      {vazio && <Exemplo onFill={() => Object.entries(ex).forEach(([f, v]) => { if (!d[f]) setField('publico', f, v) })}>Preencher com um exemplo para editar</Exemplo>}
      <Card className="persona"><div className="ring big"><div><Ic n="users" s={28} /></div></div>
        <div className="pf"><T f="nome" ph="Nome fictício" /><T f="prof" ph="Idade · profissão" /><T f="segue" ph="Segue quem?" /></div></Card>
      <div className="g2"><Card><Field label="Quem é"><A f="quem" /></Field></Card><Card><Field label="Onde encontro essa pessoa (on-line e na rua)"><A f="onde" /></Field></Card></div>
      <h2 className="sect">Mapa de dores</h2>
      <div className="g2">
        <Card className="mp" ><Field label="Dores · o que incomoda, o que ela já tentou"><A f="dores" rows={4} /></Field></Card>
        <Card className="mp g"><Field label="Desejos · o que ela quer conquistar"><A f="desejos" rows={4} /></Field></Card>
        <Card className="mp y"><Field label="Objeções · por que ela não contrata"><A f="obj" rows={4} /></Field></Card>
        <Card className="mp b"><Field label="Palavras exatas · como ela fala sobre isso"><A f="pal" rows={4} /></Field></Card>
      </div>
      <Card><Field label="A maior dor do meu público, numa frase" hl><A f="maior" rows={2} /></Field></Card>
    </>
  )
}

function Linguagem() {
  return (
    <>
      <Tip k="Dica">cada frase pode virar gancho, título ou panfleto. Marque “usei” quando virar conteúdo.</Tip>
      <Card><Rows f="frases" min={5} add="Adicionar frase" cols={[{ k: 'frase', l: 'Frase que ouvi ou li', w: '2fr' }, { k: 'onde', l: 'Onde', t: 'select', opts: ['', 'Comentário', 'Direct', 'WhatsApp', 'Google', 'Porta em porta', 'Grupo/fórum', 'Conversa'] }, { k: 'ideia', l: 'Ideia de conteúdo', w: '1.6fr' }, { k: 'usei', l: 'Usei', t: 'check', w: '44px' }]} /></Card>
      <ViraGancho />
    </>
  )
}

// cada frase do público vira um roteiro com o gancho pronto
function ViraGancho() {
  const d = useEntry('linguagem'); const nav = useNavigate()
  const fr = (Array.isArray(d.frases) ? d.frases : []).map((r, i) => ({ ...r, i })).filter((r) => r.frase && !r.usei)
  if (!fr.length) return null
  const usar = (r) => {
    const m = mesDeHoje()
    const n = novoRoteiro(m.k, { titulo: r.ideia || r.frase, gancho: r.frase, dor: r.frase })
    const l = [...d.frases]; l[r.i] = { ...l[r.i], usei: true }; setField('linguagem', 'frases', l)
    toast(`Roteiro #${n} criado em ${m.nome}`); nav(`/app/mes/${m.k}/roteiros`)
  }
  return (
    <Card title="Transformar em conteúdo" icon="pen" color="var(--pink)">
      <p className="mut sm">Toque em “usar como gancho” e a frase vira um roteiro novo no mês, já com o gancho escrito.</p>
      <div className="vg">{fr.map((r) => <div key={r.i} className="vg-r"><span>“{r.frase}”</span><button className="btn sm" onClick={() => usar(r)}>Usar como gancho <Ic n="right" s={13} /></button></div>)}</div>
    </Card>
  )
}

function Perfil() {
  const cs = ['#FF3D77', '#8B5CF6', '#FF7A2F', '#10B981']
  const fmts = ['Reels', 'Carrossel', 'Stories', 'Foto', 'Ao vivo', 'TikTok', 'YouTube Shorts', 'YouTube longo']
  const [bio] = useF('bio')
  return (
    <>
      <Card title="Como o cliente vê o meu perfil em 5 segundos" icon="eye" color="var(--violet)">
        <div className="pf"><T f="nome" ph="Nome no perfil" />
          <A f="bio" rows={2} ph="Bio (até 150 caracteres)" /><span className={'count' + (String(bio).length > 150 ? ' over' : '')}>{String(bio).length}/150</span>
          <T f="link" ph="Link na bio" /><T f="dest" ph="Destaques fixos" /><T f="fix" ph="Post fixado" /></div>
      </Card>
      <h2 className="sect"><Ic n="grid" s={16} /> Meus pilares de conteúdo</h2>
      <div className="g2">{[1, 2, 3, 4].map((i) => (
        <Card key={i} className="pil" ><div className="pil-h" style={{ color: cs[i - 1] }}><b>pilar {i}</b><N f={`p${i}.pct`} /><span className="mut sm">% dos posts</span></div>
          <T f={`p${i}.nome`} ph="Nome do pilar" /><A f={`p${i}.ex`} rows={2} ph="Exemplos de pauta" /></Card>
      ))}</div>
      <div className="g2">
        <Card title="Formatos que vou usar" icon="play" color="var(--pink)"><Checklist f="fmt" itens={fmts} /></Card>
        <Card title="Frequência realista" icon="cal" color="var(--violet)">
          <div className="kv"><span>Posts por semana</span><N f="freq" /></div>
          <div className="kv"><span>Stories por dia</span><N f="stories" /></div>
          <T f="dias" ph="Dias de gravação" />
        </Card>
      </div>
    </>
  )
}

function Escada() {
  useStoreVersion()
  const d = useEntry('escada')
  const rows = Array.isArray(d.itens) ? d.itens : []  // custo só existe depois de digitar
  const total = sumRows(rows, 'custo'); const comprado = sumRows(rows, 'custo', (r) => r.ok)
  const t = anoStats()
  return (
    <>
      <div className="ladder">{[['Luz', 'bulb', '#F59E0B'], ['Microfone', 'mic', '#FF3D77'], ['Câmera', 'cam', '#8B5CF6']].map(([l, ic, c], i) => <div key={l} className="ld" style={{ '--c': c }}><b>{i + 1}</b><Ic n={ic} s={16} />{l}</div>)}</div>
      <Card><Rows f="itens" min={3} add="Adicionar item" seed={[{ item: 'Luz' }, { item: 'Microfone' }, { item: 'Câmera / celular' }]} cols={[{ k: 'item', l: 'Item' }, { k: 'praque', l: 'Para quê' }, { k: 'custo', l: 'Custo', t: 'money', w: '110px' }, { k: 'contrato', l: 'Contrato que vai pagar' }, { k: 'ok', l: 'Comprado', t: 'check', w: '64px' }]} />
        <div className="totals"><span>Total da escada <Calc value={brl(total)} money /></span><span>Já comprado <Calc value={brl(comprado)} money /></span></div></Card>
      <Card title="Caixinha do equipamento" icon="coin" color="#10B981">
        <div className="kv"><span>Quanto de cada contrato vai para a caixinha?</span><N f="pct" /><b>%</b></div>
        <div className="kv"><span>Meta da caixinha no ano</span><N f="meta" money /></div>
        <div className="kv"><span>Guardado até agora <em className="auto">auto</em></span><Calc value={brl(t.cx)} money /></div>
        {num(d.meta) > 0 && <div className="prog big"><i style={{ width: Math.min(100, t.cx / num(d.meta) * 100) + '%' }} /></div>}
        <p className="mut sm">Soma as entradas de todos os meses (Negócio do mês) × a sua %.</p>
      </Card>
      <Card><Field label="O que já tenho e posso aproveitar melhor"><A f="aproveitar" /></Field></Card>
    </>
  )
}

function Google() {
  const MESES = mesesDoAno(useAno())
  const mont = ['Perfil criado', 'Nome real do negócio', 'Categoria principal', 'Categorias secundárias', 'Área de atendimento', 'Horários', 'Telefone e WhatsApp', 'Link do Instagram ou portfólio', 'Descrição com a linguagem do público', 'Serviços cadastrados', 'Logo e foto de capa', '10 fotos reais de trabalho', 'Perfil verificado']
  const rot = ['Postar uma atualização por semana', 'Subir fotos novas de trabalhos', 'Pedir avaliação a cada entrega', 'Responder todas as avaliações', 'Conferir horários em feriados', 'Anotar os números do mês abaixo']
  const mets = [['vis', 'Visualizações'], ['lig', 'Ligações'], ['cli', 'Cliques WhatsApp/site'], ['aval', 'Novas avaliações']]
  const d = useEntry('google')
  return (
    <>
      <div className="g2"><Card title="Montagem" icon="globe" color="#3B82F6"><Checklist f="m" itens={mont} /></Card>
        <div><Card title="Rotina mensal" icon="loop" color="#10B981"><Checklist f="r" itens={rot} /></Card><Card><Field label="Minha descrição (rascunho)"><A f="desc" rows={5} /></Field></Card></div></div>
      <Card title="Números do perfil, mês a mês" icon="chart">
        <div className="scroll"><table className="mm"><thead><tr><th></th>{MESES.map((m) => <th key={m.k}>{m.k}</th>)}<th>total</th></tr></thead>
          <tbody>{mets.map(([k, l]) => <tr key={k}><td className="rl">{l}</td>{MESES.map((m) => <td key={m.k}><N f={`${k}.${m.k}`} /></td>)}<td><Calc value={MESES.reduce((s, m) => s + num(d[`${k}.${m.k}`]), 0)} /></td></tr>)}</tbody></table></div>
      </Card>
    </>
  )
}

function Panfleto() {
  return (
    <>
      <Card className="flyer">
        <Field label="Para quem é este panfleto?"><T f="para" /></Field>
        <Field label="1 · Título com a dor" hl><A f="t" rows={2} /></Field>
        <Field label="2 · O que eu resolvo, em uma frase"><A f="res" rows={2} /></Field>
        <div className="g3">{[1, 2, 3].map((i) => <Field key={i} label={`3 · Benefício ${i}`}><A f={`b${i}`} rows={2} /></Field>)}</div>
        <div className="g2"><Field label="4 · Prova (portfólio, antes e depois, depoimento)"><A f="prova" rows={2} /></Field><Field label="5 · Porta de entrada (oferta simples)"><A f="porta" rows={2} /></Field></div>
        <Field label="6 · Nome · foto · WhatsApp · QR code"><T f="contato" /></Field>
      </Card>
      <div className="g2"><Card title="Antes de imprimir" icon="flyer" color="var(--orange)"><Checklist f="ck" itens={['Dá para entender em 5 segundos?', 'O título usa palavras do público?', 'Tem um jeito fácil de me chamar?', 'O QR code funciona?', 'Mostrei para 3 pessoas do público?']} /></Card>
        <Card><Field label="O que as 3 pessoas disseram"><A f="disseram" rows={5} /></Field></Card></div>
    </>
  )
}

function Porta() {
  const d = useEntry('porta'); const rows = Array.isArray(d.visitas) ? d.visitas : []
  const c = (r) => rows.filter((x) => x.res === r).length
  return (
    <>
      <div className="stats"><div className="stat"><span>Visitas</span><b>{rows.filter((r) => r.local || r.pessoa).length}</b></div><div className="stat" style={{ '--c': '#10B981' }}><span>Fecharam</span><b>{c('Fechou')}</b></div><div className="stat" style={{ '--c': '#F59E0B' }}><span>Voltar</span><b>{c('Voltar')}</b></div><div className="stat" style={{ '--c': '#E11D48' }}><span>Não agora</span><b>{c('Não agora')}</b></div></div>
      <Card><Rows f="visitas" min={6} add="Registrar visita" cols={[{ k: 'data', l: 'Data', w: '84px' }, { k: 'local', l: 'Local' }, { k: 'pessoa', l: 'Pessoa / contato' }, { k: 'dor', l: 'Dor que percebi', w: '1.5fr' }, { k: 'ret', l: 'Retorno em', w: '90px' }, { k: 'res', l: 'Resultado', t: 'select', opts: ['', 'Fechou', 'Voltar', 'Não agora'], w: '110px' }]} /></Card>
      {rows.map((r, i) => r.res === 'Fechou' && !r.contr ? <div key={i} className="liga"><span><b>{r.local || r.pessoa || 'Visita'}</b> fechou</span><button className="btn sm" onClick={() => { const n = [...rows]; n[i] = { ...n[i], contr: true }; setField('porta', 'visitas', n); const m = novoContrato({ cli: r.local || r.pessoa || '' }); toast(`Contrato criado em ${m.nome} › Negócio`) }}>Criar contrato no Negócio</button></div> : null)}
      {rows.filter((r) => r.res === 'Voltar' && r.ret).length > 0 && <Card title="Retornos marcados" icon="bell" color="#F59E0B">{rows.filter((r) => r.res === 'Voltar' && r.ret).map((r, i) => <div key={i} className="kv"><span>{r.local || r.pessoa}</span><b>{r.ret}</b></div>)}</Card>}
      <Tip k="Lembrete">anote o motivo do “não agora”: ele vira conteúdo.</Tip>
      <Tip k="Novo">acompanhe cada conversa até o contrato em <Link to="/app/clientes" className="auto">Clientes</Link>, com data de retorno e lembrete.</Tip>
    </>
  )
}

function Calendario() {
  const MESES = mesesDoAno(useAno())
  const ano = useAno(); const DATAS = datasDoAno(ano)
  const fer = Object.entries(DATAS).filter(([, v]) => v[1] !== 'data'), cont = Object.entries(DATAS).filter(([, v]) => v[1] === 'data')
  const fmt = (k) => k.split('-').map((x) => x.padStart(2, '0')).reverse().join('.')
  return (
    <>
      <div className="cal12">{MESES.map((m) => <MiniCal key={m.k} m={m} />)}</div>
      <div className="g2">
        <Card title="Feriados nacionais" color="#E11D48"><ul className="dl">{fer.map(([k, v]) => <li key={k}><b>{fmt(k)}</b>{v[0]}</li>)}</ul><p className="mut sm">* ponto facultativo</p></Card>
        <Card title="Datas para conteúdo" color="var(--violet)"><ul className="dl">{cont.map(([k, v]) => <li key={k}><b>{fmt(k)}</b>{v[0]}</li>)}</ul></Card>
      </div>
      <DatasNicho />
      <Card><Field label="Outras datas do meu nicho (eventos, feiras, datas do meu público)"><A f="nicho" rows={3} /></Field></Card>
    </>
  )
}
export function MiniCal({ m }) {
  const ano = useAno(); const YEAR = ano; const DATAS = datasDoAno(ano)
  const first = new Date(YEAR, m.n - 1, 1).getDay()
  const cells = [...Array(first).fill(null), ...Array.from({ length: diasDoMes(m.n, ano) }, (_, i) => i + 1)]
  return (
    <Link to={`/app/mes/${m.k}`} className="mcal" style={{ '--c': m.cor }}>
      <b>{m.nome}</b>
      <div className="mini">{['d', 's', 't', 'q', 'q', 's', 's'].map((x, i) => <u key={i}>{x}</u>)}{cells.map((d, i) => <i key={i} className={d && DATAS[`${m.n}-${d}`] ? DATAS[`${m.n}-${d}`][1] : ''}>{d || ''}</i>)}</div>
    </Link>
  )
}

function Datas() {
  const MESES = mesesDoAno(useAno())
  return <div className="g2">{MESES.map((m) => <Card key={m.k} className="dm"><Field label={<span style={{ color: m.cor }}>{m.nome}</span>}><A f={m.k} rows={3} /></Field></Card>)}</div>
}

// Calculadora de preço: (custos do mês + quanto quero tirar) ÷ horas de trabalho, com margem e imposto
function Preco() {
  const d = useEntry('preco')
  const custos = num(d.custos), salario = num(d.salario), horas = num(d.horas), margem = num(d.margem), imposto = num(d.imposto)
  const base = horas ? (custos + salario) / horas : 0
  const hora = imposto < 100 ? base * (1 + margem / 100) / (1 - imposto / 100) : 0
  const pacotes = (Array.isArray(d.pacotes) ? d.pacotes : []).filter((p) => p.nome || num(p.h))
  return (
    <>
      <Card title="Seus números do mês" icon="coin" color="#10B981">
        <div className="kv"><span>Custos do trabalho por mês <em className="auto">internet, apps, transporte, parcelas</em></span><N f="custos" money /></div>
        <div className="kv"><span>Quanto eu quero tirar para mim</span><N f="salario" money /></div>
        <div className="kv"><span>Horas que consigo trabalhar no mês</span><N f="horas" ph="80" /></div>
        <div className="kv"><span>Margem para crescer e imprevistos</span><N f="margem" ph="20" /><b>%</b></div>
        <div className="kv"><span>Imposto sobre o que eu recebo <em className="auto">se tiver</em></span><N f="imposto" ph="0" /><b>%</b></div>
      </Card>
      <Card title="Seu preço mínimo" icon="target" color="#8B5CF6">
        <div className="kv big"><span>Por hora</span><Calc value={brl(hora)} money /></div>
        <p className="mut sm">{horas ? 'Abaixo desse valor você trabalha no prejuízo. Quem é iniciante pode cobrar perto dele; com portfólio e resultados, suba.' : 'Preencha as horas do mês para calcular.'}</p>
      </Card>
      <Card title="Meus pacotes" icon="list" color="#FF7A2F">
        <Rows f="pacotes" min={3} add="Adicionar pacote" seed={[{ nome: 'Pacote com 4 vídeos' }, { nome: 'Gravação de 1 dia' }, { nome: 'Gestão de perfil no mês' }]} cols={[{ k: 'nome', l: 'Pacote', w: '1.6fr' }, { k: 'h', l: 'Horas de trabalho', t: 'num', w: '120px' }, { k: 'cobro', l: 'Quanto cobro hoje', t: 'money', w: '130px' }]} />
        {pacotes.length > 0 && hora > 0 && <div className="pac-l">{pacotes.map((p, i) => { const min = num(p.h) * hora; const cobro = num(p.cobro); return (
          <div key={i} className="kv"><span>{p.nome || `Pacote ${i + 1}`}</span><span>mínimo <b>{brl(min)}</b>{cobro > 0 && <em className={'auto ' + (cobro < min ? 'baixo' : 'ok')}>{cobro < min ? ` · você cobra ${brl(min - cobro)} a menos` : ' · preço ok'}</em>}</span></div>
        ) })}</div>}
      </Card>
    </>
  )
}

// escolha do nicho (vale para os ganchos e o calendário)
function NichoSel() {
  const capa = useEntry('capa')
  return <div className="ob-chips nsel">{NICHOS.map((n) => <button key={n.id} className={'chipb' + (capa.nicho === n.id ? ' on' : '')} onClick={() => setField('capa', 'nicho', n.id)}>{n.nome}</button>)}</div>
}

function Ganchos() {
  const capa = useEntry('capa'); const nav = useNavigate()
  const n = NICHO[capa.nicho]
  const usar = ([g, fmt, ideia]) => { const m = mesDeHoje(); const i = novoRoteiro(m.k, { titulo: ideia, gancho: g, fmt }); toast(`Roteiro #${i} criado em ${m.nome}`); nav(`/app/mes/${m.k}/roteiros`) }
  return (
    <>
      <Card title="Qual é o seu nicho?" icon="users" color="var(--violet)"><NichoSel /></Card>
      {n ? <Card title={`Ganchos para ${n.nome.toLowerCase()}`} icon="pen" color="var(--pink)">
        <p className="mut sm">Toque em “usar” e o gancho vira um roteiro novo no mês, com a ideia do vídeo. Troque as palavras pelas do seu público.</p>
        <div className="vg">{n.ganchos.map((x) => <div key={x[0]} className="vg-r gch"><div><b>“{x[0]}”</b><span>{x[2]} · {x[1]}</span></div><button className="btn sm" onClick={() => usar(x)}>Usar <Ic n="right" s={13} /></button></div>)}</div>
      </Card> : <p className="mut">Escolha o seu nicho acima para ver os ganchos.</p>}
    </>
  )
}

// datas comerciais e do nicho, com sugestão de pauta e botão para planejar no editorial
function DatasNicho() {
  const capa = useEntry('capa'); const ano = useAno(); const DATAS = datasDoAno(ano); const vis = mesesDoAno(ano)
  const n = NICHO[capa.nicho]; const h = new Date()
  const lista = []
  Object.entries(DATAS).forEach(([k, [nome, t]]) => { if (t !== 'data') return; const [mm, dd] = k.split('-').map(Number); nome.split(' · ').forEach((x) => lista.push([mm, dd, x])) })
  if (n) n.datas.forEach(([mm, dd, nome]) => { if (!lista.some((x) => x[2] === nome)) lista.push([mm, dd, nome]) })
  const futuras = lista.filter(([mm, dd]) => vis.some((m) => m.n === mm) && (ano > h.getFullYear() || mm > h.getMonth() + 1 || (mm === h.getMonth() + 1 && dd >= h.getDate()))).sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const planejar = ([mm, dd, nome], pauta) => {
    const m = MESES[mm - 1]; const k = `${m.k}.ed`; const ed = getEntry(k)
    if (ed[`${dd}.ideia`]) { toast(`O dia ${String(dd).padStart(2, '0')}/${String(mm).padStart(2, '0')} já tem post planejado`); return }
    setField(k, `${dd}.ideia`, `${nome}: ${pauta}`); toast(`Planejado para ${String(dd).padStart(2, '0')}/${String(mm).padStart(2, '0')} no editorial`)
  }
  return (
    <Card title="Datas do seu nicho com pauta" icon="cal" color="var(--pink)">
      <NichoSel />
      {futuras.length ? <div className="vg">{futuras.map((x) => { const pauta = (n && n.pautas[x[2]]) || PAUTA_GERAL[x[2]] || 'Conteúdo ligado à data e ao seu público.'; return (
        <div key={x.join('-')} className="vg-r gch"><div><b>{String(x[1]).padStart(2, '0')}/{String(x[0]).padStart(2, '0')} · {x[2]}</b><span>{pauta}</span></div><button className="btn sm" onClick={() => planejar(x, pauta)}>Planejar</button></div>
      ) })}</div> : <p className="mut sm">Sem datas comerciais pela frente neste ano.</p>}
    </Card>
  )
}
