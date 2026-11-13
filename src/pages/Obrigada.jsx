import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Ic } from '../components/ui'
import { DIAS_TESTE } from '../lib/supabase'
import { track } from '../lib/analytics'

const BASE = (import.meta.env.VITE_SUPABASE_URL || '') + '/functions/v1/baixar-pdf'

// Página de obrigado da compra do PDF. Confere o pagamento e libera o download.
export default function Obrigada() {
  const [sp] = useSearchParams()
  const c = sp.get('c') || ''; const t = sp.get('t') || ''
  const [pago, setPago] = useState(null)
  const link = `${BASE}?c=${encodeURIComponent(c)}&t=${encodeURIComponent(t)}`

  useEffect(() => {
    if (!c || !t) { setPago(false); return }
    let n = 0, parar = false
    async function checar() {
      try {
        const r = await fetch(link + '&status=1'); const j = await r.json()
        if (j.pago) { setPago(true); track('compra', { content_name: 'pdf', value: 8.99, currency: 'BRL' }); return }
      } catch (e) { /* tenta de novo */ }
      setPago(false); if (++n < 60 && !parar) setTimeout(checar, 5000)
    }
    checar()
    return () => { parar = true }
  }, [c, t])

  return (
    <div className="auth">
      <Link to="/" className="brand">planner<i>.</i>do<i>.</i>criador</Link>
      <div className="auth-card">
        <div className="ring big"><div><Ic n={pago ? 'download' : 'cloud'} s={30} /></div></div>
        {pago ? <>
          <h1>Seu PDF chegou! 🎉</h1>
          <p className="mut">Obrigada pela compra. Baixe agora pelo botão abaixo. Também mandamos o link para o seu e-mail (confira o spam).</p>
          <a className="btn big full" href={link}><Ic n="download" s={18} /> Baixar o PDF</a>
          <p className="mut sm">Para preencher os campos, abra no Adobe Acrobat Reader (grátis, no celular ou no computador).</p>
          <Link to="/entrar?criar=1" className="link">Conheça o app: {DIAS_TESTE} dias grátis</Link>
        </> : <>
          <h1>Confirmando o pagamento…</h1>
          <p className="mut">No cartão leva poucos segundos. No PIX, assim que o banco confirmar, o download aparece aqui e o link chega no seu e-mail.</p>
          <p className="mut sm">Pode fechar esta página: o PDF vai para o seu e-mail de qualquer jeito.</p>
        </>}
      </div>
    </div>
  )
}
