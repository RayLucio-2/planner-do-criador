import { getEntry, num, getAno } from './store'
import { mesesDoAno } from '../data/content'
import { MESES, diasDoMes } from '../data/content'
import { sumRows } from '../components/ui'

export function mesStats(m) {
  const an = getEntry(`${m}.an`), neg = getEntry(`${m}.neg`), eq = getEntry('escada'), v = getEntry(`${m}.visao`), ed = getEntry(`${m}.ed`)
  const ent = sumRows(neg.contratos, 'val')
  const rec = sumRows(neg.contratos, 'val', (r) => r.pago)
  const gas = sumRows(neg.gastos, 'val')
  const pro = num(neg.prolabore), res = num(neg.reserva), meta = num(neg.meta)
  const cx = ent * num(eq.pct) / 100
  const n = MESES.find((x) => x.k === m).n
  let postados = 0, gravados = 0, planejados = 0
  for (let d = 1; d <= diasDoMes(n, getAno()); d++) {
    if (ed[`${d}.post`]) postados++
    if (ed[`${d}.grav`]) gravados++
    if (ed[`${d}.ideia`]) planejados++
  }
  return {
    // se a pessoa não digitou, usa o que já está registrado: postados do Editorial e contratos do Negócio
    pub: an['pub.real'] !== undefined && an['pub.real'] !== '' ? num(an['pub.real']) : postados, alc: num(an['alc.real']), seg: num(an['seg.real']),
    con: an['con.real'] !== undefined && an['con.real'] !== '' ? num(an['con.real']) : (Array.isArray(neg.contratos) ? neg.contratos.filter((r) => r.cli || num(r.val)).length : 0),
    msg: num(an['msg.real']), props: Array.isArray(neg.props) ? neg.props.filter((p) => p.cli || num(p.val)).length : 0,
    ent, rec, gas, cx, pro, res, meta, arec: ent - rec, sob: ent - gas - cx - num(neg.parc) - pro - res,
    panf: num(v['pro.panf']), conv: num(v['pro.conv']), postados, gravados, planejados,
  }
}
export function anoStats(meses = mesesDoAno(getAno()).map((m) => m.k)) {
  const t = { pub: 0, alc: 0, seg: 0, con: 0, ent: 0, rec: 0, gas: 0, pro: 0, res: 0, cx: 0, sob: 0, panf: 0, conv: 0, postados: 0, msg: 0, props: 0 }
  for (const m of meses) { const s = mesStats(m); for (const k in t) t[k] += s[k] }
  return t
}
