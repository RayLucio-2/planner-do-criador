import { getEntry, num, getAno } from './store'
import { mesesDoAno } from '../data/content'
import { MESES, diasDoMes } from '../data/content'
import { sumRows } from '../components/ui'

export function mesStats(m) {
  const an = getEntry(`${m}.an`), neg = getEntry(`${m}.neg`), eq = getEntry('escada'), v = getEntry(`${m}.visao`), ed = getEntry(`${m}.ed`)
  const ent = sumRows(neg.contratos, 'val')
  const rec = sumRows(neg.contratos, 'val', (r) => r.pago)
  const gas = sumRows(neg.gastos, 'val')
  const cx = ent * num(eq.pct) / 100
  const n = MESES.find((x) => x.k === m).n
  let postados = 0, gravados = 0, planejados = 0
  for (let d = 1; d <= diasDoMes(n, getAno()); d++) {
    if (ed[`${d}.post`]) postados++
    if (ed[`${d}.grav`]) gravados++
    if (ed[`${d}.ideia`]) planejados++
  }
  return {
    pub: num(an['pub.real']), alc: num(an['alc.real']), seg: num(an['seg.real']), con: num(an['con.real']),
    ent, rec, gas, cx, sob: ent - gas - cx - num(neg.parc),
    panf: num(v['pro.panf']), conv: num(v['pro.conv']), postados, gravados, planejados,
  }
}
export function anoStats(meses = mesesDoAno(getAno()).map((m) => m.k)) {
  const t = { pub: 0, alc: 0, seg: 0, con: 0, ent: 0, cx: 0, sob: 0, panf: 0, conv: 0, postados: 0 }
  for (const m of meses) { const s = mesStats(m); for (const k in t) t[k] += s[k] }
  return t
}
