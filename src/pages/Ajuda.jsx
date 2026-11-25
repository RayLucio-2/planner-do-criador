// Central de ajuda: dúvidas frequentes por assunto, com busca e contato
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Ic } from '../components/ui'
import { PRECO, PRECO_DE, PROMO_ATIVA, PROMO_MESES, PRECO_PDF, DIAS_TESTE } from '../lib/supabase'
import { Rodape } from './Landing'

const EMAIL = import.meta.env.VITE_EMAIL_CONTATO || 'teloraprodutora@gmail.com'
const D = DIAS_TESTE || '7'

const GRUPOS = [
  { t: 'Assinatura e pagamento', i: 'spark', c: '#8B5CF6', q: [
    ['Como funciona o teste grátis?', `Você cria a conta, cadastra o cartão no ambiente seguro do Asaas e usa ${D} dias grátis. Nada é cobrado no cadastro. A 1ª mensalidade só é cobrada no ${Number(D) + 1}º dia.`],
    ['Quanto custa?', `${PRECO} por mês${PROMO_ATIVA && PRECO_DE ? `. Quem assina na promoção paga esse valor por ${PROMO_MESES} meses e depois passa para ${PRECO_DE}, com aviso por e-mail 15 dias antes` : ''}. Sem fidelidade.`],
    ['O que fica bloqueado no teste grátis?', 'No teste você usa o mês atual e o próximo, o guia, as ferramentas e o financeiro básico. Os outros meses, o financeiro avançado (importar extrato, planilha do ano e calculadora de preço) e os desafios de 60 e 90 dias liberam quando a 1ª mensalidade é paga.'],
    ['Quero liberar tudo agora, sem esperar o teste acabar', 'Vá em Perfil › Assinatura e toque em “Assinar agora”. A 1ª mensalidade é cobrada no cartão na hora e tudo é liberado.'],
    ['Como cancelo?', 'Em Perfil › Assinatura › Cancelar. Se cancelar durante o teste, não paga nada. Se já pagou, continua usando até o fim do mês pago.'],
    ['Posso pedir o dinheiro de volta?', `Sim. Você pode desistir em até 7 dias da 1ª cobrança e receber o valor de volta (art. 49 do Código de Defesa do Consumidor). Basta pedir pelo e-mail ${EMAIL}.`],
    ['Como troco o cartão?', `Responda o e-mail de cobrança do Asaas ou escreva para ${EMAIL} que mandamos o link para atualizar o cartão.`],
    ['Como funciona a indicação?', 'Em Perfil › Indique uma amiga você copia o seu link. Quando a amiga assina por ele e paga a 1ª mensalidade, vocês duas ganham 1 mês grátis.'],
  ] },
  { t: 'PDF do planner', i: 'download', c: '#FF7A2F', q: [
    ['Como recebo o PDF?', `Depois do pagamento (${PRECO_PDF}), o botão de download aparece na tela e o link também chega no seu e-mail. No cartão é na hora. No PIX, assim que o banco confirmar.`],
    ['O e-mail com o PDF não chegou', `Confira a caixa de spam e a aba Promoções. Se não estiver lá, escreva para ${EMAIL} com o e-mail usado na compra que mandamos de novo.`],
    ['Como preencho o PDF?', 'No celular, abra no app Adobe Acrobat Reader (é grátis). No computador, no Acrobat ou no navegador. Também dá para imprimir.'],
  ] },
  { t: 'Usando o app', i: 'cal', c: '#FF3D77', q: [
    ['Preciso instalar alguma coisa?', 'Não. O planner abre no navegador. Para usar como app, adicione à tela inicial: no Android, menu ⋮ › Adicionar à tela inicial; no iPhone, no Safari, botão Compartilhar › Adicionar à Tela de Início.'],
    ['Funciona no celular e no computador?', 'Sim. Entre com o mesmo e-mail e tudo fica sincronizado nos dois.'],
    ['Esqueci a senha', 'Na tela de entrar, toque em “Esqueci minha senha”. Chega no seu e-mail um código e um link para criar uma nova.'],
    ['Como ativo os lembretes?', 'Em Perfil › Lembretes. No iPhone, primeiro adicione o planner à Tela de Início. Nos posts do calendário, o sininho cria o lembrete no Google Agenda.'],
    ['Como importo o extrato do banco ou a fatura do cartão?', 'Abra o mês e vá na aba Negócio, no cartão “Importar extrato ou fatura”. Escolha o arquivo em OFX ou CSV (exportado no app ou site do banco; PDF não funciona). Depois marque o que quer trazer e para onde vai cada linha.'],
    ['Onde está o desafio de 60 dias?', 'No Guia, logo depois das lições. Escolha a data de início e marque cada dia feito.'],
  ] },
  { t: 'Conta e dados', i: 'user', c: '#10B981', q: [
    ['Meus dados ficam seguros?', 'Sim. Só você vê o que escreve no planner. Os dados do cartão ficam no Asaas, nunca com a gente.'],
    ['Como faço backup?', 'Em Perfil › Backup você baixa uma cópia de tudo o que escreveu.'],
    ['Como excluo minha conta?', 'Em Perfil › Excluir minha conta. Cancele a assinatura antes, se tiver uma ativa.'],
  ] },
]

const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

export default function Ajuda() {
  const [b, setB] = useState('')
  const q = norm(b.trim())
  const grupos = GRUPOS.map((g) => ({ ...g, q: g.q.filter(([p, r]) => !q || norm(p + ' ' + r).includes(q)) })).filter((g) => g.q.length)
  return (
    <div className="lp">
      <div className="legal">
        <nav className="lp-nav"><Link to="/" className="brand">planner<i>.</i>do<i>.</i>criador</Link><Link to="/" className="btn ghost sm"><Ic n="left" s={14} /> Voltar</Link></nav>
        <article>
          <h1>Central de ajuda</h1>
          <p className="mut">As respostas para as dúvidas mais comuns. Não achou? Fale com a gente no final da página.</p>
          <div className="aj-busca"><Ic n="search" s={16} /><input className="in" type="search" placeholder="Buscar: cancelar, PDF, senha…" value={b} onChange={(e) => setB(e.target.value)} aria-label="Buscar na ajuda" /></div>
          {grupos.length === 0 && <p className="mut">Nada encontrado para “{b}”. Fale com a gente abaixo.</p>}
          {grupos.map((g) => (
            <section key={g.t} className="aj-g">
              <h2 style={{ '--c': g.c }}><span className="aj-i"><Ic n={g.i} s={16} /></span>{g.t}</h2>
              <div className="faq">{g.q.map(([p, r]) => (
                <details key={p} open={!!q}><summary>{p}<Ic n="plus" s={16} /></summary><p className="mut">{r}</p></details>
              ))}</div>
            </section>
          ))}
          <section className="aj-contato">
            <h2>Ainda precisa de ajuda?</h2>
            <p className="mut">Respondemos em até 1 dia útil.</p>
            <div className="aj-bt">
              <a className="btn" href={`mailto:${EMAIL}?subject=${encodeURIComponent('Ajuda com o Planner do Criador')}`}><Ic n="at" s={16} /> {EMAIL}</a>
              <a className="btn ghost" href="https://ig.me/m/aritamende.s" target="_blank" rel="noreferrer"><Ic n="send" s={16} /> Direct no Instagram</a>
            </div>
          </section>
        </article>
      </div>
      <Rodape />
    </div>
  )
}
