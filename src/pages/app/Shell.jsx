import { NavLink, Outlet, Link, useLocation, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Ic } from '../../components/ui'
import { useStatus, useAno, setAno, ANOS, useEntry, useLoaded } from '../../lib/store'
import { useAuth } from '../../lib/auth'
import { DEMO } from '../../lib/supabase'
import { IG_URL } from '../../data/content'

const TABS = [['/app', 'home', 'Início', true], ['/app/meses', 'cal', 'Meses'], ['/app/financeiro', 'coin', 'Financeiro'], ['/app/guia', 'bulb', 'Guia'], ['/app/ferramentas', 'target', 'Ferramentas'], ['/app/perfil', 'user', 'Perfil']]

export default function Shell() {
  const st = useStatus(); const ano = useAno(); const { trialDays } = useAuth(); const loc = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [loc.pathname])
  const capa = useEntry('capa'); const loaded = useLoaded()
  if (!loaded) return <div className="loading"><div className="ring big spin"><div /></div></div>
  if (!capa.onboarded && !capa.nome) return <Navigate to="/boas-vindas" replace />
  const label = DEMO ? 'demo · salvo no aparelho' : { salvo: 'salvo', salvando: 'salvando…', offline: 'offline · salvo no aparelho', erro: 'erro ao salvar', 'sem-acesso': 'assinatura inativa' }[st]
  return (
    <div className="app">
      <header className="top">
        <Link to="/app" className="brand">planner<i>.</i>do<i>.</i>criador</Link>
        <div className="top-r">
          <label className="anosel" title="Trocar o ano do planner"><select value={ano} onChange={(e) => setAno(Number(e.target.value))} aria-label="Ano do planner">{ANOS.map((y) => <option key={y} value={y}>{y}</option>)}</select></label>
          {trialDays != null && <Link to="/app/perfil" className="trial">teste: {trialDays} {trialDays === 1 ? 'dia' : 'dias'}</Link>}
          <span className={'sync ' + (DEMO ? 'demo' : st)} title={label}><Ic n="cloud" s={16} /><span>{label}</span></span>
        </div>
      </header>
      <main className="main"><Outlet /></main>
      <footer className="app-ft"><a href={IG_URL} target="_blank" rel="noreferrer" className="igb"><Ic n="at" s={13} w={2.2} /> @aritamende.s</a><span className="telora-ft">uma criação <b>Télora Produtora</b></span></footer>
      <nav className="tabbar">
        {TABS.map(([to, ic, l, end]) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => 'tb' + (isActive ? ' on' : '')}><Ic n={ic} s={22} /><span>{l}</span></NavLink>
        ))}
      </nav>
    </div>
  )
}
