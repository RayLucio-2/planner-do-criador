// Financeiro: atalho para o dinheiro do ano inteiro (a receber, metas, clientes, gastos, propostas e planilha)
import { Link } from 'react-router-dom'
import { Ic, Head, Card, Stat } from '../../components/ui'
import { useStoreVersion, useAno, brl, int, num } from '../../lib/store'
import { mesesDoAno } from '../../data/content'
import { anoStats, mesStats } from '../../lib/calc'
import { anoFinanceiro, csvDoAno } from '../../lib/financeiro'
import { ReceberLista } from './Mes'

export default function Financeiro() {
  useStoreVersion()
  const ano = useAno(); const meses = mesesDoAno(ano)
  const hoje = new Date(); const atual = meses.find((x) => x.n === hoje.getMonth() + 1 && hoje.getFullYear() === ano) || meses[0]
  const t = anoStats(); const f = anoFinanceiro(ano); const sm = mesStats(atual.k)
  const contratos = f.meses.reduce((s, x) => s + x.n, 0)
  const ticket = contratos ? t.ent / contratos : 0
  const forte = [...f.meses].sort((a, b) => b.ent - a.ent)[0]
  const maxEnt = Math.max(1, ...f.meses.map((x) => x.ent))
  const clientes = Object.entries(f.clientes).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const cats = Object.entries(f.cats).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])
  const atrasados = f.aReceber.filter((r) => r.sit === 'atrasado')
  const p = f.props; const decid = p.fech + p.perd
  function baixar() {
    const blob = new Blob([csvDoAno(ano)], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `financeiro-planner-${ano}.csv`; a.click()
  }
  return (
    <div className="page">
      <Head icon="coin" title="Financeiro" sub={`O dinheiro do seu trabalho em ${ano}`} color="#10B981" />
      <Link to={`/app/mes/${atual.k}/negocio`} className="fin-atual" style={{ '--c': atual.cor }}>
        <span className="fin-k"><Ic n="cal" s={13} /> {atual.nome.toLowerCase()}</span>
        <b>{brl(sm.ent)}{sm.meta > 0 && <span> de {brl(sm.meta)}</span>}</b>
        {sm.meta > 0 && <div className="prog big"><i style={{ width: Math.min(100, sm.ent / sm.meta * 100) + '%' }} /></div>}
        <span className="fin-cta">Abrir contratos, gastos e propostas do mês <Ic n="right" s={14} w={2.4} /></span>
      </Link>

      <div className="stats">
        <Stat icon="coin" label="Entradas no ano" value={brl(t.ent)} color="#3B82F6" />
        <Stat icon="flyer" label="Gastos no ano" value={brl(t.gas)} color="#E11D48" />
        <Stat icon="user" label="Pró-labore no ano" value={brl(t.pro)} color="#EC4899" />
        <Stat icon="trophy" label="Ticket médio" value={brl(ticket)} color="#8B5CF6" />
      </div>

      <Card title={`A receber · ${brl(f.aReceber.reduce((s, r) => s + num(r.val), 0))}`} icon="bell" color="#F59E0B">
        {atrasados.length > 0 && <p className="note err">{atrasados.length} {atrasados.length === 1 ? 'pagamento atrasado' : 'pagamentos atrasados'}. Toque no 🔔 para criar o lembrete de cobrança.</p>}
        {f.aReceber.length ? <ReceberLista itens={f.aReceber} comMes /> : <p className="mut sm">Nada pendente. Coloque a data de vencimento nos contratos para acompanhar aqui.</p>}
      </Card>

      <Card title="Entradas mês a mês" icon="chart" color="#3B82F6">
        <div className="fin-bars">{f.meses.map((x) => (
          <Link key={x.m.k} to={`/app/mes/${x.m.k}/negocio`} className="fin-bar" title={`${x.m.nome}: ${brl(x.ent)}`}>
            <div className="fin-bar-c">{x.meta > 0 && <em style={{ bottom: Math.min(100, x.meta / Math.max(maxEnt, x.meta) * 100) + '%' }} />}<i style={{ height: (x.ent / Math.max(maxEnt, x.meta || 0) * 100) + '%', background: x.m.cor }} /></div><span>{x.m.k}</span>
          </Link>
        ))}</div>
        {forte && forte.ent > 0 && <p className="mut sm">Mês mais forte: <b>{forte.m.nome}</b>, com {brl(forte.ent)}. A linha tracejada é a meta de cada mês.</p>}
      </Card>

      <div className="g2">
        <Card title="Melhores clientes" icon="users" color="#10B981">
          {clientes.length ? clientes.map(([c, v], i) => <div key={c} className="kv"><span><b>{i + 1}.</b> {c}</span><b>{brl(v)}</b></div>) : <p className="mut sm">Aparece quando você preencher os contratos.</p>}
        </Card>
        <Card title="Propostas no ano" icon="send" color="#8B5CF6">
          <div className="kv"><span>Enviadas</span><b>{int(p.env)}</b></div>
          <div className="kv"><span>Fechadas</span><b>{int(p.fech)}{p.valFech ? ` · ${brl(p.valFech)}` : ''}</b></div>
          <div className="kv"><span>Em negociação</span><b>{int(p.negoc)}{p.valNeg ? ` · ${brl(p.valNeg)}` : ''}</b></div>
          <div className="kv big"><span>Taxa de fechamento</span><b>{decid ? Math.round(p.fech / decid * 100) + '%' : '—'}</b></div>
        </Card>
      </div>

      {cats.length > 0 && <Card title="Para onde foi o dinheiro no ano" icon="chart" color="#E11D48">
        {cats.map(([c, v]) => <div key={c} className="catl"><div className="kv"><span>{c}</span><b>{brl(v)}</b></div><div className="prog"><i style={{ width: (v / cats[0][1] * 100) + '%', background: '#E11D48' }} /></div></div>)}
      </Card>}

      <div className="tiles">
        <Link to="/app/ferramentas/preco" className="tile"><span className="tile-i"><Ic n="coin" s={18} /></span><b>Calculadora de preço</b><span>Quanto cobrar por hora e por pacote sem trabalhar no prejuízo</span></Link>
        <button className="tile" onClick={baixar}><span className="tile-i"><Ic n="download" s={18} /></span><b>Planilha do ano</b><span>Baixe entradas, gastos e pró-labore para o contador ou o imposto de renda</span></button>
      </div>
    </div>
  )
}
