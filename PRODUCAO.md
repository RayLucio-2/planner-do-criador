# Colocar o Planner do Criador no ar

Siga na ordem. Tempo total: cerca de 1h30. Você vai precisar de contas no **GitHub**, **Supabase**, **Netlify**, **Stripe** e **Resend** (todas têm plano gratuito para começar).

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

Pode deixar as chaves do Stripe em branco por enquanto. No fim, ele mostra os valores que vão para o Netlify. **Copie e guarde.**

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

## 4. Stripe (assinatura)

1. **Produtos › Adicionar produto**: “Planner do Criador”, preço **recorrente mensal** em BRL.
2. **Payment Links › Criar**, com esse preço. Em *Após o pagamento*, escolha redirecionar para `https://SEU-SITE/#/app`. Copie o link.
3. **Configurações › Billing › Portal do cliente**: ative e copie o link de login do portal.
4. **Desenvolvedores › Webhooks › Adicionar endpoint**:
   - URL: `https://tjwnnzrymxmayzvmiiwe.supabase.co/functions/v1/assinatura-webhook`
   - Eventos: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copie o **Signing secret** (`whsec_...`).
5. Rode o script de novo e, desta vez, informe a **Secret key** e o **whsec_**:

```bash
bash scripts/subir-producao.sh
```

Comece com as chaves de **teste** do Stripe (`sk_test_...`), faça uma compra com o cartão `4242 4242 4242 4242` e, quando tudo funcionar, troque pelas chaves de produção.

## 5. Netlify (site)

1. **Add new site › Import an existing project › GitHub** e escolha `planner-do-criador`. O `netlify.toml` já configura o build.
2. **Site configuration › Environment variables**: o endereço e a chave publicável do Supabase já estão no `netlify.toml`. Cadastre só estas:

| Variável | Valor |
|---|---|
| `VITE_VAPID_PUBLIC_KEY` | mostrado pelo script |
| `VITE_CHECKOUT_URL` | Payment Link do Stripe |
| `VITE_PORTAL_URL` | link do portal do cliente |
| `VITE_PRECO` | ex.: `R$ 19,90` |
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

Enquanto `VITE_LANCADO` não for `true`, a página inicial é uma **lista de espera**: sem preço, sem botão de cadastro, com o formulário que guarda o e-mail (origem `lista-espera` na tabela `leads`) e libera a amostra em PDF.

- Deixe também desligado no Supabase › **Authentication › Sign In / Providers › Allow new users to sign up**, para ninguém criar conta antes da hora. Crie as contas da equipe em **Authentication › Users › Add user**.
- A tela `/#/entrar` continua funcionando para a equipe entrar e testar.

**No dia do lançamento:** ligue *Allow new users to sign up*, mude `VITE_LANCADO` para `true` no Netlify e clique em **Trigger deploy**. A página vira a versão de vendas, com preço e teste grátis. Para avisar a lista, exporte a tabela `leads` (Table Editor › Export to CSV) filtrando `origem = lista-espera`.

## 8. Teste final antes de divulgar

- [ ] Criar conta nova → chega o e-mail de confirmação → entra no passo a passo de boas-vindas
- [ ] Preencher algo no celular e ver aparecer no computador
- [ ] Ativar lembretes e receber uma notificação (mude o horário para a próxima hora cheia)
- [ ] Assinar com o cartão de teste → status muda para “Assinatura ativa”
- [ ] Cancelar pelo portal → status muda no fim do período
- [ ] Baixar a amostra grátis → o e-mail aparece em Table Editor › `leads`
- [ ] Excluir uma conta de teste → some de Authentication › Users
- [ ] Abrir o site no celular e instalar na tela inicial

Para liberar acesso sem pagamento (você, a Arita, testes), rode no SQL Editor:

```sql
update public.subscriptions set status = 'active', current_period_end = '2027-12-31'
where user_id = (select id from auth.users where email = 'email@exemplo.com');
```
