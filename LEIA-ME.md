# Planner do Criador · site + app (PWA)

Um único projeto que é ao mesmo tempo:

- **Site de vendas** (`/`): telas reais do app, como funciona, recursos, amostra grátis em PDF (captura de e-mail), preço, perguntas frequentes, termos e privacidade.
- **App do planner** (`/#/app`): calendário editorial, roteiros ilimitados, análise e negócio do mês com somas automáticas, guia, ferramentas, revisões e retrospectiva do ano.
- **App instalável no celular** (PWA): Android e iPhone instalam pelo navegador, sem loja, e abre offline.

**Para colocar no ar, siga o arquivo `PRODUCAO.md` (passo a passo com script automático).**

Sem configurar nada, ele roda em **modo demonstração** (dados só no aparelho).

## O que tem de novo nesta versão

| Recurso | Como funciona |
|---|---|
| **Uso contínuo** | Seletor de ano no topo. Cada ano tem seus meses, metas e revisões; perfil, público, guia, escada de equipamento, ideias e notas valem para todos os anos. Feriados móveis (Carnaval, Páscoa, Corpus Christi, Dia das Mães e dos Pais, Black Friday) são calculados para cada ano. Os dados de 2027 continuam onde estão. |
| **Dois aparelhos ao mesmo tempo** | O app envia só os campos alterados e o banco junta com o que já existe. O outro aparelho recebe a mudança na hora (tempo real) e também ao voltar para o app. Se os dois editarem o mesmo campo, vale a última edição. |
| **Primeiro acesso** | Passo a passo em 4 telas: perfil (nome, @, bio), público (para quem cria e a maior dor), notas de “Onde estou hoje” e lembretes. Dá para pular. |
| **Lembretes** | Notificação no celular com o post planejado do dia (no horário que a pessoa escolher) e aviso para fazer a Análise no último dia do mês. No iPhone, só com o app instalado na tela inicial. |
| **Termos e privacidade** | Páginas `/termos` e `/privacidade` (rascunho para você revisar), aceite obrigatório no cadastro (guardado com data) e **Excluir minha conta** no Perfil, que cancela a assinatura no Stripe e apaga tudo. |
| **Página de vendas** | Prints reais do app (com dados de exemplo), “como funciona”, captura de e-mail para a amostra em PDF. |
| **Medição** | Google Analytics 4 e Pixel da Meta, carregados só se a pessoa aceitar os cookies. Eventos: visita de página, lead (amostra), cadastro, início do teste e início do pagamento. |
| **Isca** | `public/planner-do-criador-amostra-gratis.pdf`: capa, guia completo, 90 dias e janeiro inteiro, interativo, com uma página final levando para o app. |

## 1. Rodar no computador

```bash
npm install
npm run dev        # http://localhost:5173
```

## 2. Supabase

1. Crie um projeto em supabase.com.
2. Em **SQL Editor**, rode **em ordem** `20261105000001_planner.sql`, `20261105000002_sync_lembretes_conta.sql` e `20261105000003_seguranca.sql` (pasta `supabase/migrations/`).
3. **Authentication › URL Configuration**: coloque o endereço do site em *Site URL* e em *Redirect URLs*.
4. **Project Settings › API**: copie a *Project URL* e a *anon public key* para o `.env` (veja `.env.example`).
5. Para liberar alguém sem pagamento, use o comando no fim do `20261105000001_planner.sql`.

### E-mails (faça antes de lançar)

O e-mail que vem com o Supabase envia pouquíssimas mensagens por hora e cai no spam com facilidade.

1. Crie uma conta no **Resend** (resend.com), adicione e verifique o seu domínio.
2. No Supabase: **Authentication › Emails › SMTP Settings** › ative *Custom SMTP*:
   host `smtp.resend.com`, porta `465`, usuário `resend`, senha = sua API key do Resend, remetente `planner@seudominio.com.br`, nome `Planner do Criador`.
3. Em **Authentication › Emails › Templates**, cole os modelos em português da pasta `supabase/emails/`:
   *Confirm signup* → `confirmar-cadastro.html`, *Reset password* → `recuperar-senha.html`, *Change email* → `trocar-email.html`, *Magic link* → `link-de-acesso.html`.
   Sugestões de assunto: “Confirme seu e-mail · Planner do Criador”, “Crie uma nova senha”, “Confirme o novo e-mail”, “Seu link para entrar”.

## 3. Assinatura (Stripe)

1. Crie o **Produto** com preço mensal em BRL e um **Payment Link** → `VITE_CHECKOUT_URL`.
2. Ative o **Portal do cliente** → `VITE_PORTAL_URL`.
3. Publique as funções:

```bash
npm i -g supabase
supabase login
supabase link --project-ref SEU-PROJETO
supabase secrets set STRIPE_SECRET_KEY=sk_live_... STRIPE_WEBHOOK_SECRET=whsec_...
supabase functions deploy assinatura-webhook --no-verify-jwt
supabase functions deploy excluir-conta
```

4. No Stripe, **Developers › Webhooks**: endpoint `https://SEU-PROJETO.supabase.co/functions/v1/assinatura-webhook` com os eventos `checkout.session.completed`, `customer.subscription.updated` e `customer.subscription.deleted`.

## 4. Lembretes

```bash
npx web-push generate-vapid-keys      # gera uma chave pública e uma privada
supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:seu@email.com CRON_KEY=invente-uma-senha
supabase functions deploy lembretes --no-verify-jwt
```

- Coloque a chave **pública** em `VITE_VAPID_PUBLIC_KEY`.
- Em **Database › Extensions**, ative `pg_cron` e `pg_net`.
- Rode o bloco comentado no fim do `20261105000002_sync_lembretes_conta.sql` (troque SEU-PROJETO e a CRON_KEY). Ele chama a função a cada hora; cada pessoa recebe no horário que escolheu, no fuso dela.

## 5. Medição

- **Google Analytics**: crie uma propriedade GA4 e um fluxo Web; copie o ID `G-...` para `VITE_GA_ID`.
- **Pixel da Meta**: no Gerenciador de Eventos, crie o pixel e copie o número para `VITE_META_PIXEL_ID`.
- Sem esses IDs, o aviso de cookies nem aparece.

## 6. Termos e privacidade

As páginas são um **rascunho para revisão jurídica**. Preencha `VITE_EMPRESA`, `VITE_CNPJ`, `VITE_EMAIL_CONTATO` e `VITE_CIDADE` e revise o texto em `src/pages/Legal.jsx` (data de atualização no topo do arquivo).

## 7. Segurança: ajustes no painel do Supabase

O código já vem protegido (veja a lista abaixo). Estes ajustes são feitos por você no painel, uma vez:

- **Authentication › Providers › Email**: deixe *Confirm email* ligado.
- **Authentication › Policies** (ou *Password Security*): senha mínima de **8** caracteres e, se o plano permitir, ative *Leaked password protection* (bloqueia senhas que já vazaram).
- **Authentication › Rate Limits**: confira os limites de cadastro e de envio de e-mail.
- **Authentication › Attack Protection**: se começar a aparecer cadastro falso ou spam na amostra grátis, ative o CAPTCHA (Cloudflare Turnstile). Me avise que eu ligo no formulário.
- **Project Settings › API**: nunca coloque a *service_role key* no `.env` do site. Ela só vai nos segredos das funções (`supabase secrets set`).
- **Backups**: o plano Pro faz backup diário automático. No plano grátis, exporte o banco de vez em quando (Database › Backups).

### O que o código já faz
- Cada conta só lê e grava os próprios dados (regras RLS no banco, testadas).
- Sem teste ou assinatura ativa, o banco recusa novas gravações, mesmo que alguém mexa no app.
- Ninguém consegue alterar a própria assinatura: só o webhook do Stripe, com assinatura verificada.
- Limites de tamanho nos dados e validação de e-mail na amostra grátis.
- Ao sair, o app apaga a cópia dos dados guardada no aparelho.
- Cabeçalhos de segurança no Netlify (`public/_headers`): HTTPS obrigatório, bloqueio de iframe e uma política (CSP) que só deixa rodar scripts do próprio site, do Google Analytics e da Meta.
- Pixel e Analytics só carregam com o aceite dos cookies.

## 8. Publicar no Netlify

1. Suba a pasta para um repositório no GitHub.
2. Netlify › *Add new site › Import from Git*. O `netlify.toml` já tem o comando e a pasta.
3. Cadastre as variáveis do `.env` em *Site configuration › Environment variables*.
4. Deploy. Site, app e PDF da amostra ficam no mesmo endereço.

Depois de ter o endereço final, posso gerar de novo o PDF da amostra com o botão levando direto para o site (hoje ele leva para o Instagram @aritamende.s).

## Onde mexer

| O quê | Arquivo |
|---|---|
| Textos das lições, focos do mês, feriados | `src/data/content.js` |
| Página de vendas | `src/pages/Landing.jsx` (prints em `src/assets/prints/`) |
| Termos e privacidade | `src/pages/Legal.jsx` |
| Primeiro acesso | `src/pages/app/BoasVindas.jsx` |
| Ferramentas | `src/pages/app/Ferramentas.jsx` |
| Páginas do mês | `src/pages/app/Mes.jsx` |
| Sincronização e anos | `src/lib/store.js` |
| Lembretes | `src/lib/push.js`, `src/components/Lembretes.jsx`, `supabase/functions/lembretes/` |
| Medição | `src/lib/analytics.js` |
| Cores e visual | `src/styles.css` |
