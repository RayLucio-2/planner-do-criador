import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ic, T, A, N, Entry } from '../../components/ui'
import { setField, useEntry, getEntry, getAno } from '../../lib/store'
import { MESES, mesesDoAno, diasDoMes } from '../../data/content'
import Lembretes from '../../components/Lembretes'

const PASSOS = ['Seu perfil', 'Seu público', 'Sobre o que você fala', 'Sua meta', 'Lembretes']
const SUGESTOES = ['Dicas do meu serviço', 'Bastidores', 'Resultados de clientes', 'Minha história', 'Erros comuns', 'Perguntas do público']

// ideias dos primeiros posts para cada pilar sugerido; pilar escrito pela pessoa usa os modelos com {p}
const IDEIAS = {
  'Dicas do meu serviço': [['3 dicas rápidas sobre o meu serviço', 'Carrossel'], ['A pergunta que todo cliente me faz antes de contratar', 'Reels']],
  'Bastidores': [['Bastidores: como é um dia de trabalho comigo', 'Stories'], ['O que acontece antes de um trabalho ficar pronto', 'Reels']],
  'Resultados de clientes': [['Antes e depois de um cliente (com autorização)', 'Reels'], ['O resultado que mais me orgulha este mês', 'Carrossel']],
  'Minha história': [['Por que eu comecei', 'Reels'], ['O erro que eu cometi no começo e o que aprendi', 'Reels']],
  'Erros comuns': [['O erro que mais vejo no meu público (e como evitar)', 'Reels'], ['3 erros que custam caro e ninguém percebe', 'Carrossel']],
  'Perguntas do público': [['Respondendo a pergunta que mais me fazem', 'Reels'], ['Caixinha de perguntas: me pergunte qualquer coisa', 'Stories']],
}
const MODELOS = [['{p}: o erro mais comum (e como evitar)', 'Reels'], ['3 dicas rápidas sobre {p}', 'Carrossel'], ['Mito x verdade sobre {p}', 'Carrossel'], ['Bastidores de {p}', 'Stories']]
function ideiasIniciais(pilares) {
  const fila = [['Apresente-se: quem eu sou, para quem eu crio e o que você ganha me seguindo', 'Reels']]
  const temas = pilares.length ? pilares : ['o meu trabalho']
  for (let r = 0; fila.length < 5 && r < 4; r++) for (const p of temas) {
    if (fila.length >= 5) break
    const ls = IDEIAS[p] || MODELOS.map(([t, f]) => [t.replace('{p}', p.toLowerCase()), f])
    if (ls[r]) fila.push(ls[r])
  }
  return fila.map(([t, f]) => [t.charAt(0).toUpperCase() + t.slice(1), f])
}

// cria os 5 primeiros posts no Editorial, a partir de hoje, só em dias vazios
export function criarPrimeirosPosts() {
  const hoje = new Date(); const ano = getAno()
  if (hoje.getFullYear() !== ano) return []
  const perfil = getEntry('perfil'); const pub = getEntry('publico')
  const pil = [1, 2, 3, 4].map((i) => perfil[`p${i}.nome`]).filter(Boolean)
  const ideias = ideiasIniciais(pil)
  const freq = Math.min(7, Math.max(1, Number(perfil.freq) || 3))
  const passo = Math.max(1, Math.round(7 / freq))
  const vis = mesesDoAno(ano)
  const feitos = []
  let m = hoje.getMonth() + 1, d = hoje.getDate()
  for (let i = 0; feitos.length < ideias.length && i < 60; i++) {
    const mes = MESES[m - 1]
    if (!vis.includes(mes)) break
    const ed = getEntry(`${mes.k}.ed`)
    if (!ed[`${d}.ideia`]) {
      const [ideia, fmt] = ideias[feitos.length]
      setField(`${mes.k}.ed`, `${d}.ideia`, ideia)
      setField(`${mes.k}.ed`, `${d}.fmt`, fmt)
      if (pub.maior) setField(`${mes.k}.ed`, `${d}.dor`, pub.maior)
      feitos.push({ dia: d, mes, ideia, fmt })
      d += passo
    } else d += 1
    if (d > diasDoMes(m, ano)) { d -= diasDoMes(m, ano); m += 1; if (m > 12) break }
  }
  return feitos
}

export default function BoasVindas() {
  const [p, setP] = useState(0); const nav = useNavigate()
  const [posts, setPosts] = useState(null)
  const capa = useEntry('capa'); const perfil = useEntry('perfil')
  const hoje = new Date(); const mesHoje = MESES[hoje.getMonth()]
  const fim = () => { setField('capa', 'onboarded', true); nav('/app', { replace: true }) }
  const gerar = () => { setPosts(criarPrimeirosPosts()); setField('capa', 'onboarded', true) }
  const prox = () => (p < PASSOS.length - 1 ? setP(p + 1) : gerar())
  const pilares = [1, 2, 3, 4].map((i) => perfil[`p${i}.nome`] || '')
  const addPilar = (t) => { if (pilares.includes(t)) return; const i = pilares.findIndex((x) => !x); if (i >= 0) setField('perfil', `p${i + 1}.nome`, t) }

  if (posts) return (
    <div className="ob">
      <div className="ob-c">
        <div className="ring big"><div><Ic n="check" s={30} /></div></div>
        <h1>Seu planner está pronto!</h1>
        {posts.length ? <>
          <p className="mut">Já deixamos os seus {posts.length} primeiros posts no calendário editorial. Troque o que quiser.</p>
          <div className="ob-posts">{posts.map((x) => <div key={x.mes.k + x.dia} className="ob-post"><b>{String(x.dia).padStart(2, '0')}/{String(x.mes.n).padStart(2, '0')}</b><span>{x.ideia}</span><em>{x.fmt}</em></div>)}</div>
        </> : <p className="mut">Agora é só abrir o calendário editorial do mês e planejar os seus primeiros posts.</p>}
      </div>
      <div className="ob-ft"><span /><button className="btn big" onClick={() => nav('/app', { replace: true })}>Abrir meu planner <Ic n="right" s={16} w={2.6} /></button></div>
    </div>
  )

  return (
    <div className="ob">
      <div className="ob-top">
        <div className="ob-bars">{PASSOS.map((_, i) => <i key={i} className={i <= p ? 'on' : ''} />)}</div>
        <button className="link sm" onClick={fim}>Pular</button>
      </div>
      <span className="ob-k">passo {p + 1} de {PASSOS.length} · {PASSOS[p]}</span>

      {p === 0 && (
        <Entry k="capa"><div className="ob-c">
          <div className="ring big"><div><span>{(capa.nome || 'eu').slice(0, 2)}</span></div></div>
          <h1>Boas-vindas ao seu planner!</h1>
          <p className="mut">Em 2 minutos, 4 perguntas deixam o planner pronto para você usar hoje.</p>
          <T f="nome" ph="Seu nome" className="big" />
          <T f="user" ph="@ do seu perfil" className="big" />
        </div></Entry>
      )}
      {p === 1 && (
        <Entry k="publico"><div className="ob-c">
          <div className="ring big"><div><Ic n="users" s={30} /></div></div>
          <h1>Para quem você cria?</h1>
          <p className="mut">Uma pessoa específica, não “todo mundo”. Quanto mais clara, mais fácil escrever para ela.</p>
          <A f="quem" rows={3} ph="Ex.: donas de pequenos negócios que querem vender mais pelo Instagram e não têm tempo de gravar" />
          <A f="maior" rows={2} ph="A maior dor dessa pessoa, numa frase. Ex.: posta e ninguém chama no direct" />
        </div></Entry>
      )}
      {p === 2 && (
        <Entry k="perfil"><div className="ob-c">
          <div className="ring big"><div><Ic n="grid" s={30} /></div></div>
          <h1>Sobre o que você fala?</h1>
          <p className="mut">Escolha de 2 a 4 assuntos fixos (os seus pilares). Toque numa sugestão ou escreva.</p>
          <div className="ob-chips">{SUGESTOES.map((t) => <button key={t} className={'chipb' + (pilares.includes(t) ? ' on' : '')} onClick={() => addPilar(t)}>{t}</button>)}</div>
          <div className="ob-pil">{[1, 2, 3, 4].map((i) => <T key={i} f={`p${i}.nome`} ph={`Pilar ${i}`} />)}</div>
          <div className="kv"><span>Quantos posts por semana dá para fazer?</span><div className="seg sm">{['2', '3', '4', '5'].map((o) => <button key={o} className={String(perfil.freq || '3') === o ? 'on' : ''} onClick={() => setField('perfil', 'freq', o)}>{o}</button>)}</div></div>
        </div></Entry>
      )}
      {p === 3 && (
        <div className="ob-c">
          <div className="ring big"><div><Ic n="target" s={30} /></div></div>
          <h1>Qual é a sua meta?</h1>
          <p className="mut">Um número para mirar. Dá para mudar quando quiser.</p>
          {getAno() === hoje.getFullYear() && <div className="kv"><span>Quero faturar em {mesHoje.nome.toLowerCase()}</span><N k={`${mesHoje.k}.neg`} f="meta" money /></div>}
          <div className="kv"><span>Meta de seguidores</span><N k="capa" f="meta" /></div>
        </div>
      )}
      {p === 4 && (
        <div className="ob-c">
          <div className="ring big"><div><Ic n="bell" s={30} /></div></div>
          <h1>Quer um lembrete por dia?</h1>
          <p className="mut">A gente avisa no celular o post planejado do dia e lembra da análise no fim do mês.</p>
          <Lembretes compacto />
        </div>
      )}

      <div className="ob-ft">
        {p > 0 ? <button className="btn ghost" onClick={() => setP(p - 1)}><Ic n="left" s={16} /> Voltar</button> : <span />}
        <button className="btn big" onClick={prox}>{p < PASSOS.length - 1 ? 'Continuar' : 'Montar meu planner'} <Ic n="right" s={16} w={2.6} /></button>
      </div>
    </div>
  )
}
