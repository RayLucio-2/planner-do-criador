# Colocar o Planner do Criador no ar

Siga na ordem. Tempo total: cerca de 1h30. Você vai precisar de contas no **GitHub**, **Supabase**, **Netlify** e **Asaas** (todas têm plano gratuito para começar).

No computador, instale o **Node.js 20** (nodejs.org) e o **Git** (git-scm.com). No Windows, use o **Git Bash** para os comandos.

---

## 1. Código no GitHub

Dentro da pasta do projeto:

```bash
git init
git add .
git commit -m "Planner do Criador"
git branch -M main
git remote add origin https://github.com/RayLucio-2/planner-do-criador.git
git push -u origin main
```

Se o repositório já tiver um README, rode antes do push: `git pull origin main --allow-unrelated-histories --no-edit`.

## 2. Supabase (banco, login e funções)

1. Em supabase.com, crie um projeto. Região: **South America (São Paulo)**. Anote a **senha do banco**.
2. Na pasta do projeto, rode:

**Windows (PowerShell):**

```powershell
npm install
powershell -ExecutionPolicy Bypass -File scripts\subir-producao.ps1
```

**Mac, Linux ou Git Bash:**

```bash
npm install
bash scripts/subir-producao.sh
```

O script faz tudo sozinho:
- entra na sua conta (abre o navegador);
- cria as tabelas e as regras de segurança;
- gera as chaves dos lembretes;
- publica as 3 funções;
- agenda os lembretes de hora em hora.

Nas perguntas do Stripe, só aperte Enter (o pagamento agora é pelo Asaas). No fim, ele mostra os valores que vão para o Netlify. **Copie e guarde.**

3. No painel do Supabase:
   - **Authentication › Providers › Email**: *Confirm email* ligado.
   - **Authentication › Policies**: senha mínima **8**; *Leaked password protection* ligado, se o plano permitir.

## 3. E-mails (Resend)

1. Em resend.com, adicione e verifique o seu domínio (ele mostra os registros DNS para copiar).
2. Supabase › **Authentication › Emails › SMTP Settings** › *Enable Custom SMTP*:
   - Host `smtp.resend.com` · Porta `465` · Usuário `resend` · Senha: sua API key do Resend
   - Remetente: `planner@seudominio.com.br` · Nome: `Planner do Criador`
3. **Authentication › Emails › Templates**: cole os arquivos da pasta `supabase/emails/`.

Sem domínio próprio ainda? Pule este passo para testar, mas não lance sem ele: o e-mail padrão do Supabase envia poucas mensagens por hora.

## 4. Asaas (assinatura com cartão e 7 dias grátis)

Como funciona: a pessoa cria a conta, cadastra o cartão na página segura do Asaas e usa 7 dias grátis. A 1ª cobrança é no 8º dia. Se ela cancelar antes (Perfil › Assinatura), não paga nada. Os dados do cartão nunca passam pelo site.

1. **Chave de API:** Asaas › Integrações › Chaves de API › gerar. Começa com `$aact_`.
2. **Webhook:** Asaas › Integrações › Webhooks › novo:
   - URL: `https://tjwnnzrymxmayzvmiiwe.supabase.co/functions/v1/asaas-webhook`
   - Token de autenticação: invente uma senha longa e guarde
   - Fila de sincronização: ativada · Versão da API: v3
   - Eventos: `CHECKOUT_PAID`, `SUBSCRIPTION_CREATED`, `SUBSCRIPTION_UPDATED`, `SUBSCRIPTION_INACTIVATED`, `SUBSCRIPTION_DELETED`, `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE`, `PAYMENT_CREDIT_CARD_CAPTURE_REFUSED`, `PAYMENT_REFUNDED`
3. **Chave PIX:** Asaas › Pix › cadastre uma chave (sem ela o PDF não aceita PIX).
4. **Site da conta:** Asaas › Minha conta › Informações: coloque `https://plannerdocriador.netlify.app` no campo do site. O Asaas só volta para o endereço cadastrado.
5. **Segredos no Supabase** (o PowerShell pergunta a chave e o token, sem você editar o comando):

```powershell
$k = Read-Host 'Cole a chave do Asaas'
$t = Read-Host 'Cole o token do webhook'
npx --yes supabase@3.0.0 secrets set "ASAAS_API_KEY=$k" "ASAAS_WEBHOOK_TOKEN=$t" ASAAS_VALOR=19.90 ASAAS_VALOR_PDF=8.99 SITE_URL=https://plannerdocriador.netlify.app
```

6. **Testar no sandbox** (sandbox.asaas.com, conta separada): use a chave e o webhook do sandbox e acrescente no comando `ASAAS_API_URL=https://api-sandbox.asaas.com/v3 ASAAS_CHECKOUT_URL=https://sandbox.asaas.com`. Para ir para produção, rode o comando acima com a chave real e depois `npx --yes supabase@3.0.0 secrets unset ASAAS_API_URL ASAAS_CHECKOUT_URL`.

### Venda do PDF (R$ 8,99)

1. Supabase › **Storage › produtos** › *Upload file*: envie o PDF completo com o nome `planner-do-criador-2027.pdf`. A pasta é privada: só quem pagou recebe um link temporário.
2. A pessoa preenche nome, e-mail e CPF na página inicial, paga no Asaas (PIX ou cartão) e volta para a página de obrigado com o botão de download. O link também chega por e-mail.
3. As compras ficam em Table Editor › `compras_pdf` (status `pendente`, `pago` ou `estornado`).

### Preços e Black Friday

- Exibidos no site: `netlify.toml` (`VITE_PRECO`, `VITE_PRECO_DE`, `VITE_PROMO`, `VITE_PRECO_PDF`).
- Cobrados: segredos `ASAAS_VALOR` e `ASAAS_VALOR_PDF`. Mantenha os dois lados iguais.
- **Fim da Black Friday:** no `netlify.toml`, mude `VITE_PRECO` para `R$ 29,90` e apague as linhas `VITE_PRECO_DE` e `VITE_PROMO`; depois rode `npx --yes supabase@3.0.0 secrets set ASAAS_VALOR=29.90`. Quem assinou na promoção continua com o valor que assinou.

## 5. Netlify (site)

1. **Add new site › Import an existing project › GitHub** e escolha `planner-do-criador`. O `netlify.toml` já configura o build.
2. **Site configuration › Environment variables**: o endereço e a chave publicável do Supabase já estão no `netlify.toml`. Cadastre só estas:

| Variável | Valor |
|---|---|
| `VITE_VAPID_PUBLIC_KEY` | mostrado pelo script |
| `VITE_DIAS_TESTE` | `7` |
| `VITE_EMPRESA` | `Télora Produtora` |
| `VITE_CNPJ` | CNPJ |
| `VITE_EMAIL_CONTATO` | e-mail de contato |
| `VITE_CIDADE` | `Goiânia/GO` |
| `VITE_GA_ID` | opcional, `G-...` |
| `VITE_META_PIXEL_ID` | opcional |
| `VITE_LANCADO` | `false` até o lançamento |

3. **Deploys › Trigger deploy**. Anote o endereço (ou ligue o seu domínio em *Domain management*).
4. Volte ao Supabase › **Authentication › URL Configuration**: coloque o endereço do site em *Site URL* e em *Redirect URLs*.

## 6. Atualizações automáticas (opcional, recomendado)

Com isto, todo `git push` atualiza o site (Netlify) **e** o banco e as funções (Supabase).

No GitHub: **Settings › Secrets and variables › Actions › New repository secret**:

- `SUPABASE_ACCESS_TOKEN`: supabase.com › Account › Access Tokens
- `SUPABASE_PROJECT_REF`: `tjwnnzrymxmayzvmiiwe`
- `SUPABASE_DB_PASSWORD`: a senha do banco

O arquivo `.github/workflows/producao.yml` já está pronto: ele testa se o site compila e só depois publica o Supabase.

## 7. Antes do lançamento: lista de espera

Enquanto `VITE_LANCADO` não for `true`, a página inicial é uma **lista de espera**: sem preço, sem botão de cadastro, com o formulário que guarda o e-mail (origem `lista-espera` na tabela `leads`) (a venda do PDF continua aparecendo).

- Deixe também desligado no Supabase › **Authentication › Sign In / Providers › Allow new users to sign up**, para ninguém criar conta antes da hora. Crie as contas da equipe em **Authentication › Users › Add user**.
- A tela `/#/entrar` continua funcionando para a equipe entrar e testar.

**No dia do lançamento:** ligue *Allow new users to sign up*, mude `VITE_LANCADO` para `true` no Netlify e clique em **Trigger deploy**. A página vira a versão de vendas, com preço e teste grátis. Para avisar a lista, exporte a tabela `leads` (Table Editor › Export to CSV) filtrando `origem = lista-espera`.

## 8. Teste final antes de divulgar

- [ ] Criar conta nova → chega o e-mail de confirmação → entra no passo a passo de boas-vindas
- [ ] Preencher algo no celular e ver aparecer no computador
- [ ] Ativar lembretes e receber uma notificação (mude o horário para a próxima hora cheia)
- [ ] Conta nova → tela “Comece seus 7 dias grátis” → cartão no Asaas (sandbox) → volta e libera o planner
- [ ] Perfil › Assinatura mostra “Teste grátis” e a data da 1ª cobrança
- [ ] Cancelar assinatura → continua usando até o fim do teste e não é cobrada
- [ ] Comprar o PDF (sandbox, PIX ou cartão) → página de obrigado baixa o PDF e o e-mail chega
- [ ] Excluir uma conta de teste → some de Authentication › Users
- [ ] Abrir o site no celular e instalar na tela inicial

Para liberar acesso sem pagamento (você, a Arita, testes), rode no SQL Editor:

```sql
update public.subscriptions set status = 'active', current_period_end = '2027-12-31'
where user_id = (select id from auth.users where email = 'email@exemplo.com');
```
