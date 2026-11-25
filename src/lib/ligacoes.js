// Liga as telas: o que a pessoa registra numa tela vira o próximo passo na outra
// (frase do público → gancho, roteiro → editorial, porta em porta e proposta → contrato)
import { getEntry, setField, getAno } from './store'
import { MESES, mesesDoAno, diasDoMes } from '../data/content'
import { lista } from './financeiro'

const cheia = (r) => r && Object.values(r).some((v) => v !== '' && v !== false && v != null)

// o mês de hoje dentro do ano aberto (ou o primeiro mês do ano, se for outro ano)
export function mesDeHoje() {
  const ano = getAno(); const vis = mesesDoAno(ano); const h = new Date()
  return vis.find((m) => m.n === h.getMonth() + 1 && h.getFullYear() === ano) || vis[0]
}

// novo roteiro no mês (vai para o fim da lista, sem as linhas vazias)
export function novoRoteiro(mk, r) {
  const k = `${mk}.rot`; const atual = lista(getEntry(k).lista).filter(cheia)
  setField(k, 'lista', [...atual, { status: 'Ideia', ...r }])
  return atual.length + 1
}

// primeiro dia livre no Editorial a partir de hoje (ou do dia 1, em outro mês)
export function proximoDiaLivre(m) {
  const ano = getAno(); const h = new Date()
  const ini = h.getFullYear() === ano && h.getMonth() + 1 === m.n ? h.getDate() : 1
  const ed = getEntry(`${m.k}.ed`)
  for (let d = ini; d <= diasDoMes(m.n, ano); d++) if (!ed[`${d}.ideia`]) return d
  return null
}

// data do roteiro: aceita 2026-11-25, 25/11 ou 25/11/2026
export function lerData(s) {
  s = String(s || '').trim(); let m
  if ((m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/))) return { ano: +m[1], mes: +m[2], dia: +m[3] }
  if ((m = s.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/))) return { ano: m[3] ? (m[3].length === 2 ? 2000 + +m[3] : +m[3]) : getAno(), mes: +m[2], dia: +m[1] }
  return null
}

// roteiro com data: coloca no Editorial e marca gravado/postado conforme o status
export function sincronizarRoteiro(r) {
  const dt = lerData(r.data); if (!dt || dt.ano !== getAno() || dt.mes < 1 || dt.mes > 12) return null
  const m = MESES[dt.mes - 1]; if (!mesesDoAno(getAno()).includes(m) || dt.dia < 1 || dt.dia > diasDoMes(m.n, getAno())) return null
  const k = `${m.k}.ed`; const ed = getEntry(k)
  if (r.titulo && !ed[`${dt.dia}.ideia`]) setField(k, `${dt.dia}.ideia`, r.titulo)
  if (r.fmt && !ed[`${dt.dia}.fmt`]) setField(k, `${dt.dia}.fmt`, r.fmt)
  if (r.dor && !ed[`${dt.dia}.dor`]) setField(k, `${dt.dia}.dor`, r.dor)
  if (['Gravado', 'Editado', 'Postado'].includes(r.status) && !ed[`${dt.dia}.grav`]) setField(k, `${dt.dia}.grav`, true)
  if (r.status === 'Postado' && !ed[`${dt.dia}.post`]) setField(k, `${dt.dia}.post`, true)
  return { m, dia: dt.dia }
}

// contrato novo no Negócio do mês de hoje
export function novoContrato(c) {
  const m = mesDeHoje(); const k = `${m.k}.neg`
  setField(k, 'contratos', [...lista(getEntry(k).contratos).filter(cheia), { cli: '', srv: '', val: '', venc: '', pago: false, rep: false, ...c }])
  return m
}
