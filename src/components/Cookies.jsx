import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { temMedicao, consentimento, salvarConsentimento, carregar, track } from '../lib/analytics'

export function RotaMedida() {
  const loc = useLocation()
  useEffect(() => { carregar(); track('pagina') }, [loc.pathname])
  return null
}

export default function Cookies() {
  const [v, setV] = useState(consentimento())
  if (!temMedicao || v) return null
  const escolher = (x) => { salvarConsentimento(x); setV(x); if (x === 'sim') track('pagina') }
  return (
    <div className="cookies" role="dialog" aria-label="Aviso de cookies">
      <p>Usamos cookies para medir visitas e melhorar nossos anúncios. Você escolhe. <Link to="/privacidade">Saiba mais</Link></p>
      <div><button className="btn ghost sm" onClick={() => escolher('nao')}>Só os essenciais</button><button className="btn sm" onClick={() => escolher('sim')}>Aceitar</button></div>
    </div>
  )
}
