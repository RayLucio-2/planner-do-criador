import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useEntry, setField, num, useAno } from '../lib/store'

// ------------------------------------------------------------------ ícones
const P = {
  heart: <path d="M12 20.5s-7.6-4.6-9.5-9.1C1.1 7.9 3.3 4.5 6.8 4.5c2.2 0 3.7 1.3 5.2 3 1.5-1.7 3-3 5.2-3 3.5 0 5.7 3.4 4.3 6.9-1.9 4.5-9.5 9.1-9.5 9.1z" />,
  comment: <path d="M20.5 11.6a8.4 8.4 0 0 1-12.4 7.3L3.5 20.3l1.4-4.4A8.4 8.4 0 1 1 20.5 11.6z" />,
  send: <path d="M21.5 3.2 10.4 13.4M21.5 3.2l-6.9 18.1-4.2-7.9-7.9-4.2z" />,
  bookmark: <path d="M6.5 3.5h11v17l-5.5-4-5.5 4z" />,
  home: <path d="M3.5 10.8 12 4l8.5 6.8V20h-5.6v-5.6H9.1V20H3.5z" />,
  cam: <><rect x="2.5" y="6.5" width="19" height="13" rx="3" /><circle cx="12" cy="13" r="3.6" /><path d="M8.5 6.5 10 4h4l1.5 2.5" /></>,
  mic: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" /></>,
  bulb: <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.4 1.1 2.2h5c0-.8.4-1.6 1.1-2.2A6 6 0 0 0 12 3z" />,
  chart: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  coin: <><circle cx="12" cy="12" r="8.5" /><path d="M14.8 9.2c-.5-.9-1.6-1.4-2.8-1.4-1.6 0-2.8.9-2.8 2.1 0 2.9 5.8 1.4 5.8 4.3 0 1.2-1.2 2.1-2.9 2.1-1.3 0-2.4-.6-2.9-1.5M12 6v1.8M12 16.3V18" /></>,
  cal: <><rect x="3.5" y="5" width="17" height="15.5" rx="3" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>,
  pen: <path d="M4 20l1-4.5L15.8 4.7a2 2 0 0 1 2.8 0l.7.7a2 2 0 0 1 0 2.8L8.5 19z" />,
  target: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.8" /><circle cx="12" cy="12" r="1.2" /></>,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.5-3.6 3.1-5.8 6.5-5.8s6 2.2 6.5 5.8M16 4.8a3.4 3.4 0 0 1 0 6.5M18 14.6c2 .7 3.3 2.6 3.5 5.4" /></>,
  spark: <path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4zM19 16l.8 2.2 2.2.8-2.2.8L19 22l-.8-2.2-2.2-.8 2.2-.8z" />,
  play: <><rect x="3" y="4" width="18" height="16" rx="4" /><path d="M10 9v6l5-3z" /></>,
  grid: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></>,
  map: <path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6zM9 4v14M15 6v14" />,
  check: <path d="M4.5 12.5l5 5 10-11" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  loop: <path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v4.5h-4.5" />,
  globe: <><circle cx="12" cy="12" r="8.5" /><path d="M3.7 9h16.6M3.7 15h16.6M12 3.5c2.4 2.3 3.6 5.1 3.6 8.5s-1.2 6.2-3.6 8.5c-2.4-2.3-3.6-5.1-3.6-8.5S9.6 5.8 12 3.5z" /></>,
  flyer: <><path d="M6 3h9l4 4v14H6z" /><path d="M15 3v4h4M9 12h7M9 15.5h7M9 9h3" /></>,
  door: <><path d="M5 21V4.5A1.5 1.5 0 0 1 6.5 3h11A1.5 1.5 0 0 1 19 4.5V21M3 21h18" /><circle cx="15" cy="12.5" r="1" /></>,
  idea: <><path d="M12 3v2M4.2 6.2l1.4 1.4M19.8 6.2l-1.4 1.4M3 13h2M19 13h2" /><path d="M8 16a5 5 0 1 1 8 0c-.8.7-1 1.6-1 2.5H9c0-.9-.2-1.8-1-2.5zM10 21h4" /></>,
  flag: <path d="M5 21V4M5 4h12l-2 4 2 4H5" />,
  trophy: <path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4.5a3 3 0 0 0 3.6 4.4M16 6h3.5a3 3 0 0 1-3.6 4.4M12 13v4M8.5 20.5h7M10 17h4l.5 3.5h-5z" />,
  note: <path d="M5 3.5h14v17H5zM8.5 8h7M8.5 12h7M8.5 16h4" />,
  eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" /></>,
  film: <><rect x="3" y="3.5" width="18" height="17" rx="2.5" /><path d="M7.5 3.5v17M16.5 3.5v17M3 8h4.5M3 12h18M3 16h4.5M16.5 8H21M16.5 16H21" /></>,
  stair: <path d="M3 20h5v-5h5v-5h5V5h3" />,
  left: <path d="M15 5l-7 7 7 7" />,
  right: <path d="M9 5l7 7-7 7" />,
  plus: <path d="M12 5v14M5 12h14" />,
  trash: <path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13" />,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c.6-4.2 3.8-6.5 8-6.5s7.4 2.3 8 6.5" /></>,
  at: <><circle cx="12" cy="12" r="3.8" /><path d="M15.8 12v1.6a2.6 2.6 0 0 0 5.2 0V12a9 9 0 1 0-3.6 7.2" /></>,
  list: <><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4.5" cy="6" r="1" /><circle cx="4.5" cy="12" r="1" /><circle cx="4.5" cy="18" r="1" /></>,
  scissors: <><circle cx="6" cy="6.5" r="2.8" /><circle cx="6" cy="17.5" r="2.8" /><path d="M8.3 8.2 20 18M8.3 15.8 20 6" /></>,
  lock: <><rect x="4.5" y="10.5" width="15" height="10" rx="2.5" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></>,
  download: <path d="M12 4v11M7 10.5l5 5 5-5M4.5 20h15" />,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.6M12 17.2v.1" /></>,
  chev: <path d="M6 9l6 6 6-6" />,
  undo: <path d="M9 14L4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />,
  bell: <><path d="M6 9.5a6 6 0 0 1 12 0c0 5 2 6.5 2 6.5H4s2-1.5 2-6.5" /><path d="M10 19.5a2 2 0 0 0 4 0" /></>,
  upload: <path d="M12 16V4M7 9l5-5 5 5M4.5 15v4.5h15V15" />,
  cloud: <path d="M7 18.5h10.5a4 4 0 0 0 .6-8A6 6 0 0 0 6.6 9.3 4.6 4.6 0 0 0 7 18.5z" />,
}
export function Ic({ n, s = 18, w = 1.9, ...r }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" {...r}>{P[n]}</svg>
}

// texto com **negrito**
export function Md({ t }) {
  const parts = String(t).split(/(\*\*[^*]+\*\*)/g)
  return <>{parts.map((p, i) => p.startsWith('**') ? <b key={i}>{p.slice(2, -2)}</b> : p)}</>
}

// ------------------------------------------------------------------ campos ligados ao armazenamento
const EntryCtx = createContext(null)
export function Entry({ k, children }) { return <EntryCtx.Provider value={k}>{children}</EntryCtx.Provider> }
export function useF(f, k0) {
  const ctx = useContext(EntryCtx); const k = k0 || ctx
  const d = useEntry(k)
  return [d[f] ?? '', (v) => setField(k, f, v), d]
}

export function T({ f, ph, k, className = '', ...r }) {
  const [v, set] = useF(f, k)
  return <input className={'in ' + className} value={v} placeholder={ph} onChange={(e) => set(e.target.value)} {...r} />
}
export function A({ f, ph, k, rows = 3, className = '' }) {
  const [v, set] = useF(f, k)
  const ref = useRef()
  useEffect(() => { const el = ref.current; if (el) { el.style.height = 'auto'; el.style.height = Math.max(el.scrollHeight, rows * 22 + 16) + 'px' } }, [v, rows])
  return <textarea ref={ref} className={'in ta ' + className} value={v} placeholder={ph} rows={rows} onChange={(e) => set(e.target.value)} />
}
export function N({ f, ph = '0', k, className = '', money }) {
  const [v, set] = useF(f, k)
  return (
    <span className={'numw ' + (money ? 'money ' : '') + className}>
      {money && <i>R$</i>}
      <input className="in num" inputMode="decimal" value={v} placeholder={ph} onChange={(e) => set(e.target.value.replace(/[^\d.,-]/g, ''))} />
    </span>
  )
}
export function C({ f, k, label, children }) {
  const [v, set] = useF(f, k)
  return (
    <label className={'ck' + (v ? ' on' : '')}>
      <input type="checkbox" checked={!!v} onChange={(e) => set(e.target.checked)} />
      <span className="box"><Ic n="check" s={12} w={3} /></span>
      {(label || children) && <span className="ckl">{label ? <Md t={label} /> : children}</span>}
    </label>
  )
}
export function S({ f, k, opts, className = '', free = true }) {
  const [v, set] = useF(f, k)
  if (free) {
    const id = 'dl-' + opts.join('').length
    return <><input className={'in sel ' + className} list={id} value={v} placeholder="formato" onChange={(e) => set(e.target.value)} /><datalist id={id}>{opts.filter(Boolean).map((o) => <option key={o} value={o} />)}</datalist></>
  }
  return <select className={'in sel ' + className} value={v} onChange={(e) => set(e.target.value)}>{opts.map((o) => <option key={o} value={o}>{o || '—'}</option>)}</select>
}

export function Checklist({ f, itens, k }) {
  return <div className="cl">{itens.map((it, i) => <C key={i} f={`${f}.${i}`} k={k} label={it} />)}</div>
}

// tabela com linhas que a pessoa pode adicionar
export function Rows({ f, cols, min = 3, k, add = 'Adicionar linha', seed }) {
  const [v, set] = useF(f, k)
  const rows = Array.isArray(v) ? v : (seed || [])
  const shown = Math.max(rows.length, min)
  const upd = (i, c, val) => { const nr = [...rows]; while (nr.length <= i) nr.push({}); nr[i] = { ...nr[i], [c]: val }; set(nr) }
  const atual = useRef(rows); atual.current = rows
  const del = (i) => {
    const tirada = rows[i]; set(rows.filter((_, j) => j !== i))
    const vazia = !tirada || !Object.values(tirada).some((x) => x !== '' && x !== false && x != null)
    if (!vazia) toast('Linha apagada', ['Desfazer', () => { const nr = [...atual.current]; nr.splice(Math.min(i, nr.length), 0, tirada); set(nr) }])
  }
  return (
    <div className="rows">
      <div className="rows-h" style={{ gridTemplateColumns: cols.map((c) => c.w || '1fr').join(' ') + ' 28px' }}>
        {cols.map((c) => <span key={c.k}>{c.l}</span>)}<span />
      </div>
      {Array.from({ length: shown }).map((_, i) => {
        const r = rows[i] || {}
        return (
          <div className="rows-r" key={i} style={{ gridTemplateColumns: cols.map((c) => c.w || '1fr').join(' ') + ' 28px' }}>
            {cols.map((c) => {
              const val = r[c.k] ?? ''
              if (c.t === 'check') return <label key={c.k} className={'ck sm' + (val ? ' on' : '')}><input type="checkbox" checked={!!val} onChange={(e) => upd(i, c.k, e.target.checked)} /><span className="box"><Ic n="check" s={11} w={3} /></span><span className="ckl only-m">{c.l}</span></label>
              if (c.t === 'select') return <select key={c.k} className="in sel" value={val} onChange={(e) => upd(i, c.k, e.target.value)}>{c.opts.map((o) => <option key={o} value={o}>{o || c.l}</option>)}</select>
              if (c.t === 'date') return <input key={c.k} type="date" className="in" value={val} onChange={(e) => upd(i, c.k, e.target.value)} aria-label={c.l} />
              if (c.t === 'money' || c.t === 'num') return <span key={c.k} className={'numw ' + (c.t === 'money' ? 'money' : '')}>{c.t === 'money' && <i>R$</i>}<input className="in num" inputMode="decimal" value={val} placeholder="0" onChange={(e) => upd(i, c.k, e.target.value.replace(/[^\d.,-]/g, ''))} /></span>
              return <input key={c.k} className="in" value={val} placeholder={c.ph || c.l} onChange={(e) => upd(i, c.k, e.target.value)} />
            })}
            {i < rows.length ? <button className="rdel" onClick={() => del(i)} aria-label="Apagar linha"><Ic n="trash" s={14} /></button> : <span />}
          </div>
        )
      })}
      <button className="addrow" onClick={() => set([...rows, ...Array(Math.max(0, shown - rows.length)).fill({}), {}])}><Ic n="plus" s={14} w={2.4} /> {add}</button>
    </div>
  )
}
export const sumRows = (rows, c, filter) => (Array.isArray(rows) ? rows : []).filter((r) => !filter || filter(r)).reduce((s, r) => s + num(r[c]), 0)

// ------------------------------------------------------------------ blocos visuais
export function Head({ icon = 'spark', title, sub, kicker, color = 'var(--pink)', back }) {
  const ano = useAno()
  return (
    <header className="ph">
      {back && <Link to={back} className="back"><Ic n="left" s={18} w={2.2} /></Link>}
      <div className="ava" style={{ '--c': color }}><div><Ic n={icon} s={20} /></div></div>
      <div className="ph-t">
        <div className="handle">planner.do.criador · {ano} {kicker && <span className="kick" style={{ background: color }}>{kicker}</span>}</div>
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
    </header>
  )
}
// Card. Com "fold", o título vira um botão que abre e fecha a parte (lembra a escolha enquanto o app está aberto)
const dobras = {}
export function Card({ title, icon, color, children, className = '', fold, aberto = true, resumo, id }) {
  const chave = id || title
  const [open, setOpen] = useState(fold ? (dobras[chave] ?? aberto) : true)
  const troca = () => { dobras[chave] = !open; setOpen(!open) }
  return (
    <section className={'card ' + className + (fold ? ' fold' + (open ? ' on' : '') : '')}>
      {title && (fold
        ? <h3 className="ch"><button className="ch-b" style={{ color }} onClick={troca} aria-expanded={open}>{icon && <Ic n={icon} s={16} />}<span>{title}</span>{resumo && <em className="ch-r">{resumo}</em>}<Ic n="chev" s={16} w={2.4} /></button></h3>
        : <h3 className="ch" style={{ color }}>{icon && <Ic n={icon} s={16} />}<span>{title}</span></h3>)}
      {open && children}
    </section>
  )
}

// ------------------------------------------------------------------ avisos rápidos (com "Desfazer")
let ouvintes = []
export function toast(texto, acao) { ouvintes.forEach((f) => f({ texto, acao, id: Date.now() })) }
export function Toasts() {
  const [t, setT] = useState(null)
  useEffect(() => { const f = (x) => setT(x); ouvintes.push(f); return () => { ouvintes = ouvintes.filter((g) => g !== f) } }, [])
  useEffect(() => { if (!t) return; const id = setTimeout(() => setT(null), 6000); return () => clearTimeout(id) }, [t])
  if (!t) return null
  return (
    <div className="toast" role="status">
      <span>{t.texto}</span>
      {t.acao && <button onClick={() => { t.acao[1](); setT(null) }}>{t.acao[0] === 'Desfazer' && <Ic n="undo" s={15} w={2.2} />} {t.acao[0]}</button>}
    </div>
  )
}

// botão "ver exemplo": preenche só o que ainda está vazio
export function Exemplo({ onFill, children = 'Ver um exemplo' }) {
  return <button className="exemplo" onClick={onFill}><Ic n="spark" s={14} /> {children}</button>
}
export function Field({ label, children, hl }) {
  return <div className="fld"><div className={'lbl' + (hl ? ' hl' : '')}>{label}</div>{children}</div>
}
export function Tip({ k, children, color }) {
  return <div className="tip"><span className="tip-k" style={color ? { background: color } : null}>{k}</span><span>{children}</span></div>
}
export function Tweet({ text }) {
  return (
    <div className="tweet"><div className="tw-a" /><div>
      <div className="tw-h"><b>Planner do Criador</b><span className="vf"><Ic n="check" s={9} w={3.4} /></span><span className="mut">@planner.do.criador</span></div>
      <div className="tw-t">{text}</div>
      <div className="tw-f"><Ic n="comment" s={14} /><span>48</span><Ic n="loop" s={14} /><span>312</span><Ic n="heart" s={14} /><span>2,1 mil</span></div>
    </div></div>
  )
}
export function Stat({ icon, label, value, color }) {
  return <div className="stat" style={{ '--c': color }}><div className="stat-i"><Ic n={icon} s={16} /></div><span>{label}</span><b>{value}</b></div>
}
export function Calc({ value, money }) { return <span className={'calc' + (money ? ' money' : '')}>{value}</span> }
