// Conteúdo do Planner do Criador 2027 (mesmo texto do PDF).
export const ANO_INICIAL = 2027
export const MESES = [
  ['jan', 'Janeiro', '#FF3D77'], ['fev', 'Fevereiro', '#8B5CF6'], ['mar', 'Março', '#FF7A2F'],
  ['abr', 'Abril', '#10B981'], ['mai', 'Maio', '#3B82F6'], ['jun', 'Junho', '#F59E0B'],
  ['jul', 'Julho', '#EC4899'], ['ago', 'Agosto', '#14B8A6'], ['set', 'Setembro', '#6366F1'],
  ['out', 'Outubro', '#F97316'], ['nov', 'Novembro', '#0EA5E9'], ['dez', 'Dezembro', '#E11D48'],
].map(([k, nome, cor], i) => ({ k, nome, cor, n: i + 1 }))
export const MES = Object.fromEntries(MESES.map((m) => [m.k, m]))

export const FOCOS = [
  ['Começar com o que você tem', 'Faça o diagnóstico, organize o celular e publique seus primeiros conteúdos. Feito é melhor que perfeito.'],
  ['Escutar o público', 'Leia comentários, anote perguntas, converse. Monte o seu mapa de dores antes de inventar pautas.'],
  ['Roteiro e linguagem', 'Uma ideia por vídeo, gancho nos 3 primeiros segundos e as palavras que o seu público usa.'],
  ['Presença local', 'Estruture o Perfil da Empresa no Google (Google Meu Negócio) e peça as primeiras avaliações.'],
  ['Prospecção de verdade', 'Panfleto bem estruturado na mão e porta em porta. Cada conversa é pesquisa.'],
  ['Revisar o semestre', 'Volte nos registros: onde você errou, o que funcionou, o que vale repetir.'],
  ['Primeiro upgrade: luz', 'Se um contrato pagou, invista em luz. É o que mais muda a imagem.'],
  ['Áudio limpo', 'Microfone é o segundo passo. Gente perdoa imagem simples, mas não perdoa áudio ruim.'],
  ['Portfólio e provas', 'Transforme trabalhos entregues em cases: antes e depois, resultado, depoimento.'],
  ['Constância e processo', 'Crie a sua rotina fixa de roteirizar, gravar, editar e postar.'],
  ['Câmera e ofertas de fim de ano', 'Upgrade de câmera só se os contratos pagarem. Prepare ofertas para a Black Friday.'],
  ['Fechar e planejar o próximo ano', 'Compare com janeiro, registre o que aprendeu e decida o próximo passo.'],
]

// 'fer' feriado, 'pf' ponto facultativo, 'data' data para conteúdo
function pascoa(y) { // algoritmo de Meeus
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451)
  const mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(y, mes - 1, dia)
}
const nDomingo = (y, mes, n) => { const d = new Date(y, mes - 1, 1); const off = (7 - d.getDay()) % 7; return 1 + off + 7 * (n - 1) }
const _cache = {}
export function datasDoAno(y) {
  if (_cache[y]) return _cache[y]
  const D = {}
  const put = (dt, nome, t) => { const k = `${dt.getMonth() + 1}-${dt.getDate()}`; D[k] = D[k] ? [D[k][0] + ' · ' + nome, D[k][1] === 'data' ? t : D[k][1]] : [nome, t] }
  const at = (m, d) => new Date(y, m - 1, d)
  const p = pascoa(y), add = (n) => new Date(p.getFullYear(), p.getMonth(), p.getDate() + n)
  put(at(1, 1), 'Ano Novo', 'fer'); put(add(-48), 'Carnaval*', 'pf'); put(add(-47), 'Carnaval*', 'pf')
  put(at(3, 8), 'Dia da Mulher', 'data'); put(at(3, 15), 'Dia do Consumidor', 'data'); put(add(-2), 'Sexta-feira Santa', 'fer')
  put(p, 'Páscoa', 'data'); put(at(4, 7), 'Dia Mundial da Saúde', 'data'); put(at(4, 21), 'Tiradentes', 'fer')
  put(at(5, 1), 'Dia do Trabalho', 'fer'); put(at(5, nDomingo(y, 5, 2)), 'Dia das Mães', 'data'); put(add(60), 'Corpus Christi*', 'pf')
  put(at(6, 12), 'Dia dos Namorados', 'data'); put(at(6, 30), 'Dia das Redes Sociais', 'data'); put(at(8, nDomingo(y, 8, 2)), 'Dia dos Pais', 'data')
  put(at(9, 7), 'Independência', 'fer'); put(at(9, 15), 'Dia do Cliente', 'data'); put(at(10, 12), 'N. Sra. Aparecida · Dia das Crianças', 'fer')
  put(at(11, 2), 'Finados', 'fer'); put(at(11, 15), 'Proclamação da República', 'fer'); put(at(11, 20), 'Consciência Negra', 'fer')
  const nov1 = new Date(y, 10, 1).getDay(); const thanks = 1 + ((4 - nov1 + 7) % 7) + 21
  put(at(11, thanks + 1), 'Black Friday', 'data'); put(at(11, thanks + 4), 'Cyber Monday', 'data')
  put(at(12, 25), 'Natal', 'fer'); put(at(12, 31), 'Réveillon', 'data')
  return (_cache[y] = D)
}

// Anos "bônus": começam no meio do ano (ex.: novembro e dezembro de 2026, antes do planner de 2027)
export const ANOS_BONUS = { 2026: 11 }
export function mesesDoAno(y) { const ini = ANOS_BONUS[y] || 1; return MESES.filter((m) => m.n >= ini) }
export function foco(n, y) {
  const ini = ANOS_BONUS[y]
  if (!ini) return FOCOS[n - 1]
  if (n === 12) return [`Escutar o público e preparar ${y + 1}`, `Leia comentários, anote perguntas e monte o mapa de dores. Deixe janeiro de ${y + 1} planejado no calendário editorial.`]
  return FOCOS[Math.max(0, n - ini)]
}

export const AREAS = [
  ['equip', 'Equipamento'], ['roteiro', 'Roteiro e linguagem'], ['grav', 'Gravação (luz, áudio, enquadramento)'],
  ['edicao', 'Edição'], ['const', 'Constância de postagem'], ['publico', 'Conhecimento do público'],
  ['google', 'Presença no Google'], ['prosp', 'Prospecção e vendas'], ['dinheiro', 'Dinheiro do negócio'], ['rotina', 'Rotina e descanso'],
]
export const METAS_AREAS = ['Conteúdo', 'Clientes e contratos', 'Equipamento', 'Aprendizado', 'Presença no Google', 'Prospecção', 'Dinheiro', 'Rotina e descanso']
export const ANALISE = [
  ['pub', 'Conteúdos publicados'], ['alc', 'Alcance / visualizações'], ['ret', 'Retenção nos 3 primeiros segundos (%)'],
  ['sal', 'Salvamentos e compartilhamentos'], ['msg', 'Mensagens recebidas'], ['cli', 'Cliques no link / WhatsApp'],
  ['seg', 'Seguidores novos'], ['con', 'Contratos fechados'],
]
export const FORMATOS = ['', 'Reels', 'Carrossel', 'Stories', 'Foto', 'Ao vivo', 'TikTok', 'Shorts', 'YouTube', 'Collab']
export const ETAPAS = [['rot', 'Roteirizar'], ['grav', 'Gravar'], ['edit', 'Editar'], ['post', 'Postar'], ['resp', 'Responder / prospectar']]
export const CHECK_SET = ['Lente limpa', 'Bateria carregada', 'Espaço livre no celular', 'Modo avião', 'Luz testada', 'Áudio testado (10 s)', 'Foco e exposição travados', 'Roteiro em tópicos']

export function diasDoMes(n, y) { return new Date(y, n, 0).getDate() }
export const WD = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
export function semanas(n, y) {
  const out = []; const last = diasDoMes(n, y)
  let d = 1
  while (d <= last) {
    const wd = (new Date(y, n - 1, d).getDay() + 6) % 7 // 0 = seg
    const fim = Math.min(last, d + (6 - wd))
    out.push([d, fim]); d = fim + 1
  }
  return out
}

// ---------------------------------------------------------------- lições
export const LICOES = [
  {
    id: 'l1a', n: 1, cor: '#FF3D77', icon: 'cam', titulo: 'Comece com o que você tem', sub: 'O celular no seu bolso já é suficiente para os primeiros contratos',
    intro: 'Eu comecei com um iPhone 13 Pro e mais nada. A vontade de esperar o equipamento ideal é, na verdade, **medo disfarçado de planejamento.** Quem contrata você quer ver um resultado que resolve o problema dele, e não a marca da sua câmera.',
    blocos: [
      { tipo: 'check', titulo: 'Tire o máximo do celular', cor: '#FF3D77', itens: ['**Grave com a câmera traseira:** tem qualidade melhor que a frontal.', '**Limpe a lente** antes de cada gravação. Parece bobo, muda tudo.', '**Use 4K a 30 fps ou 1080p a 30 fps.** Mantenha o mesmo padrão em todo o projeto.', '**Segure o dedo na tela** para travar foco e exposição (AE/AF).', '**Grave na horizontal só se o destino pedir.** Para Reels e TikTok, vertical.', '**Deixe o celular em modo avião** para não cortar a gravação.', '**Libere espaço** antes de sair de casa.'] },
      { tipo: 'check', titulo: 'Luz e som sem gastar nada', cor: '#8B5CF6', itens: ['**Fique de frente para a janela**, nunca de costas.', '**Uma folha branca ou isopor** rebate luz no rosto.', '**Evite luz do teto** bem em cima da cabeça: cria sombra nos olhos.', '**Grave perto de quem fala.** Distância é inimiga do áudio.', '**Ambientes com tapete, cortina e sofá** têm menos eco.', '**Fone com fio** ligado ao celular já é um microfone melhor que o embutido.', '**Escute 10 segundos de teste** antes de gravar tudo.'] },
      { tipo: 'tabela', titulo: 'O que eu tenho hoje e o que dá para fazer com isso', cols: [['tenho', 'O que eu tenho'], ['entrego', 'O que já consigo entregar com isso']] },
    ],
  },
  {
    id: 'l1b', n: 1, cor: '#FF3D77', icon: 'stair', titulo: 'A ordem de agregar', sub: 'Luz, microfone e câmera, nesta ordem, cada um pago por um contrato',
    intro: 'Depois que os primeiros trabalhos entram, a tentação é trocar tudo de uma vez. Não faça isso. Agregue em degraus, sempre com o dinheiro do trabalho e nunca com dívida maior do que o seu caixa aguenta. Eu só parcelei o iPhone 17 Pro quando os contratos que eu já tinha cobriam as parcelas.',
    blocos: [
      { tipo: 'passos', itens: [
        ['Luz', 'É o que mais muda a qualidade da imagem. Um celular simples com boa luz parece melhor que uma câmera cara com luz ruim.', 'Um painel LED ou softbox com regulagem de intensidade e temperatura.', '#F59E0B'],
        ['Microfone', 'As pessoas até toleram imagem simples, mas abandonam um vídeo com áudio ruim nos primeiros segundos.', 'Um microfone de lapela sem fio compatível com o seu celular.', '#FF3D77'],
        ['Câmera', 'Só por último, e só quando a sua demanda pedir: mais qualidade, mais lentes, mais estabilidade.', 'Um celular mais novo (como foi comigo) ou uma câmera dedicada.', '#8B5CF6']] },
      { tipo: 'check', titulo: 'Regra do upgrade', cor: '#FF3D77', itens: ['O contrato veio antes da compra?', 'A parcela cabe no que já entra todo mês?', 'Esse item resolve um problema que eu tenho hoje?', 'Eu já tirei o máximo do que tenho?'], nota: 'Se alguma resposta for “não”, espere mais um pouco.' },
      { tipo: 'check', titulo: 'Extras que ajudam (e custam pouco)', cor: '#8B5CF6', itens: ['Tripé com suporte para celular', 'Cartão ou SSD para backup dos arquivos', 'Power bank', 'Um fundo neutro ou um canto arrumado fixo'] },
      { tipo: 'frase', texto: '“O equipamento não trouxe os clientes. Os clientes trouxeram o equipamento.”' },
    ],
  },
  {
    id: 'l2a', n: 2, cor: '#8B5CF6', icon: 'pen', titulo: 'Os roteiros errados que eu fiz', sub: 'Até entender a linguagem do público e o que eu queria passar',
    intro: 'Muitos dos meus primeiros roteiros estavam tecnicamente certos e não funcionavam. Eu falava do que eu achava importante, com as palavras que eu usava. O público não se via ali. A virada aconteceu quando eu parei de perguntar **“o que eu quero falar?”** e passei a perguntar **“o que essa pessoa precisa ouvir, e com que palavras ela mesma diria isso?”**',
    blocos: [
      { tipo: 'vs', a: 'Como eu escrevia', b: 'Como aprendi a escrever', itens: [
        ['Começava me apresentando: “Oi, eu sou… e hoje vou falar sobre…”', 'Começo pela dor ou pelo desejo de quem assiste, logo no primeiro segundo.'],
        ['Usava termos técnicos para parecer profissional.', 'Uso as palavras que o público usa nos comentários, no direct e na conversa.'],
        ['Queria dizer tudo em um vídeo só.', 'Uma ideia por vídeo. O resto vira outro conteúdo.'],
        ['Texto decorado, falado de um jeito robótico.', 'Tópicos no papel e fala como numa conversa.'],
        ['Copiava a trend do momento sem pensar no meu público.', 'Uso o formato da trend só quando ele serve à dor de quem eu atendo.'],
        ['Terminava sem dizer o que a pessoa devia fazer.', 'Fecho com uma chamada clara: salvar, comentar, chamar no WhatsApp.'],
        ['Achava que o problema era o equipamento.', 'Entendi que o problema quase sempre era a mensagem.']] },
      { tipo: 'tabela', titulo: 'Os roteiros que eu errei (registre os seus)', cols: [['rot', 'Roteiro / vídeo'], ['errei', 'O que eu errei'], ['hoje', 'Como eu faria hoje']] },
    ],
  },
  {
    id: 'l2b', n: 2, cor: '#8B5CF6', icon: 'play', titulo: 'Estrutura de roteiro que funciona', sub: 'Antes de escrever, responda três perguntas',
    blocos: [
      { tipo: 'cards', itens: [['Para quem?', 'Uma pessoa específica, não “todo mundo”.', '#FF3D77'], ['Qual a dor?', 'O que tira o sono dela, nas palavras dela.', '#8B5CF6'], ['O que eu quero que ela sinta e faça?', 'Uma emoção e uma ação.', '#FF7A2F']] },
      { tipo: 'timeline', itens: [['Gancho', '0 a 3 s', 'Uma frase que faz a pessoa pensar “isso é comigo”.'], ['Problema', '3 a 10 s', 'Mostre que você entende a situação dela.'], ['Virada', '10 a 40 s', 'A ideia, a dica ou a solução. Uma só.'], ['Prova', 'curta', 'Um exemplo, um antes e depois, um resultado.'], ['Chamada', 'final', 'O que a pessoa faz agora.']] },
      { tipo: 'antesdepois', titulo: 'Exemplo: vídeo para um personal trainer',
        antes: ['“Oi, pessoal! Eu sou o Rafa, personal trainer há 8 anos, formado em Educação Física, e hoje eu vou falar sobre periodização e hipertrofia.”', 'Fala de quem produz. Termo técnico. Nenhuma dor.'],
        depois: ['“Você treina há meses e o espelho não muda? Talvez o problema não seja quanto você treina, e sim que você faz o mesmo treino desde janeiro. Olha o que eu mudo com os meus alunos a cada 6 semanas… Quer que eu monte o seu? **Me chama no direct.**”', 'Começa pela dor, usa a linguagem do aluno, fecha com ação.'] },
      { tipo: 'dica', k: 'Teste rápido', texto: 'leia o gancho em voz alta para alguém do seu público. Se a pessoa não disser “nossa, é isso”, reescreva.' },
    ],
  },
  {
    id: 'l3', n: 3, cor: '#3B82F6', icon: 'globe', titulo: 'Google Meu Negócio', sub: 'Hoje chamado de Perfil da Empresa no Google: aparecer para quem já está procurando',
    intro: 'Muita gente procura no Google e no Maps coisas como “produtora de vídeo perto de mim” ou “filmmaker em [sua cidade]”. **Essa pessoa já quer contratar.** Estruturar o meu perfil foi uma das coisas que mais trouxe contato sem eu precisar postar nada naquele dia. É gratuito e é um dos primeiros lugares onde o cliente confere se você é de verdade.',
    blocos: [
      { tipo: 'check', titulo: 'Estrutura básica', cor: '#3B82F6', itens: ['Criar o perfil em **google.com/business** com a conta do negócio', 'Usar o **nome real** do negócio, sem encher de palavras-chave', 'Escolher a **categoria principal** certa e as secundárias', 'Definir a **área de atendimento** (dá para ocultar o endereço se você atende em casa)', 'Horário de atendimento, telefone e WhatsApp', 'Link do Instagram, do portfólio ou do site', 'Concluir a **verificação** pedida pelo Google'] },
      { tipo: 'check', titulo: 'O que faz o perfil trazer cliente', cor: '#10B981', itens: ['Descrição escrita com **as palavras que o cliente usa**', 'Serviços cadastrados um a um, com uma explicação curta', '**Fotos e vídeos reais:** trabalhos, bastidores, você gravando', '**Pedir avaliação** a todo cliente logo após a entrega', '**Responder todas as avaliações**, inclusive as ruins, com educação', '**Publicar atualizações** toda semana (trabalho novo, oferta, dica)', 'Conferir os **números do perfil** todo mês'] },
      { tipo: 'dica', k: 'Na prática', texto: 'um perfil com fotos reais, avaliações respondidas e atualizações recentes passa confiança antes mesmo da primeira conversa. Use a ferramenta “Google Meu Negócio” para acompanhar ligações, cliques e avaliações mês a mês.' },
    ],
  },
  {
    id: 'l4', n: 4, cor: '#FF7A2F', icon: 'flyer', titulo: 'O panfleto que traz clientes', sub: 'Como um papel bem pensado abre portas no seu bairro',
    intro: 'Panfleto ainda funciona, principalmente para quem atende negócios locais. O segredo não está no design: está em escolher um público e escrever para a dor dele. Nada de panfleto de “faço vídeos”. Um bom panfleto fala do que aquela pessoa vive. Para um personal trainer, por exemplo: ser ótimo no treino e não conseguir mostrar isso no Instagram, não ter tempo para gravar, perder aluno para quem aparece mais. Entregue pessoalmente, converse e volte depois. O resultado vem da soma: **panfleto certo + conversa olho no olho + retorno + perfil no Google** para confirmar que você existe.',
    blocos: [
      { tipo: 'numerados', titulo: 'A anatomia do panfleto', itens: [['Título com a dor', '“Você é ótimo no treino, mas o seu Instagram não mostra isso?”'], ['O que você resolve, em uma frase', '“Eu gravo e edito os seus conteúdos para você atrair mais alunos.”'], ['Três benefícios concretos', 'Sem perder tempo gravando sozinho · vídeos com cara profissional · conteúdo pensado para atrair aluno'], ['Prova', 'QR code para o portfólio, antes e depois de um perfil, um depoimento.'], ['Porta de entrada', 'Uma oferta simples para começar: uma análise do perfil ou um pacote inicial.'], ['Contato e rosto', 'Seu nome, sua foto, WhatsApp e QR code. Pessoas contratam pessoas.']] },
      { tipo: 'lista', titulo: 'Erros que deixam o panfleto no lixo', cor: '#E11D48', marca: '✕', itens: ['Texto genérico que serve para qualquer um', 'Informação demais e letra pequena', 'Tabela de preços confusa', 'Copiar o layout e a frase de outra pessoa', 'Não ter nenhum jeito fácil de falar com você'] },
      { tipo: 'lista', titulo: 'Como entregar', cor: '#10B981', marca: '→', itens: ['Pessoalmente, com uma conversa curta e sem pressão', 'Pergunte: “qual a sua maior dificuldade com o Instagram?”', 'Anote a resposta no registro de porta em porta', 'Volte ou mande mensagem em até 7 dias', 'Um “não” hoje pode virar “sim” daqui a três meses'] },
    ],
  },
  {
    id: 'l5', n: 5, cor: '#10B981', icon: 'users', titulo: 'Entenda a dor, não copie ninguém', sub: 'Estudar muito é o atalho que ninguém quer pegar',
    intro: 'Copiar outro criador parece rápido, mas você copia a forma sem entender o motivo. Um panfleto que funcionou para outra pessoa não vai funcionar do mesmo jeito para você, porque o seu público, a sua cidade e o seu jeito são outros. **O que funciona em qualquer lugar é o método: descobrir as maiores dores do público e agir dentro delas.**',
    blocos: [
      { tipo: 'check', titulo: 'Onde as dores aparecem', cor: '#FF3D77', itens: ['Comentários nos perfis do seu nicho', 'Perguntas que chegam no seu direct e no WhatsApp', 'Avaliações no Google de negócios parecidos', 'As conversas de porta em porta', 'Grupos e fóruns onde o seu público conversa', 'O que os seus clientes reclamam antes de fechar'] },
      { tipo: 'vs', a: 'Copiar', b: 'Compreender', itens: [['Pega o formato', 'Entende por que o formato funcionou'], ['Usa a frase do outro', 'Usa a frase do seu público'], ['Funciona uma vez', 'Vira método que se repete'], ['Você vira mais um', 'Você vira referência']] },
      { tipo: 'check', titulo: 'O que estudar em 2027', cor: '#8B5CF6', itens: ['**#público** dores, desejos, objeções, linguagem', '**#roteiro** ganchos, narrativa, chamadas', '**#técnica** luz, áudio, enquadramento, edição', '**#negócio** preço, proposta, contrato, prospecção'] },
      { tipo: 'frase', texto: '“Bater de porta em porta também é pesquisa. Cada ‘não’ ensina uma dor que você ainda não tinha ouvido.”' },
    ],
  },
  {
    id: 'l6', n: 6, cor: '#F59E0B', icon: 'loop', titulo: 'Leva tempo: errar, mapear, gravar', sub: 'O progresso aparece para quem registra',
    intro: 'Ninguém acerta de primeira. A diferença entre quem desiste e quem cresce é que o segundo **anota onde errou e muda uma coisa de cada vez.** É para isso que existe a “Análise do mês” em cada mês deste planner.',
    blocos: [
      { tipo: 'ciclo', itens: [['Gravar', 'com o que tem'], ['Publicar', 'no dia marcado'], ['Observar', 'números e mensagens'], ['Mapear', 'onde errou'], ['Ajustar', 'uma coisa por vez']] },
      { tipo: 'lista', titulo: 'Números que importam no começo', cor: '#FF3D77', marca: '↗', itens: ['**Retenção nos primeiros 3 segundos:** o gancho funcionou?', '**Salvamentos e compartilhamentos:** o conteúdo foi útil?', '**Mensagens recebidas:** alguém quis conversar?', '**Contratos fechados:** o número que paga o próximo passo.'], nota: 'Seguidores importam menos do que parece no início.' },
      { tipo: 'lista', titulo: 'Como mapear um erro', cor: '#8B5CF6', marca: '?', itens: ['O que aconteceu? (fatos, não sentimentos)', 'Por que acho que aconteceu?', 'O que vou mudar no próximo?', 'Como vou saber se a mudança funcionou?'], nota: 'Mude uma variável por vez: gancho, horário, formato ou tema.' },
    ],
  },
  {
    id: 'd90', n: 0, cor: '#FF7A2F', icon: 'flag', titulo: 'Seus primeiros 90 dias', sub: 'Um caminho possível para quem está começando agora',
    blocos: [
      { tipo: 'check', titulo: 'Dias 1 a 30 · Começar', cor: '#FF3D77', itens: ['Preencher “Onde estou hoje”', 'Escolher um público específico', 'Ler 50 comentários do nicho e anotar frases', 'Montar o mapa de dores', 'Gravar e publicar 8 conteúdos com o celular', 'Organizar um portfólio simples'] },
      { tipo: 'check', titulo: 'Dias 31 a 60 · Aparecer', cor: '#8B5CF6', itens: ['Criar e verificar o Perfil da Empresa no Google', 'Cadastrar serviços e fotos reais', 'Escrever o rascunho do panfleto', 'Testar o panfleto com 3 pessoas do público', 'Imprimir uma tiragem pequena', 'Publicar 2 a 3 vezes por semana'] },
      { tipo: 'check', titulo: 'Dias 61 a 90 · Prospectar', cor: '#FF7A2F', itens: ['Visitar 20 lugares do seu público', 'Registrar cada conversa', 'Fazer o retorno em até 7 dias', 'Fechar o primeiro contrato (ou o próximo)', 'Pedir avaliação no Google a cada entrega', 'Guardar parte do valor para a luz'] },
      { tipo: 'dica', k: 'Sem pressa', texto: 'e sem comparação: os números deste plano são um ponto de partida. Ajuste ao seu tempo, mas não pule as etapas de escutar o público e de registrar.' },
      { tipo: 'campo', titulo: 'Meu compromisso para os próximos 90 dias', f: 'compromisso' },
    ],
  },
]

export const CARTA = [
  'Quando eu comecei, tudo o que eu tinha era um **iPhone 13 Pro**. Sem luz profissional, sem microfone, sem câmera. Só o celular, vontade e muita coisa para aprender.',
  'Foi com esse celular que eu gravei os primeiros trabalhos. Foi com ele que eu fechei os primeiros contratos. E foi com o dinheiro desses contratos que eu comprei, parcelado, o **iPhone 17 Pro**. Não foi o equipamento que trouxe os clientes. Foram os clientes que trouxeram o equipamento.',
  'Esse é o segredo que eu queria ter ouvido no começo: **faça com o que você tem e depois agregue.** Primeiro a luz, depois o microfone, depois a câmera. Cada item novo pago pelo trabalho que você já entregou.',
  'No caminho eu errei muito: fiz e produzi coisas que não geravam resultado. Escrevi roteiros que falavam para mim, e não para quem estava assistindo. Demorei para entender a linguagem do público e para ter clareza do que eu realmente queria passar. Depois estruturei o meu Google Meu Negócio e entendi uma coisa: os avanços só vêm fazendo. São os dias em que você aparece, mesmo sem vontade, que trazem resultado. Melhorar 1% num dia não é particularmente notável, mas pode ser muito significativo a longo prazo.',
  'Este planner junta tudo isso: as lições que eu aprendi errando e as ferramentas para você **estudar, mapear, gravar, analisar e ajustar** o seu caminho ao longo de 2027.',
  'Leva tempo. Mas cada mês que você registra aqui é um mês em que você aprende mais rápido do que eu aprendi.',
]

export const IG_URL = 'https://www.instagram.com/aritamende.s/'

// Depoimentos reais (com autorização) para a página de vendas: [nome, @ ou profissão, texto].
// Enquanto estiver vazio, a seção não aparece.
export const DEPOIMENTOS = []

// Desafio de 60 dias de conteúdo: 6 fases de 10 dias, uma tarefa por dia [tarefa, formato]
export const DESAFIO60 = [
  { fase: 'Fundação', cor: '#FF3D77', dias: [
    ['Apresente-se: quem você é, para quem cria e o que a pessoa ganha seguindo você.', 'Reels'],
    ['Arrume a vitrine: foto, nome, bio com a sua promessa e o link. Mostre o antes e o depois nos stories.', 'Stories'],
    ['Conte por que você começou.', 'Reels falado'],
    ['Responda as 3 maiores dúvidas do seu público num carrossel.', 'Carrossel'],
    ['Bastidores: como é o seu dia de trabalho.', 'Stories'],
    ['Um erro comum do seu público e como evitar.', 'Reels'],
    ['Revisão da semana: veja o que teve mais alcance e anote no planner.', 'Análise'],
    ['Mito x verdade do seu nicho.', 'Carrossel'],
    ['Mostre o que você usa hoje para gravar: comece com o que tem.', 'Reels'],
    ['Abra uma caixinha de perguntas e guarde as respostas no Banco de linguagem.', 'Stories'],
  ] },
  { fase: 'Ritmo', cor: '#8B5CF6', dias: [
    ['Grave em lote: 3 vídeos curtos no mesmo dia.', 'Gravação'],
    ['Responda uma pergunta da caixinha em vídeo.', 'Reels'],
    ['Tutorial rápido: o passo a passo de algo simples do seu nicho.', 'Reels'],
    ['Antes e depois de um trabalho, de um cliente ou seu.', 'Carrossel'],
    ['Tendência adaptada: um áudio em alta com a sua mensagem.', 'Reels'],
    ['Lista útil: 5 apps ou ferramentas que você usa.', 'Carrossel'],
    ['Revisão: quais ganchos prenderam mais? Reescreva o pior.', 'Análise'],
    ['Uma opinião sincera sobre algo do seu nicho.', 'Reels falado'],
    ['Enquete nos stories para o público escolher o próximo conteúdo.', 'Stories'],
    ['Poste o conteúdo que ganhou a enquete.', 'Livre'],
  ] },
  { fase: 'Conexão', cor: '#FF7A2F', dias: [
    ['Uma dificuldade que você superou.', 'Reels'],
    ['Mostre o resultado de um cliente ou seguidor, com autorização.', 'Carrossel'],
    ['Responda comentários em vídeo.', 'Reels'],
    ['Live ou vídeo de 10 minutos tirando dúvidas.', 'Live'],
    ['Um dia da sua rotina, do começo ao fim.', 'Reels'],
    ['O que mudou desde o dia 1: agradeça a quem acompanha.', 'Stories'],
    ['Revisão do mês: alcance, seguidores, conversas e contratos na Análise do mês.', 'Análise'],
    ['Collab: um conteúdo junto com alguém do seu nicho ou da sua cidade.', 'Collab'],
    ['Conteúdo para salvar: um guia ou checklist do seu nicho.', 'Carrossel'],
    ['Metade do caminho: o que você aprendeu em 30 dias.', 'Reels'],
  ] },
  { fase: 'Autoridade', cor: '#10B981', dias: [
    ['Explique algo difícil do jeito mais simples possível.', 'Carrossel'],
    ['Analise um caso (um perfil, uma campanha, um trabalho) e o que funcionou nele.', 'Reels'],
    ['3 sinais de que a pessoa precisa do seu serviço.', 'Carrossel'],
    ['O seu processo de trabalho em etapas.', 'Carrossel'],
    ['Responda uma objeção comum, como “é caro” ou “não tenho tempo”.', 'Reels'],
    ['Mostre um resultado com números.', 'Stories'],
    ['Revisão: o que gerou mais salvamentos e compartilhamentos?', 'Análise'],
    ['Discorde, com argumento, de um conselho comum do seu nicho.', 'Reels'],
    ['Depoimento de um cliente ou seguidor.', 'Stories ou Reels'],
    ['Perguntas frequentes sobre o seu trabalho.', 'Carrossel'],
  ] },
  { fase: 'Venda', cor: '#3B82F6', dias: [
    ['Apresente a sua oferta: o que você faz, para quem e como contratar.', 'Carrossel'],
    ['Bastidores de um projeto de cliente.', 'Reels'],
    ['Dor x solução: o problema e como o seu serviço resolve.', 'Reels'],
    ['Sequência de 5 stories terminando com um convite para o direct.', 'Stories'],
    ['Prova social: elogios e mensagens recebidas, com autorização.', 'Stories'],
    ['Poste uma novidade no Google Meu Negócio e peça uma avaliação.', 'Google'],
    ['Revisão: quantas conversas e propostas vieram do conteúdo? Anote no Negócio do mês.', 'Análise'],
    ['Uma oferta de entrada: um serviço simples para quem quer começar com você.', 'Reels'],
    ['“Quanto custa?”: explique o que influencia o seu preço.', 'Reels'],
    ['Chamada direta, por exemplo “tenho 3 vagas este mês” (só se for verdade).', 'Stories'],
  ] },
  { fase: 'Consolidar', cor: '#F59E0B', dias: [
    ['Recicle o seu melhor conteúdo com um gancho novo.', 'Reels'],
    ['Comece uma série de 3 partes sobre um tema.', 'Reels'],
    ['Parte 2 da série.', 'Reels'],
    ['Parte 3 da série.', 'Reels'],
    ['Sua evolução: o primeiro vídeo do desafio ao lado do de hoje.', 'Reels'],
    ['Planeje os próximos 30 dias no calendário editorial.', 'Planejamento'],
    ['Compare o dia 1 com hoje: seguidores, alcance e contratos.', 'Análise'],
    ['3 lições que você tira do desafio.', 'Carrossel'],
    ['Agradeça e convide quem acompanhou para o próximo passo.', 'Stories'],
    ['Celebração: conte o resultado do desafio e marque o @aritamende.s.', 'Reels'],
  ] },
]
export const D60 = DESAFIO60.flatMap((f, i) => f.dias.map(([t, fmt], j) => ({ n: i * 10 + j + 1, t, fmt, fase: f.fase, cor: f.cor })))
