// Busca em tudo o que a pessoa escreveu no ano aberto (ideias, roteiros, notas, contratos…)
import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Ic, Head } from '../../components/ui'
import { entradasVisiveis, useStoreVersion, useAno } from '../../lib/store'
import { MES, LICOES } from '../../data/content'
import { TOOLS } from './Ferramentas'

const ABAS = { ed: ['Calendário', 'editorial'], rot: ['Roteiros', 'roteiros'], an: ['Análise', 'analise'], neg: ['Negócio', 'negocio'], visao: ['Visão do mês', ''], sem: ['Semanas', 'semanas'] }
const sem = (t) => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

function onde(chave) {
  const [base, sub] = chave.split('.')
  if (MES[base] && ABAS[sub]) return [`${MES[base].nome} · ${ABAS[sub][0]}`, `/app/mes/${base}${ABAS[sub][1] ? '/' + ABAS[sub][1] : ''}`]
  if (base === 'ideias') return ['Ideias', '/app/ideias']
  if (base === 'notas') return ['Notas', '/app/notas']
  if (base === 'capa') return ['Perfil', '/app/perfil']
  const l = LICOES.find((x) => x.id === base); if (l) return [`Guia · ${l.titulo}`, `/app/guia/${l.id}`]
  const t = TOOLS.find((x) => x[0] === base); if (t) return [`Ferramentas · ${t[1].replace('{ano}', '').replace('{ant}', '').trim()}`, `/app/ferramentas/${base}`]
  return null
}
// junta todos os textos de uma página (inclusive listas)
function textos(v, out = []) {
  if (typeof v === 'string') { if (v.trim().length > 1 && !/^\d{4}-\d{2}-\d{2}$/.test(v)) out.push(v) }
  else if (Array.isArray(v)) v.forEach((x) => textos(x, out))
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => textos(x, out))
  return out
}

export default function Busca() {
  useStoreVersion(); const ano = useAno()
  const [q, setQ] = useState('')
  const res = useMemo(() => {
    const t = sem(q.trim()); if (t.length < 2) return []
    const out = []
    for (const [chave, v] of entradasVisiveis()) {
      const loc = onde(chave); if (!loc) continue
      for (const txt of textos(v)) if (sem(txt).includes(t)) { out.push({ loc, txt, chave }); if (out.length >= 60) return out }
    }
    return out
  }, [q, ano])
  return (
    <div className="page">
      <Head icon="search" title="Buscar" sub={`Em tudo o que você escreveu em ${ano}`} color="#3B82F6" />
      <label className="busca"><Ic n="search" s={18} /><input className="in big" autoFocus placeholder="Ex.: café, Studio Fit, gancho…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar no planner" /></label>
      {q.trim().length >= 2 && <p className="mut sm">{res.length ? `${res.length}${res.length >= 60 ? '+' : ''} ${res.length === 1 ? 'resultado' : 'resultados'}` : 'Nada encontrado. Tente outra palavra ou troque o ano no topo.'}</p>}
      <div className="busca-l">{res.map((r, i) => {
        const p = sem(r.txt).indexOf(sem(q.trim())); const ini = Math.max(0, p - 40)
        const trecho = (ini ? '…' : '') + r.txt.slice(ini, p + q.trim().length + 80) + (r.txt.length > p + q.trim().length + 80 ? '…' : '')
        return <Link key={i} to={r.loc[1]} className="busca-r"><small>{r.loc[0]}</small><span>{trecho}</span></Link>
      })}</div>
    </div>
  )
}
