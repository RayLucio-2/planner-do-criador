#!/usr/bin/env bash
# Planner do Criador · sobe o banco e as funções do Supabase para produção.
# Uso (Git Bash no Windows, ou terminal no Mac/Linux), dentro da pasta do projeto:
#   bash scripts/subir-producao.sh
# Pré-requisitos: Node.js instalado e uma conta no Supabase com o projeto criado.
set -euo pipefail

cyan(){ printf "\033[36m%s\033[0m\n" "$*"; }
ok(){ printf "\033[32m✔ %s\033[0m\n" "$*"; }
ask(){ local v; read -r -p "$1: " v; echo "$v"; }
askhide(){ local v; read -r -s -p "$1: " v; echo >&2; echo "$v"; }

SB="npx --yes supabase@3.0.0"

cyan "== 1/6 · Login no Supabase (abre o navegador) =="
$SB login

cyan "== 2/6 · Ligando esta pasta ao seu projeto =="
REF="${REF:-tjwnnzrymxmayzvmiiwe}"   # projeto Planner do Criador
echo "Projeto: $REF"
$SB link --project-ref "$REF"
ok "Projeto ligado"

cyan "== 3/6 · Criando as tabelas e regras de segurança =="
$SB db push --remote --yes
ok "Banco atualizado"

cyan "== 4/6 · Segredos das funções =="
echo "Deixe em branco o que ainda não tiver (dá para rodar este script de novo depois)."
STRIPE_SK=$(askhide "Stripe secret key (sk_live_... ou sk_test_...)")
STRIPE_WH=$(askhide "Stripe webhook secret (whsec_...)")
echo "Gerando chaves dos lembretes (VAPID)..."
VAPID_JSON=$(npx --yes web-push@3.6.7 generate-vapid-keys --json)
VAPID_PUB=$(echo "$VAPID_JSON" | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).publicKey))")
VAPID_PRIV=$(echo "$VAPID_JSON" | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).privateKey))")
CONTATO=$(ask "E-mail de contato para os lembretes (ex.: contato@seusite.com.br)")
CRON_KEY=$(node -e "console.log(require('crypto').randomBytes(24).toString('hex'))")
ARGS=(VAPID_PUBLIC_KEY="$VAPID_PUB" VAPID_PRIVATE_KEY="$VAPID_PRIV" VAPID_SUBJECT="mailto:$CONTATO" CRON_KEY="$CRON_KEY")
[ -n "$STRIPE_SK" ] && ARGS+=(STRIPE_SECRET_KEY="$STRIPE_SK")
[ -n "$STRIPE_WH" ] && ARGS+=(STRIPE_WEBHOOK_SECRET="$STRIPE_WH")
$SB secrets set "${ARGS[@]}"
ok "Segredos salvos no Supabase"

cyan "== 5/6 · Publicando as funções =="
for f in assinatura-webhook excluir-conta lembretes enviar-amostra asaas-webhook asaas-checkout asaas-cancelar comprar-pdf baixar-pdf; do $SB functions deploy "$f" --use-api; done
ok "Funções publicadas"

cyan "== 6/6 · Agendando os lembretes (a cada hora) =="
cat > supabase/.agendar-lembretes.sql <<SQL
create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.unschedule('lembretes-planner') where exists (select 1 from cron.job where jobname = 'lembretes-planner');
select cron.schedule('lembretes-planner', '0 * * * *', \$\$
  select net.http_post(
    url := 'https://$REF.supabase.co/functions/v1/lembretes',
    headers := jsonb_build_object('Content-Type','application/json','x-cron-key','$CRON_KEY'),
    body := '{}'::jsonb);
\$\$);
SQL
if $SB db query --remote --yes -f supabase/.agendar-lembretes.sql >/dev/null 2>&1; then
  ok "Lembretes agendados"; rm -f supabase/.agendar-lembretes.sql
else
  echo "Não consegui agendar pela linha de comando."
  echo "Abra o SQL Editor do Supabase, cole o conteúdo de supabase/.agendar-lembretes.sql e clique em Run. Depois apague o arquivo."
fi

echo
cyan "== Pronto! Agora copie estes valores para o Netlify (Site configuration › Environment variables) =="
echo "VITE_SUPABASE_URL=https://$REF.supabase.co"
echo "VITE_SUPABASE_ANON_KEY=(Project Settings › API › anon public)"
echo "VITE_VAPID_PUBLIC_KEY=$VAPID_PUB"
echo
echo "Webhook do Stripe (Developers › Webhooks):"
echo "  https://$REF.supabase.co/functions/v1/assinatura-webhook"
echo "  eventos: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted"
