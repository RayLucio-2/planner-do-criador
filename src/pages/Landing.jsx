import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Ic } from '../components/ui'
import { IG_URL } from '../data/content'
import { PRECO, PRECO_DE, PROMO, PRECO_PDF, DIAS_TESTE, supabase, DEMO } from '../lib/supabase'
import Preco from '../components/Preco'
import { track } from '../lib/analytics'
import pInicio from '../assets/prints/inicio.webp'
import pEditorial from '../assets/prints/editorial.webp'
import pAnalise from '../assets/prints/analise.webp'
import pNegocio from '../assets/prints/negocio.webp'
import pAno from '../assets/prints/ano.webp'
import pRoteiro from '../assets/prints/roteiro.webp'
const ARTIFACT = import.meta.env.VITE_ROUTER === 'memory'
// Enquanto não lançar, a página funciona como lista de espera. No lançamento: VITE_LANCADO=true
export const LANCADO = import.meta.env.VITE_LANCADO === 'true'
const irPara = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

const RECURSOS = [
  ['cal', 'Calendário editorial', 'Os 365 dias do ano com ideia, formato, a dor que o conteúdo responde e check de gravado e postado.', '#FF3D77'],
  ['pen', 'Roteiros ilimitados', 'Gancho, problema, virada, prova e chamada. Escreva quantos roteiros quiser, por mês.', '#8B5CF6'],
  ['chart', 'Análise do mês', 'Meta x real com % calculada sozinha: alcance, retenção, salvamentos, mensagens e contratos.', '#FF7A2F'],
  ['coin', 'Negócio do mês', 'Contratos, gastos, caixinha do equipamento e quanto sobrou, tudo somado automaticamente.', '#10B981'],
  ['bulb', '6 lições de quem começou do zero', 'Do celular ao primeiro contrato: roteiro, Google Meu Negócio, panfleto e porta em porta.', '#3B82F6'],
  ['trophy', 'Seu ano em números', 'Uma retrospectiva automática do ano: posts, visualizações, contratos e faturamento.', '#F59E0B'],
]
const PRINTS = [
  [pInicio, 'Início', 'Seu perfil, o foco do mês e o post de hoje.'],
  [pEditorial, 'Calendário editorial', 'Ideia, formato e a dor de cada post, dia a dia.'],
  [pRoteiro, 'Roteiros', 'Gancho, problema, virada, prova e chamada.'],
  [pAnalise, 'Análise do mês', 'Meta x real, com a % calculada sozinha.'],
  [pNegocio, 'Negócio do mês', 'Contratos, gastos, caixinha e quanto sobrou.'],
  [pAno, 'Seu ano em números', 'A retrospectiva que se monta sozinha.'],
]
const FAQ_ESPERA = [
  ['Quando o app vai ser lançado?', 'Em breve. Quem está na lista de espera recebe o aviso por e-mail antes de todo mundo.'],
  ['Quanto vai custar?', 'O valor vai ser anunciado primeiro para quem está na lista de espera.'],
  ['Preciso instalar alguma coisa?', 'Não. O planner vai abrir no navegador e você poderá adicionar à tela inicial do celular (Android ou iPhone) para usar como app, inclusive sem internet.'],
  ['Serve para quem está começando?', 'Foi feito para isso. O guia mostra como começar só com o celular e o planner ajuda a registrar e melhorar mês a mês.'],
  ['Tem a versão em PDF?', `Tem! O Planner do Criador 2027 completo em PDF interativo custa ${PRECO_PDF}, pagamento único no PIX ou no cartão, e chega no seu e-mail.`],
  ['E quando 2027 acabar?', 'O planner continua: você troca o ano no topo do app e começa um ano novo, com feriados e datas atualizados, sem perder o histórico.'],
]
const FAQ = [
  ['Preciso instalar alguma coisa?', 'Não. O planner abre no navegador e você pode adicionar à tela inicial do celular (Android ou iPhone) para usar como app, inclusive sem internet.'],
  ['Meus dados ficam salvos?', 'Sim. Tudo é salvo na sua conta e sincroniza entre celular, tablet e computador.'],
  ['Preciso cadastrar cartão para testar?', 'Sim. Você cadastra o cartão no ambiente seguro do Asaas e usa 7 dias grátis. A 1ª cobrança só acontece no 8º dia. Se cancelar antes, não paga nada.'],
  ['Posso cancelar quando quiser?', 'Pode. A assinatura é mensal, sem fidelidade. Você cancela em Perfil › Assinatura e continua usando até o fim do período já pago.'],
  ['Serve para quem está começando?', 'Foi feito para isso. O guia mostra como começar só com o celular e o planner ajuda a registrar e melhorar mês a mês.'],
  ['Tem a versão em PDF?', `Tem! O PDF interativo completo custa ${PRECO_PDF}, pagamento único no PIX ou no cartão, e chega no seu e-mail. O app tem tudo isso e mais: somas automáticas, roteiros ilimitados, lembretes e sincronização.`],
  ['Qual a diferença entre o PDF e o app?', 'O PDF você preenche no Acrobat ou imprime. O app salva na sua conta, sincroniza celular e computador, faz as contas sozinho e continua nos próximos anos.'],
  ['Posso começar antes de 2027?', 'Pode. Novembro e dezembro de 2026 já estão no app como bônus, para você testar a rotina e chegar em janeiro com tudo planejado.'],
  ['E quando 2027 acabar?', 'O planner continua: você troca o ano no topo do app e começa um ano novo, com feriados e datas atualizados, sem perder o histórico.'],
]

export default function Landing() {
  return LANCADO ? <LandingVendas /> : <LandingEspera />
}

function LandingEspera() {
  return (
    <div className="lp">
      <nav className="lp-nav">
        <span className="brand">planner<i>.</i>do<i>.</i>criador</span>
        <div><button className="btn sm" onClick={() => irPara('lista')}>Entrar na lista</button></div>
      </nav>

      <section className="lp-hero">
        <div className="lp-hero-t">
          <span className="pill">em breve</span>
          <h1>Planner<br /><em>do criador</em> <span className="yr">2027</span></h1>
          <p>O app para quem quer produzir conteúdo e fechar contratos começando com o que já tem: calendário editorial, roteiros, análise do mês e negócio, com cara de rede social.</p>
          <div className="lp-cta"><button className="btn big" onClick={() => irPara('lista')}>Me avise no lançamento <Ic n="right" s={16} w={2.6} /></button><span className="mut">quem está na lista sabe primeiro</span></div>
        </div>
        <Celular />
      </section>

      <Prints legenda="Telas reais do app, preenchidas com um exemplo." />

      <section className="lp-sec">
        <h2>Como vai funcionar</h2>
        <div className="how">{[['Crie sua conta', 'No lançamento, leva 1 minuto. Quem está na lista recebe o aviso primeiro.'], ['Responda 4 perguntas', 'Seu perfil, seu público e onde você está hoje. O planner se organiza a partir disso.'], ['Use todo dia', 'Planeje o post, grave, marque como postado e veja o mês fechar sozinho.']].map(([t, d], i) => (
          <div className="how-i" key={t}><span>{i + 1}</span><b>{t}</b><p>{d}</p></div>
        ))}</div>
      </section>

      <Recursos />
      <Historia />
      <Isca espera />
      <ComprarPdf />

      <section className="lp-sec">
        <h2>Perguntas frequentes</h2>
        <div className="faq">{FAQ_ESPERA.map(([q, a]) => <details key={q}><summary>{q}<Ic n="plus" s={16} w={2.4} /></summary><p>{a}</p></details>)}</div>
      </section>

      <Rodape />
    </div>
  )
}

function Celular() {
  return (
    <div className="lp-phone">
      <div className="phn">
        <div className="phn-bar"><b>planner.do.criador</b><span>•••</span></div>
        <div className="phn-prof"><div className="ring"><div /></div><div className="phn-st"><div><b>12</b><span>meses</span></div><div><b>6</b><span>lições</span></div><div><b>∞</b><span>roteiros</span></div></div></div>
        <div className="phn-bio"><b>Comece com o que você tem</b><span>estudar · gravar · publicar · mapear · ajustar</span></div>
        <div className="phn-grid">{['#FFB020', '#FF3D77', '#8B5CF6', '#10B981', '#FF7A2F', '#3B82F6', '#EC4899', '#14B8A6', '#F59E0B'].map((c) => <i key={c} style={{ background: c }} />)}</div>
      </div>
      <div className="stk a"><Ic n="heart" s={14} w={2.4} /> 2,1 mil curtidas</div>
      <div className="stk b"><Ic n="trophy" s={14} w={2.4} /> +1 contrato fechado</div>
      <div className="stk c"><Ic n="comment" s={14} w={2.4} /> “isso é comigo!”</div>
    </div>
  )
}
function Prints({ legenda }) {
  return (
    <section className="lp-sec">
      <h2>Veja por dentro</h2>
      <p className="mut lp-lead">{legenda}</p>
      <div className="prints">{PRINTS.map(([src, t, d]) => (
        <figure key={t} className="print"><div className="pframe"><img src={src} alt={`Tela do app: ${t}`} loading="lazy" width="390" height="844" /></div><figcaption><b>{t}</b><span>{d}</span></figcaption></figure>
      ))}</div>
    </section>
  )
}
function Recursos() {
  return (
    <section className="lp-sec">
      <h2>Tudo o que um criador precisa registrar, num lugar só</h2>
      <div className="lp-grid">{RECURSOS.map(([i, t, d, c]) => (
        <div className="lp-card" key={t} style={{ '--c': c }}><div className="lp-ic"><Ic n={i} s={20} /></div><b>{t}</b><p>{d}</p></div>
      ))}</div>
    </section>
  )
}
function Historia() {
  return (
    <section className="lp-sec lp-story">
      <div className="lp-post">
        <div className="lp-post-h"><div className="mava" /><b>planner.do.criador</b></div>
        <p>“Quando eu comecei, tudo o que eu tinha era um iPhone 13 Pro. Sem luz profissional, sem microfone, sem câmera. Foi com esse celular que eu fechei os primeiros contratos. <b>Não foi o equipamento que trouxe os clientes. Foram os clientes que trouxeram o equipamento.</b>”</p>
      </div>
      <div>
        <h2>Feito por quem começou do zero</h2>
        <p className="mut">As lições do planner vêm de erros reais: roteiros que não funcionavam, o panfleto que trouxe clientes e a ordem certa de comprar luz, microfone e câmera.</p>
      </div>
    </section>
  )
}
function Rodape() {
  return (
    <footer className="lp-ft">
      <span className="brand">planner<i>.</i>do<i>.</i>criador</span>
      <a className="igb" href={IG_URL} target="_blank" rel="noreferrer"><Ic n="at" s={14} w={2.2} /> @aritamende.s</a>
      <span className="lp-legal"><Link to="/termos">Termos de uso</Link><Link to="/privacidade">Privacidade</Link>{ARTIFACT && !LANCADO && <Link to="/entrar">Ver o app (demonstração)</Link>}</span>
      <span className="mut sm">© 2027 Planner do Criador · <b className="telora">Télora Produtora</b></span>
    </footer>
  )
}

function LandingVendas() {
  return (
    <div className="lp">
      <nav className="lp-nav">
        <span className="brand">planner<i>.</i>do<i>.</i>criador</span>
        <div><Link to="/entrar" className="btn ghost sm">Entrar</Link><Link to="/entrar?criar=1" className="btn sm">Começar</Link></div>
      </nav>

      <section className="lp-hero">
        <div className="lp-hero-t">
          <span className="pill">{PROMO ? `${PROMO} · ${DIAS_TESTE} dias grátis` : `${DIAS_TESTE} dias grátis · cancele quando quiser`}</span>
          <h1>Planner<br /><em>do criador</em> <span className="yr">2027</span></h1>
          <p>O app para quem quer produzir conteúdo e fechar contratos começando com o que já tem: calendário editorial, roteiros, análise do mês e negócio, com cara de rede social.</p>
          <div className="lp-cta"><Link to="/entrar?criar=1" className="btn big" onClick={() => track('teste')}>Testar grátis por {DIAS_TESTE} dias <Ic n="right" s={16} w={2.6} /></Link><span className="mut">depois {PRECO_DE && <s>{PRECO_DE}</s>} <b>{PRECO}</b>/mês</span></div>
        </div>
        <div className="lp-phone">
          <div className="phn">
            <div className="phn-bar"><b>planner.do.criador</b><span>•••</span></div>
            <div className="phn-prof"><div className="ring"><div /></div><div className="phn-st"><div><b>12</b><span>meses</span></div><div><b>6</b><span>lições</span></div><div><b>∞</b><span>roteiros</span></div></div></div>
            <div className="phn-bio"><b>Comece com o que você tem</b><span>estudar · gravar · publicar · mapear · ajustar</span></div>
            <div className="phn-grid">{['#FFB020', '#FF3D77', '#8B5CF6', '#10B981', '#FF7A2F', '#3B82F6', '#EC4899', '#14B8A6', '#F59E0B'].map((c) => <i key={c} style={{ background: c }} />)}</div>
          </div>
          <div className="stk a"><Ic n="heart" s={14} w={2.4} /> 2,1 mil curtidas</div>
          <div className="stk b"><Ic n="trophy" s={14} w={2.4} /> +1 contrato fechado</div>
          <div className="stk c"><Ic n="comment" s={14} w={2.4} /> “isso é comigo!”</div>
        </div>
      </section>

      <section className="lp-sec">
        <h2>Veja por dentro</h2>
        <p className="mut lp-lead">Telas reais do app, preenchidas com um exemplo.</p>
        <div className="prints">{PRINTS.map(([src, t, d]) => (
          <figure key={t} className="print"><div className="pframe"><img src={src} alt={`Tela do app: ${t}`} loading="lazy" width="390" height="844" /></div><figcaption><b>{t}</b><span>{d}</span></figcaption></figure>
        ))}</div>
      </section>

      <section className="lp-sec">
        <h2>Como funciona</h2>
        <div className="how">{[['Crie sua conta', `Leva 1 minuto. Cadastre o cartão e use ${DIAS_TESTE} dias grátis; a 1ª cobrança é só no 8º dia.`], ['Responda 4 perguntas', 'Seu perfil, seu público e onde você está hoje. O planner se organiza a partir disso.'], ['Use todo dia', 'Planeje o post, grave, marque como postado e veja o mês fechar sozinho.']].map(([t, d], i) => (
          <div className="how-i" key={t}><span>{i + 1}</span><b>{t}</b><p>{d}</p></div>
        ))}</div>
      </section>

      <section className="lp-sec">
        <h2>Tudo o que um criador precisa registrar, num lugar só</h2>
        <div className="lp-grid">{RECURSOS.map(([i, t, d, c]) => (
          <div className="lp-card" key={t} style={{ '--c': c }}><div className="lp-ic"><Ic n={i} s={20} /></div><b>{t}</b><p>{d}</p></div>
        ))}</div>
      </section>

      <section className="lp-sec lp-story">
        <div className="lp-post">
          <div className="lp-post-h"><div className="mava" /><b>planner.do.criador</b></div>
          <p>“Quando eu comecei, tudo o que eu tinha era um iPhone 13 Pro. Sem luz profissional, sem microfone, sem câmera. Foi com esse celular que eu fechei os primeiros contratos. <b>Não foi o equipamento que trouxe os clientes. Foram os clientes que trouxeram o equipamento.</b>”</p>
        </div>
        <div>
          <h2>Feito por quem começou do zero</h2>
          <p className="mut">As lições do planner vêm de erros reais: roteiros que não funcionavam, o panfleto que trouxe clientes e a ordem certa de comprar luz, microfone e câmera.</p>
        </div>
      </section>

      <ComprarPdf />

      <section className="lp-sec lp-price" id="preco">
        <div className="price">
          <span className="pill">assinatura mensal</span>
          <Preco />
          <ul>{['Planner completo, ano após ano', 'Roteiros e ideias ilimitados', 'Somas e retrospectiva automáticas', 'Sincroniza celular e computador', 'Funciona offline como app', `${DIAS_TESTE} dias grátis, cobrança só no 8º dia`].map((x) => <li key={x}><Ic n="check" s={15} w={3} />{x}</li>)}</ul>
          <Link to="/entrar?criar=1" className="btn big full">Começar meu teste grátis</Link>
          <span className="mut sm">Sem fidelidade. Cancele quando quiser.</span>
        </div>
      </section>

      <section className="lp-sec">
        <h2>Perguntas frequentes</h2>
        <div className="faq">{FAQ.map(([q, a]) => <details key={q}><summary>{q}<Ic n="plus" s={16} w={2.4} /></summary><p>{a}</p></details>)}</div>
      </section>

      <Rodape />
    </div>
  )
}

function Isca() {
  const [nome, setNome] = useState(''); const [email, setEmail] = useState(''); const [ok, setOk] = useState(false)
  const [aceite, setAceite] = useState(false); const [erro, setErro] = useState(''); const [busy, setBusy] = useState(false)
  async function enviar(e) {
    e.preventDefault(); setErro(''); setBusy(true)
    if (!DEMO) {
      const { error } = await supabase.from('leads').insert({ nome, email, consentimento: true, origem: 'lista-espera' })
      if (error) { setBusy(false); setErro('Não consegui registrar agora. Confira o e-mail e tente de novo.'); return }
    }
    track('lead', { content_name: 'lista-espera' }); setOk(true); setBusy(false)
  }
  return (
    <section className="lp-sec isca" id="lista">
      <div className="isca-c">
        <div className="isca-t">
          <span className="pill">lista de espera</span>
          <h2>Saiba do lançamento antes de todo mundo</h2>
          <p className="mut">Entre na lista e receba o aviso do lançamento do app no seu e-mail, antes de todo mundo.</p>
        </div>
        {!ok ? (
          <form className="isca-f" onSubmit={enviar}>
            <input className="in big" placeholder="Seu nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
            <input className="in big" type="email" placeholder="Seu melhor e-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <label className={'ck aceite' + (aceite ? ' on' : '')}><input type="checkbox" checked={aceite} onChange={(e) => setAceite(e.target.checked)} required /><span className="box"><Ic n="check" s={12} w={3} /></span><span className="ckl2">Aceito receber o aviso de lançamento e outros e-mails do Planner do Criador. Posso cancelar quando quiser. <Link to="/privacidade">Privacidade</Link></span></label>
            <button className="btn big full" disabled={busy || !aceite}>{busy ? 'Enviando…' : 'Entrar na lista'}</button>
            {erro && <p className="note err">{erro}</p>}
          </form>
        ) : (
          <div className="isca-f ok">
            <b>Pronto, {nome.split(' ')[0] || 'criadora'}!</b>
            <p className="mut">Você está na lista. Assim que o app for lançado, avisamos no seu e-mail.</p>
            <a className="link" href={IG_URL} target="_blank" rel="noreferrer">Acompanhe os bastidores no @aritamende.s</a>
          </div>
        )}
      </div>
    </section>
  )
}

// Venda do PDF completo: pagamento único no Asaas (PIX ou cartão), entregue por e-mail
const mascCep = (v) => v.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2')
const mascCel = (v) => v.replace(/\D/g, '').slice(0, 11).replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')
const mascCpf = (v) => v.replace(/\D/g, '').slice(0, 11).replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2')
function ComprarPdf() {
  const [nome, setNome] = useState(''); const [email, setEmail] = useState(''); const [cpf, setCpf] = useState('')
  const [cel, setCel] = useState(''); const [cep, setCep] = useState(''); const [num, setNum] = useState('')
  const [aceite, setAceite] = useState(false); const [erro, setErro] = useState(''); const [busy, setBusy] = useState(false)
  async function comprar(e) {
    e.preventDefault(); setErro('')
    if (DEMO) { setErro('Na demonstração a compra fica desativada.'); return }
    setBusy(true)
    const { data, error } = await supabase.functions.invoke('comprar-pdf', { body: { nome, email, cpf, celular: cel, cep, numero: num } })
    if (error || !data?.url) {
      let m = data?.erro
      try { m = m || (await error?.context?.json())?.erro } catch (x) { /* ok */ }
      setBusy(false); setErro(m || 'Não consegui abrir o pagamento agora. Tente de novo em instantes.'); return
    }
    track('checkout', { content_name: 'pdf', value: 8.99, currency: 'BRL' }); location.href = data.url
  }
  return (
    <section className="lp-sec isca" id="pdf">
      <div className="isca-c">
        <div className="isca-t">
          <span className="pill">PDF completo · {PRECO_PDF}</span>
          <h2>Prefere no papel? Leve o planner em PDF</h2>
          <p className="mut">O Planner do Criador 2027 inteiro em PDF interativo: as 6 lições, os 12 meses com calendário editorial, roteiros, análise e negócio do mês. Preencha no celular ou imprima.</p>
          <ul className="pdf-l">{['Pagamento único, sem assinatura', 'PIX ou cartão, no ambiente seguro do Asaas', 'Chega no seu e-mail assim que o pagamento é confirmado'].map((x) => <li key={x}><Ic n="check" s={14} w={3} />{x}</li>)}</ul>
        </div>
        <form className="isca-f" onSubmit={comprar}>
          <input className="in big" placeholder="Nome completo" value={nome} onChange={(e) => setNome(e.target.value)} required autoComplete="name" />
          <input className="in big" type="email" placeholder="E-mail para receber o PDF" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          <input className="in big" placeholder="CPF" inputMode="numeric" value={cpf} onChange={(e) => setCpf(mascCpf(e.target.value))} required />
          <input className="in big" placeholder="Celular com DDD" inputMode="tel" value={cel} onChange={(e) => setCel(mascCel(e.target.value))} required autoComplete="tel" />
          <div className="g2 tight"><input className="in big" placeholder="CEP" inputMode="numeric" value={cep} onChange={(e) => setCep(mascCep(e.target.value))} required autoComplete="postal-code" /><input className="in big" placeholder="Número da casa" value={num} onChange={(e) => setNum(e.target.value.slice(0, 10))} required /></div>
          <label className={'ck aceite' + (aceite ? ' on' : '')}><input type="checkbox" checked={aceite} onChange={(e) => setAceite(e.target.checked)} required /><span className="box"><Ic n="check" s={12} w={3} /></span><span className="ckl2">Li e aceito os <Link to="/termos">Termos de uso</Link> e a <Link to="/privacidade">Política de privacidade</Link></span></label>
          <button className="btn big full" disabled={busy || !aceite}>{busy ? 'Abrindo o pagamento…' : `Comprar o PDF por ${PRECO_PDF}`}</button>
          {erro && <p className="note err">{erro}</p>}
        </form>
      </div>
    </section>
  )
}
