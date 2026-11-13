import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, MemoryRouter, Routes, Route, Navigate } from 'react-router-dom'
const Router = import.meta.env.VITE_ROUTER === 'memory' ? MemoryRouter : HashRouter
import './styles.css'
import { AuthProvider, useAuth } from './lib/auth'
import Landing from './pages/Landing'
import Entrar from './pages/Entrar'
import Shell from './pages/app/Shell'
import Home, { Carta } from './pages/app/Home'
import { GuiaIndex, Licao } from './pages/app/Guia'
import { FerramentasIndex, Ferramenta } from './pages/app/Ferramentas'
import { MesesIndex, Mes } from './pages/app/Mes'
import { Semestre, Fechamento, Fim, Ano, Ideias, Notas } from './pages/app/Revisoes'
import Perfil, { Paywall } from './pages/app/Perfil'
import BoasVindas from './pages/app/BoasVindas'
import Convite from './pages/Convite'
import Obrigada from './pages/Obrigada'
import { Termos, Privacidade } from './pages/Legal'
import Cookies, { RotaMedida } from './components/Cookies'

function Guard({ children }) {
  const { user, access, sub } = useAuth()
  if (user === undefined) return <div className="loading"><div className="ring big spin"><div /></div></div>
  if (!user) return <Navigate to="/entrar" replace />
  if (sub === null) return <div className="loading"><div className="ring big spin"><div /></div></div>
  if (!access) return <Paywall />
  return children
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <Router>
      <RotaMedida />
      <Cookies />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/termos" element={<Termos />} />
        <Route path="/privacidade" element={<Privacidade />} />
        <Route path="/boas-vindas" element={<Guard><BoasVindas /></Guard>} />
        <Route path="/entrar" element={<Entrar />} />
        <Route path="/convite" element={<Convite />} />
        <Route path="/obrigada" element={<Obrigada />} />
        <Route path="/app" element={<Guard><Shell /></Guard>}>
          <Route index element={<Home />} />
          <Route path="carta" element={<Carta />} />
          <Route path="guia" element={<GuiaIndex />} />
          <Route path="guia/:id" element={<Licao />} />
          <Route path="ferramentas" element={<FerramentasIndex />} />
          <Route path="ferramentas/:id" element={<Ferramenta />} />
          <Route path="meses" element={<MesesIndex />} />
          <Route path="mes/:m" element={<Mes />} />
          <Route path="mes/:m/:tab" element={<Mes />} />
          <Route path="semestre/:n" element={<Semestre />} />
          <Route path="fechamento/:n" element={<Fechamento />} />
          <Route path="fim" element={<Fim />} />
          <Route path="2027" element={<Ano />} />
          <Route path="ideias" element={<Ideias />} />
          <Route path="notas" element={<Notas />} />
          <Route path="perfil" element={<Perfil />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  </AuthProvider>
)

if ('serviceWorker' in navigator && import.meta.env.PROD && window.top === window.self) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}))
}
