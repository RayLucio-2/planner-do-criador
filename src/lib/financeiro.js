// Contas do financeiro do Planner do Criador: categorias, a receber, propostas e o ano
import { MESES, mesesDoAno } from '../data/content'
import { getEntry, getEntryAno, num, getAno } from './store'

export const CATEGORIAS = ['', 'Equipamento', 'Software e apps', 'Internet e celular', 'Transporte', 'Anúncios', 'Impressão e panfletos', 'Cursos', 'Impostos e taxas', 'Alimentação', 'Outros']
export const STATUS_PROP = ['', 'Enviada', 'Negociando', 'Fechada', 'Perdida']

// sugere a categoria pelo nome do lançamento (usado na importação do extrato)
const PISTAS = [
  ['Software e apps', /adobe|capcut|canva|spotify|google|apple\.com|icloud|microsoft|notion|chatgpt|openai|lightroom|figma|envato|epidemic/i],
  ['Internet e celular', /vivo|claro|tim\b|oi\b|internet|net\b|fibra|telefon/i],
  ['Transporte', /uber|99\s?(app|pop|taxi)?|posto|combust|gasolina|estaciona|ipiranga|shell|br mania/i],
  ['Anúncios', /facebook|meta\s?ads|instagram|tiktok|google\s?ads|impulsion/i],
  ['Equipamento', /kabum|magalu|magazine|amazon|mercado ?livre|americanas|casas bahia|fast shop|terabyte|pichau/i],
  ['Impressão e panfletos', /gr[aá]fica|impress|printi|panflet|xerox|copiadora/i],
  ['Impostos e taxas', /das\b|simples nacional|imposto|tarifa|iof|anuidade|receita federal/i],
  ['Cursos', /hotmart|kiwify|eduzz|udemy|curso|domestika|alura/i],
  ['Alimentação', /ifood|restaurante|lanchonete|padaria|caf[eé]|burger|pizza/i],
]
export const sugerirCategoria = (t) => (PISTAS.find(([, r]) => r.test(t || '')) || ['Outros'])[0]

const hojeISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
export const lista = (v) => (Array.isArray(v) ? v : [])

// situação de um contrato: pago, atrasado, vence hoje, a vencer ou sem data
export function situacao(r) {
  if (r.pago) return 'pago'
  if (!r.venc) return 'sem-data'
  const h = hojeISO()
  return r.venc < h ? 'atrasado' : r.venc === h ? 'hoje' : 'a-vencer'
}

// mês anterior (para copiar o que é fixo): em janeiro, olha dezembro do ano anterior
export function mesAnterior(m, ano = getAno()) {
  if (m.n > 1) { const p = MESES[m.n - 2]; return getEntry(`${p.k}.neg`) }
  return getEntryAno('dez.neg', ano - 1)
}
// avança a data de vencimento em 1 mês (mantém o dia; 31 vira o último dia do mês)
export function maisUmMes(iso) {
  if (!iso) return ''
  const [y, mo, d] = iso.split('-').map(Number)
  const ult = new Date(y, mo + 1, 0).getDate()
  const nd = new Date(y, mo, Math.min(d, ult))
  return `${nd.getFullYear()}-${String(nd.getMonth() + 1).padStart(2, '0')}-${String(nd.getDate()).padStart(2, '0')}`
}

// tudo do ano, para a página Financeiro e a planilha
export function anoFinanceiro(ano = getAno()) {
  const meses = mesesDoAno(ano)
  const out = { meses: [], clientes: {}, cats: {}, aReceber: [], props: { env: 0, fech: 0, perd: 0, negoc: 0, valNeg: 0, valFech: 0 } }
  for (const m of meses) {
    const neg = getEntry(`${m.k}.neg`)
    const contratos = lista(neg.contratos).filter((r) => num(r.val) || r.cli)
    const gastos = lista(neg.gastos).filter((r) => num(r.val) || r.item)
    const ent = contratos.reduce((s, r) => s + num(r.val), 0)
    out.meses.push({ m, ent, n: contratos.length, gas: gastos.reduce((s, r) => s + num(r.val), 0), meta: num(neg.meta) })
    for (const r of contratos) {
      if (r.cli) { const k = r.cli.trim(); out.clientes[k] = (out.clientes[k] || 0) + num(r.val) }
      if (!r.pago && num(r.val)) out.aReceber.push({ ...r, m, sit: situacao(r) })
    }
    for (const r of gastos) { const c = r.cat || 'Sem categoria'; out.cats[c] = (out.cats[c] || 0) + num(r.val) }
    for (const p of lista(neg.props)) {
      if (!p.cli && !num(p.val)) continue
      out.props.env++
      if (p.st === 'Fechada') { out.props.fech++; out.props.valFech += num(p.val) }
      else if (p.st === 'Perdida') out.props.perd++
      else { out.props.negoc++; out.props.valNeg += num(p.val) }
    }
  }
  out.aReceber.sort((a, b) => (a.venc || '9999').localeCompare(b.venc || '9999'))
  return out
}

// planilha (CSV com ; para abrir certinho no Excel e no Google Planilhas em português)
export function csvDoAno(ano = getAno()) {
  const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const br = (iso) => iso ? iso.split('-').reverse().join('/') : ''
  const linhas = [['Mês', 'Tipo', 'Descrição', 'Serviço ou categoria', 'Vencimento', 'Valor', 'Pago', 'Fixo'].map(q).join(';')]
  for (const m of mesesDoAno(ano)) {
    const neg = getEntry(`${m.k}.neg`)
    for (const r of lista(neg.contratos)) if (r.cli || num(r.val)) linhas.push([m.nome, 'Entrada', r.cli, r.srv, br(r.venc), num(r.val).toFixed(2).replace('.', ','), r.pago ? 'sim' : 'não', r.rep ? 'sim' : ''].map(q).join(';'))
    for (const r of lista(neg.gastos)) if (r.item || num(r.val)) linhas.push([m.nome, 'Gasto', r.item, r.cat, '', num(r.val).toFixed(2).replace('.', ','), '', r.rep ? 'sim' : ''].map(q).join(';'))
    if (num(neg.prolabore)) linhas.push([m.nome, 'Pró-labore', 'Pró-labore', '', '', num(neg.prolabore).toFixed(2).replace('.', ','), '', ''].map(q).join(';'))
  }
  return '﻿' + linhas.join('\r\n')
}
