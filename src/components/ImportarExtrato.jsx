// Importa extrato bancário ou fatura do cartão (arquivos CSV ou OFX exportados pelo banco)
// para "Gastos do negócio" e "Contratos e entradas" do mês. O arquivo é lido só no aparelho.
import { useState } from 'react'
import { Ic, Card } from './ui'
import { useEntry, setField, brl, useAno } from '../lib/store'
import { sugerirCategoria } from '../lib/financeiro'

// ------------------------------------------------------------------ leitura do arquivo
async function lerTexto(file) {
  const buf = await file.arrayBuffer()
  try { return new TextDecoder('utf-8', { fatal: true }).decode(buf) } catch { return new TextDecoder('windows-1252').decode(buf) }
}

function valorDe(s) {
  let t = String(s ?? '').replace(/R\$|\s/g, '').trim()
  if (!t) return NaN
  let neg = false
  if (/^\(.*\)$/.test(t)) { neg = true; t = t.slice(1, -1) }
  if (t.endsWith('-')) { neg = true; t = t.slice(0, -1) }
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.')
  const n = parseFloat(t)
  return isNaN(n) ? NaN : (neg ? -Math.abs(n) : n)
}

function dataDe(s) {
  const t = String(s ?? '').trim()
  let m = t.match(/^(\d{2})\/(\d{2})\/(\d{2,4})/)
  if (m) return { d: +m[1], m: +m[2], a: m[3].length === 2 ? 2000 + +m[3] : +m[3] }
  m = t.match(/^(\d{4})-(\d{2})-(\d{2})/) || t.match(/^(\d{4})(\d{2})(\d{2})/)
  if (m) return { d: +m[3], m: +m[2], a: +m[1] }
  return null
}

function lerOFX(txt) {
  const tag = (bloco, nome) => { const r = bloco.match(new RegExp(`<${nome}>([^<\\r\\n]*)`, 'i')); return r ? r[1].trim() : '' }
  return txt.split(/<STMTTRN>/i).slice(1).map((b) => ({
    data: dataDe(tag(b, 'DTPOSTED')),
    valor: valorDe(tag(b, 'TRNAMT')),
    desc: tag(b, 'MEMO') || tag(b, 'NAME') || 'Lançamento',
  }))
}

function dividir(linha, sep) {
  const out = []; let cur = ''; let q = false
  for (let i = 0; i < linha.length; i++) {
    const c = linha[i]
    if (c === '"') { if (q && linha[i + 1] === '"') { cur += '"'; i++ } else q = !q }
    else if (c === sep && !q) { out.push(cur); cur = '' }
    else cur += c
  }
  out.push(cur); return out.map((x) => x.trim())
}

function lerCSV(txt) {
  const linhas = txt.split(/\r?\n/).filter((l) => l.trim())
  if (!linhas.length) return []
  const sep = (linhas[0].match(/;/g) || []).length >= (linhas[0].match(/,/g) || []).length ? ';' : ','
  const tab = linhas.map((l) => dividir(l, sep))
  // acha a linha de cabeçalho (a primeira que fala de data e de valor)
  let h = tab.findIndex((r) => r.some((c) => /^(data|date)/i.test(c)) && r.some((c) => /(valor|amount|value|quantia)/i.test(c)))
  let iData, iValor, iDesc
  if (h >= 0) {
    const cab = tab[h].map((c) => c.toLowerCase())
    iData = cab.findIndex((c) => /^(data|date)/.test(c))
    iValor = cab.findIndex((c) => /(valor|amount|value|quantia)/.test(c) && !/saldo/.test(c))
    iDesc = cab.findIndex((c) => /(descri|title|t[ií]tulo|hist[oó]rico|estabelec|lan[cç]amento|memo|nome)/.test(c))
  } else {
    h = -1; const r = tab[0]
    iData = r.findIndex((c) => dataDe(c)); iValor = r.findIndex((c, i) => i !== iData && !isNaN(valorDe(c)))
    iDesc = r.findIndex((_, i) => i !== iData && i !== iValor)
  }
  if (iData < 0 || iValor < 0) return []
  return tab.slice(h + 1).map((r) => ({ data: dataDe(r[iData]), valor: valorDe(r[iValor]), desc: (iDesc >= 0 && r[iDesc]) || r.filter((_, i) => i !== iData && i !== iValor).join(' ') || 'Lançamento' }))
}

const fmt = (n) => Math.abs(n).toFixed(2).replace('.', ',')
const p2 = (n) => String(n).padStart(2, '0')

// ------------------------------------------------------------------ componente
export default function ImportarExtrato({ m }) {
  const ano = useAno(); const k = `${m.k}.neg`; const e = useEntry(k)
  const [lista, setLista] = useState(null); const [msg, setMsg] = useState(null); const [tipo, setTipo] = useState('extrato')

  async function abrir(ev, t) {
    const f = ev.target.files?.[0]; ev.target.value = ''
    if (!f) return
    setTipo(t); setMsg(null)
    if (/\.pdf$/i.test(f.name)) { setMsg({ erro: true, t: 'PDF não dá para ler. No app ou site do banco, exporte o extrato ou a fatura em CSV ou OFX.' }); return }
    const txt = await lerTexto(f)
    let itens = /<OFX>|<STMTTRN>/i.test(txt) ? lerOFX(txt) : lerCSV(txt)
    itens = itens.filter((x) => x.data && !isNaN(x.valor) && x.valor !== 0)
    if (!itens.length) { setMsg({ erro: true, t: 'Não encontrei lançamentos nesse arquivo. Use o CSV ou OFX exportado pelo banco.' }); return }
    // fatura: compras são a maioria; se vierem negativas (OFX), inverte o sinal
    if (t === 'fatura' && itens.filter((x) => x.valor < 0).length > itens.length / 2) itens = itens.map((x) => ({ ...x, valor: -x.valor }))
    const doMes = itens.filter((x) => x.data.m === m.n && x.data.a === ano)
    const fora = itens.length - doMes.length
    const ja = new Set([...(Array.isArray(e.gastos) ? e.gastos : []), ...(Array.isArray(e.contratos) ? e.contratos : [])].map((r) => r.ref).filter(Boolean))
    const prontos = doMes.map((x, i) => {
      const gasto = t === 'fatura' ? x.valor > 0 : x.valor < 0
      const ref = `${x.data.a}${p2(x.data.m)}${p2(x.data.d)}|${x.valor}|${x.desc}`
      const ignorar = t === 'fatura' && !gasto   // pagamento da fatura ou estorno
      return { ...x, i, gasto, ref, repetido: ja.has(ref), ignorar, ok: gasto && !ja.has(ref) && !ignorar }
    })
    if (!prontos.length) { setMsg({ erro: true, t: `Nenhum lançamento de ${m.nome.toLowerCase()} de ${ano} nesse arquivo${fora ? ` (${fora} são de outros meses: abra o mês certo para importar)` : ''}.` }); return }
    setLista(prontos)
    if (fora) setMsg({ t: `${fora} ${fora === 1 ? "lançamento de outro mês ficou" : "lançamentos de outros meses ficaram"} de fora. Para importá-los, abra o mês deles e use o mesmo arquivo.` })
  }

  function importar() {
    const sel = lista.filter((x) => x.ok)
    const limpa = (rows) => (Array.isArray(rows) ? rows : []).filter((r) => Object.values(r).some((v) => v !== '' && v !== false && v != null))
    const gastos = sel.filter((x) => x.gasto).map((x) => ({ item: `${p2(x.data.d)}/${p2(x.data.m)} ${x.desc}`, cat: sugerirCategoria(x.desc), val: fmt(x.valor), ref: x.ref }))
    const entradas = sel.filter((x) => !x.gasto).map((x) => ({ cli: x.desc, srv: tipo === 'fatura' ? 'Fatura do cartão' : 'Extrato bancário', val: fmt(x.valor), pago: true, ref: x.ref }))
    if (gastos.length) setField(k, 'gastos', [...limpa(e.gastos), ...gastos])
    if (entradas.length) setField(k, 'contratos', [...limpa(e.contratos), ...entradas])
    setLista(null)
    setMsg({ t: `Pronto! ${gastos.length} ${gastos.length === 1 ? 'gasto' : 'gastos'}${entradas.length ? ` e ${entradas.length} ${entradas.length === 1 ? 'entrada' : 'entradas'}` : ''} importados. Confira abaixo.` })
  }

  const marcar = (i) => setLista(lista.map((x) => x.i === i ? { ...x, ok: !x.ok } : x))
  const todos = (v) => setLista(lista.map((x) => ({ ...x, ok: v && !x.ignorar && !x.repetido })))
  const nSel = lista ? lista.filter((x) => x.ok).length : 0

  return (
    <Card title="Importar extrato ou fatura" icon="upload" color={m.cor}>
      {!lista ? <>
        <p className="mut sm">Puxe os lançamentos do banco para este mês em vez de digitar um por um. Use o arquivo <b>CSV ou OFX</b> que o app ou o site do banco exporta (PDF não funciona). O arquivo é lido só no seu aparelho.</p>
        <div className="g2 tight">
          <label className="btn ghost"><Ic n="coin" s={16} /> Extrato da conta<input type="file" accept=".csv,.ofx,.txt,text/csv" hidden onChange={(ev) => abrir(ev, 'extrato')} /></label>
          <label className="btn ghost"><Ic n="flyer" s={16} /> Fatura do cartão<input type="file" accept=".csv,.ofx,.txt,text/csv" hidden onChange={(ev) => abrir(ev, 'fatura')} /></label>
        </div>
      </> : <>
        <p className="mut sm">Marque só o que é do seu trabalho. Saídas vão para <b>Gastos do negócio</b>; entradas, para <b>Contratos e entradas</b>.</p>
        <div className="imp-top"><button className="link sm" onClick={() => todos(true)}>marcar todos</button><button className="link sm" onClick={() => todos(false)}>desmarcar todos</button></div>
        <div className="imp-l">
          {lista.map((x) => (
            <label key={x.i} className={'imp-r' + (x.ok ? ' on' : '') + (x.ignorar || x.repetido ? ' off' : '')}>
              <input type="checkbox" checked={x.ok} disabled={x.ignorar} onChange={() => marcar(x.i)} />
              <span className="imp-d">{p2(x.data.d)}/{p2(x.data.m)}</span>
              <span className="imp-t">{x.desc}{x.repetido && <em> · já importado</em>}{x.ignorar && <em> · pagamento ou estorno</em>}</span>
              <b className={x.gasto ? 'neg' : 'pos'}>{x.gasto ? '-' : '+'}{brl(Math.abs(x.valor))}</b>
            </label>
          ))}
        </div>
        <div className="g2 tight">
          <button className="btn" disabled={!nSel} onClick={importar}>Importar {nSel} {nSel === 1 ? 'lançamento' : 'lançamentos'}</button>
          <button className="btn ghost" onClick={() => { setLista(null); setMsg(null) }}>Cancelar</button>
        </div>
      </>}
      {msg && <p className={'note' + (msg.erro ? ' err' : '')}>{msg.t}</p>}
    </Card>
  )
}
