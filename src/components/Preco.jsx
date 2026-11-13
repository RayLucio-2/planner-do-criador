import { PRECO, PRECO_DE, PROMO } from '../lib/supabase'

// Preço da assinatura, com o valor "de" riscado enquanto houver promoção
export default function Preco({ sufixo = '/mês' }) {
  return (
    <div className="pv">
      {PRECO_DE && <s className="pv-de">{PRECO_DE}</s>}
      <b>{PRECO}</b><span>{sufixo}</span>
      {PROMO && <em className="pv-promo">{PROMO}</em>}
    </div>
  )
}
