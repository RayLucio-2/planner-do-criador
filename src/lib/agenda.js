// Link para criar um lembrete no Google Agenda (abre a tela de novo evento já preenchida).
// Evento das 9h às 9h30 no horário de Brasília, para o Google Agenda avisar no celular.
const p2 = (n) => String(n).padStart(2, '0')
export function linkAgenda({ ano, mes, dia, titulo, detalhes = '', hora = 9, minutos = 30 }) {
  const ini = `${ano}${p2(mes)}${p2(dia)}T${p2(hora)}0000`
  const fimMin = hora * 60 + minutos
  const fim = `${ano}${p2(mes)}${p2(dia)}T${p2(Math.floor(fimMin / 60))}${p2(fimMin % 60)}00`
  const q = new URLSearchParams({ action: 'TEMPLATE', text: titulo, dates: `${ini}/${fim}`, details: detalhes, ctz: 'America/Sao_Paulo' })
  return `https://calendar.google.com/calendar/render?${q.toString()}`
}
