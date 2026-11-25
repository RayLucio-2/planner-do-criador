// Página só do PDF, para divulgar o link direto nos stories
import { Link } from 'react-router-dom'
import { Ic } from '../components/ui'
import { ComprarPdf, Rodape } from './Landing'
import { PRECO_PDF, DIAS_TESTE } from '../lib/supabase'

const TEM = [
  ['bulb', 'As 6 lições', 'Do “comece com o que você tem” ao método para entender a dor do seu público.', '#FF3D77'],
  ['cal', '12 meses planejados', 'Calendário editorial, semanas, roteiros, análise e negócio de cada mês.', '#8B5CF6'],
  ['target', 'Ferramentas', 'Público, linguagem, escada de equipamento, Google Meu Negócio, panfleto e mais.', '#FF7A2F'],
  ['pen', 'Para preencher', 'PDF interativo: escreva no celular ou no computador, ou imprima.', '#10B981'],
]

export default function LandingPdf() {
  return (
    <div className="lp">
      <nav className="lp-nav">
        <Link to="/" className="brand">planner<i>.</i>do<i>.</i>criador</Link>
        <div><a href="#pdf" className="btn sm">Comprar {PRECO_PDF}</a></div>
      </nav>
      <section className="lp-sec pdf-hero">
        <span className="pill">PDF completo · pagamento único</span>
        <h1>O Planner do Criador 2027 <em>em PDF</em></h1>
        <p className="mut">110 páginas para planejar o seu ano de conteúdo e de contratos, começando com o que você já tem. Por <b>{PRECO_PDF}</b>, no PIX ou no cartão, direto no seu e-mail.</p>
        <a href="#pdf" className="btn big">Quero o PDF por {PRECO_PDF} <Ic n="right" s={16} w={2.6} /></a>
      </section>
      <section className="lp-sec">
        <div className="lp-grid">{TEM.map(([i, t, d, c]) => <div key={t} className="lp-card" style={{ '--c': c }}><div className="lp-ic"><Ic n={i} s={20} /></div><b>{t}</b><p>{d}</p></div>)}</div>
      </section>
      <ComprarPdf />
      <section className="lp-sec">
        <Link to="/" className="cross"><span className="pill">versão app</span><b>Prefere no celular, com tudo somado sozinho?</b><p className="mut">O app tem o planner completo, financeiro, lembretes e sincroniza entre aparelhos. Teste {DIAS_TESTE} dias grátis.</p><span className="link">Conhecer o app <Ic n="right" s={14} w={2.4} /></span></Link>
      </section>
      <Rodape />
    </div>
  )
}
