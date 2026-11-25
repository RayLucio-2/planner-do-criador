import { Link } from 'react-router-dom'
import { Ic } from '../components/ui'

const EMPRESA = import.meta.env.VITE_EMPRESA || 'Télora Produtora'
const CNPJ = import.meta.env.VITE_CNPJ || '[preencher CNPJ]'
const EMAIL = import.meta.env.VITE_EMAIL_CONTATO || '[preencher e-mail de contato]'
const CIDADE = import.meta.env.VITE_CIDADE || '[preencher cidade/UF]'
import { PRECO, PROMO_ATIVA, PROMO } from '../lib/supabase'
const PRECO_PDF = import.meta.env.VITE_PRECO_PDF || 'R$ 8,99'
const DIAS = import.meta.env.VITE_DIAS_TESTE || '7'
const ATUALIZADO = '5 de novembro de 2026'

function Doc({ titulo, children }) {
  return (
    <div className="legal">
      <nav className="lp-nav"><Link to="/" className="brand">planner<i>.</i>do<i>.</i>criador</Link><Link to="/" className="btn ghost sm"><Ic n="left" s={14} /> Voltar</Link></nav>
      <article>
        <h1>{titulo}</h1>
        <p className="mut sm">Última atualização: {ATUALIZADO}</p>
        {children}
        <p className="mut sm">Dúvidas: {EMAIL}</p>
      </article>
    </div>
  )
}

export function Termos() {
  return (
    <Doc titulo="Termos de uso">
      <p>Estes termos regulam o uso do <b>Planner do Criador</b> (site e aplicativo), oferecido por <b>{EMPRESA}</b>, CNPJ {CNPJ}, com sede em {CIDADE} (“nós”). Ao criar uma conta, você concorda com estes termos e com a <Link to="/privacidade">Política de privacidade</Link>.</p>
      <h2>1. O que é o serviço</h2>
      <p>Um planner digital para criadores de conteúdo, com guia, ferramentas, calendário editorial, roteiros, análise e controle financeiro do mês. O conteúdo que você escreve é seu; nós só o guardamos para que você possa usá-lo.</p>
      <h2>2. Conta</h2>
      <p>Você precisa ter 18 anos ou mais, ou autorização de quem responde por você, e informar um e-mail válido. Guarde sua senha com cuidado: o que for feito na sua conta é de sua responsabilidade.</p>
      <h2>3. Teste grátis e assinatura</h2>
      <ul>
        <li>Para começar, você cadastra um cartão de crédito no ambiente da plataforma de pagamento (Asaas) e ganha <b>{DIAS} dias grátis</b>. Nada é cobrado no cadastro.</li>
        <li>Se você não cancelar até o fim do teste, a assinatura mensal de <b>{PRECO}</b> é cobrada no cartão no {Number(DIAS) + 1}º dia e renovada automaticamente todo mês.</li>
        {PROMO_ATIVA && <li><b>Promoção ({PROMO}):</b> quem assinar durante a promoção continua pagando {PRECO} por mês enquanto a assinatura estiver ativa. Se cancelar e assinar de novo depois, vale o preço da época.</li>}
        <li>O teste grátis vale uma vez por pessoa.</li>
        <li>Você pode <b>cancelar quando quiser</b>, em Perfil › Assinatura. O acesso continua até o fim do período já pago e não há multa nem fidelidade.</li>
        <li><b>Direito de arrependimento:</b> por ser uma contratação pela internet, você pode desistir em até 7 dias da primeira cobrança e receber o valor de volta (art. 49 do Código de Defesa do Consumidor). Basta pedir pelo e-mail {EMAIL}.</li>
        <li>Se o preço mudar, avisamos por e-mail com pelo menos 30 dias de antecedência. A mudança vale a partir da renovação seguinte.</li>
      </ul>
      <h3>Indique uma amiga</h3>
      <ul>
        <li>Quem indica e quem é indicada pelo link pessoal (em Perfil) ganham <b>1 mês grátis</b> cada quando a indicada pagar a 1ª mensalidade. O mês grátis é a próxima mensalidade, que deixa de ser cobrada.</li>
        <li>Não há limite de indicações. O benefício não vale para contas criadas pela mesma pessoa e pode ser revisto em caso de uso indevido.</li>
      </ul>
      <h3>Compra do PDF</h3>
      <ul>
        <li>O Planner do Criador em PDF é vendido separadamente por <b>{PRECO_PDF}</b>, em pagamento único (PIX ou cartão, pelo Asaas), sem assinatura.</li>
        <li>O link para baixar é enviado ao e-mail informado na compra, assim que o pagamento é confirmado.</li>
        <li>O PDF é para uso pessoal. Não é permitido revender, compartilhar ou distribuir o arquivo.</li>
        <li><b>Direito de arrependimento:</b> você pode desistir em até 7 dias da compra e receber o valor de volta (art. 49 do CDC), pedindo pelo e-mail {EMAIL}.</li>
      </ul>
      <h2>4. Sem assinatura ativa</h2>
      <p>Quando o teste ou a assinatura termina, você continua podendo entrar e ver o que escreveu, mas não consegue editar até assinar de novo. Seus dados não são apagados por isso.</p>
      <h2>5. Propriedade intelectual</h2>
      <p>Textos das lições, layout, marca e materiais do Planner do Criador pertencem a {EMPRESA}. Você pode usá-los para planejar o seu trabalho, mas não pode copiar, revender ou distribuir o planner.</p>
      <h2>6. Uso adequado</h2>
      <p>Não use o serviço para atividades ilegais, nem tente acessar contas ou dados de outras pessoas ou atrapalhar o funcionamento do sistema. Contas que fizerem isso podem ser suspensas.</p>
      <h2>7. Disponibilidade</h2>
      <p>Trabalhamos para manter o serviço no ar o tempo todo, com cópias de segurança, mas podem acontecer interrupções para manutenção ou por falhas de fornecedores. Recomendamos baixar seu backup de vez em quando (Perfil › Backup).</p>
      <h2>8. Encerramento</h2>
      <p>Você pode excluir sua conta a qualquer momento em Perfil › Excluir minha conta. A exclusão cancela a assinatura e apaga seus dados, conforme a Política de privacidade.</p>
      <h2>9. Mudanças nestes termos</h2>
      <p>Se mudarmos algo importante, avisamos por e-mail ou dentro do app antes de a mudança valer.</p>
      <h2>10. Lei e foro</h2>
      <p>Estes termos seguem as leis do Brasil. Eventuais conflitos podem ser resolvidos no foro do seu domicílio, como garante o Código de Defesa do Consumidor.</p>
    </Doc>
  )
}

export function Privacidade() {
  return (
    <Doc titulo="Política de privacidade">
      <p>Esta política explica como <b>{EMPRESA}</b>, CNPJ {CNPJ}, trata os seus dados pessoais no Planner do Criador, de acordo com a Lei Geral de Proteção de Dados (Lei 13.709/2018, LGPD).</p>
      <h2>1. Quais dados coletamos</h2>
      <ul>
        <li><b>Conta:</b> nome, e-mail e senha (a senha é guardada de forma criptografada; nós não conseguimos vê-la).</li>
        <li><b>Conteúdo do planner:</b> tudo o que você escreve no app, como metas, roteiros, contratos e valores.</li>
        <li><b>Assinatura:</b> status do plano e identificadores da plataforma de pagamento. Os dados do cartão ficam só com a plataforma de pagamento; nós não temos acesso a eles.</li>
        <li><b>Lembretes:</b> se você ativar, guardamos o endereço técnico de notificação do seu aparelho, o horário e o fuso escolhidos.</li>
        <li><b>Compra do PDF:</b> nome, e-mail e CPF (o CPF é exigido pela plataforma de pagamento para emitir a cobrança).</li>
        <li><b>Lista de espera:</b> se entrar na lista, guardamos nome e e-mail.</li>
        <li><b>Navegação:</b> se você aceitar os cookies de medição, o Google Analytics e o Pixel da Meta registram páginas visitadas e ações como cadastro e início de assinatura.</li>
      </ul>
      <h2>2. Para que usamos e com qual base legal</h2>
      <ul>
        <li>Criar sua conta, guardar e sincronizar seu planner, cobrar a assinatura e entregar o PDF comprado: <b>execução de contrato</b> (art. 7º, V).</li>
        <li>Lembretes, lista de espera e e-mails sobre o planner, e cookies de medição e anúncios: <b>consentimento</b> (art. 7º, I), que você pode retirar quando quiser.</li>
        <li>Segurança, prevenção de fraudes e melhoria do serviço: <b>legítimo interesse</b> (art. 7º, IX).</li>
        <li>Guardar registros exigidos por lei, como os de acesso e os fiscais: <b>obrigação legal</b> (art. 7º, II).</li>
      </ul>
      <h2>3. Com quem compartilhamos</h2>
      <p>Não vendemos seus dados. Usamos fornecedores que tratam dados em nosso nome:</p>
      <ul>
        <li><b>Supabase</b> (banco de dados e login) e <b>Netlify</b> (hospedagem do site), com servidores que podem ficar fora do Brasil;</li>
        <li><b>Asaas</b> (pagamentos; os dados do cartão ficam só com o Asaas);</li>
        <li><b>Provedor de e-mail</b> (envio de confirmação de conta e recuperação de senha);</li>
        <li><b>Google</b> e <b>Meta</b>, somente se você aceitar os cookies de medição.</li>
      </ul>
      <p>Quando há transferência internacional, ela segue o art. 33 da LGPD, com fornecedores que adotam cláusulas contratuais e padrões de segurança adequados.</p>
      <h2>4. Por quanto tempo guardamos</h2>
      <p>Enquanto sua conta existir. Se você excluir a conta, apagamos seus dados do planner e da conta imediatamente do banco principal e das cópias de segurança em até 30 dias. Registros que a lei manda guardar (como os de acesso, por 6 meses, e os fiscais de pagamento) ficam pelo prazo legal.</p>
      <h2>5. Seus direitos</h2>
      <p>Você pode, a qualquer momento: confirmar se tratamos seus dados, acessá-los, corrigi-los, pedir a portabilidade, revogar consentimentos e pedir a exclusão (art. 18 da LGPD). Dentro do app você já consegue baixar uma cópia (Perfil › Backup) e excluir a conta (Perfil › Excluir minha conta). Para os demais pedidos, escreva para {EMAIL}. Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).</p>
      <h2>6. Cookies</h2>
      <p>Usamos armazenamento local do navegador para manter você conectado e o app funcionando offline (essenciais). Cookies de medição (Google Analytics e Pixel da Meta) só são ativados se você aceitar no aviso de cookies. Para mudar a escolha, limpe os dados do site no navegador e escolha de novo.</p>
      <h2>7. Segurança</h2>
      <p>Os dados trafegam com criptografia (HTTPS) e cada conta só consegue ler os próprios dados, por regras aplicadas no próprio banco de dados.</p>
      <h2>8. Encarregado (DPO)</h2>
      <p>O contato do encarregado pelo tratamento de dados é {EMAIL}.</p>
    </Doc>
  )
}
