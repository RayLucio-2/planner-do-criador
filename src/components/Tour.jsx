// Tour rápido: mostra onde fica cada coisa (aparece uma vez; dá para rever em Perfil)
import { useState } from 'react'
import { Ic } from './ui'

const PASSOS = [
  ['cal', '#FF3D77', 'Seu ano, mês a mês', 'Em Meses, cada mês tem o calendário de posts, roteiros, análise e o negócio. O 🔔 de cada dia cria o lembrete no Google Agenda.'],
  ['plus', '#8B5CF6', 'O + anota qualquer coisa', 'Teve uma ideia ou fechou um contrato? Toque no + no canto da tela e salve em dois toques, de qualquer lugar.'],
  ['coin', '#10B981', 'O seu dinheiro', 'Em Financeiro você vê quanto entrou, o que falta receber, o seu pró-labore e para onde foi o dinheiro.'],
  ['search', '#3B82F6', 'Achou tudo?', 'A lupa no topo procura em ideias, roteiros, notas e contratos. O Guia e as Ferramentas ensinam o caminho, um passo de cada vez.'],
]

export default function Tour({ onFim }) {
  const [i, setI] = useState(0); const [ic, c, t, d] = PASSOS[i]; const ult = i === PASSOS.length - 1
  return (
    <div className="sheet-bg tour-bg">
      <div className="tour" role="dialog" aria-modal="true" aria-label="Conheça o planner">
        <div className="ring big" style={{ '--c': c }}><div><Ic n={ic} s={30} /></div></div>
        <span className="pill">{i + 1} de {PASSOS.length}</span>
        <h2>{t}</h2>
        <p className="mut">{d}</p>
        <div className="tour-d">{PASSOS.map((_, j) => <i key={j} className={j === i ? 'on' : ''} />)}</div>
        <button className="btn big full" onClick={() => (ult ? onFim() : setI(i + 1))}>{ult ? 'Começar a usar' : 'Próximo'}</button>
        {!ult && <button className="link" onClick={onFim}>Pular</button>}
      </div>
    </div>
  )
}
