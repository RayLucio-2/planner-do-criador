# Planner do Criador · sobe o banco e as funções do Supabase para produção (Windows PowerShell)
# Uso, dentro da pasta do projeto:
#   powershell -ExecutionPolicy Bypass -File scripts\subir-producao.ps1
$ErrorActionPreference = 'Stop'
$REF = 'tjwnnzrymxmayzvmiiwe'   # projeto Planner do Criador
$SB = 'supabase@3.0.0'

function Titulo($t) { Write-Host ""; Write-Host "== $t ==" -ForegroundColor Cyan }
function Ok($t) { Write-Host "OK  $t" -ForegroundColor Green }
function Rodar([string[]]$a) {
  & npx --yes $SB @a
  if ($LASTEXITCODE -ne 0) { throw "O comando 'supabase $($a -join ' ')' falhou. Copie a mensagem acima e me mande." }
}
function Segredo($p) {
  $s = Read-Host -AsSecureString $p
  [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s))
}

Titulo '1/6 · Login no Supabase (abre o navegador)'
Rodar @('login')

Titulo "2/6 · Ligando esta pasta ao projeto $REF"
Rodar @('link', '--project-ref', $REF)
Ok 'Projeto ligado'

Titulo '3/6 · Criando as tabelas e as regras de segurança'
Rodar @('db', 'push', '--remote', '--yes')
Ok 'Banco atualizado'

Titulo '4/6 · Segredos das funções'
Write-Host 'Deixe em branco (só aperte Enter) o que ainda não tiver. Dá para rodar este script de novo depois.'
$stripeSk = Segredo 'Stripe secret key (sk_test_... ou sk_live_...)'
$stripeWh = Segredo 'Stripe webhook secret (whsec_...)'
$contato = Read-Host 'E-mail de contato para os lembretes'
if (-not $contato) { $contato = 'contato@exemplo.com' }
Write-Host 'Gerando as chaves dos lembretes...'
$vapid = (& npx --yes web-push@3.6.7 generate-vapid-keys --json) | Out-String | ConvertFrom-Json
$bytes = New-Object byte[] 24; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$cronKey = -join ($bytes | ForEach-Object { $_.ToString('x2') })
$args2 = @('secrets', 'set', "VAPID_PUBLIC_KEY=$($vapid.publicKey)", "VAPID_PRIVATE_KEY=$($vapid.privateKey)", "VAPID_SUBJECT=mailto:$contato", "CRON_KEY=$cronKey")
if ($stripeSk) { $args2 += "STRIPE_SECRET_KEY=$stripeSk" }
if ($stripeWh) { $args2 += "STRIPE_WEBHOOK_SECRET=$stripeWh" }
Rodar $args2
Ok 'Segredos salvos no Supabase'

Titulo '5/6 · Publicando as funções'
foreach ($f in @('assinatura-webhook', 'excluir-conta', 'lembretes', 'enviar-amostra', 'asaas-webhook', 'asaas-checkout', 'asaas-cancelar', 'comprar-pdf', 'baixar-pdf')) { Rodar @('functions', 'deploy', $f, '--use-api') }
Ok 'Funções publicadas'

Titulo '6/6 · Agendando os lembretes (a cada hora)'
$sql = @"
create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.unschedule('lembretes-planner') where exists (select 1 from cron.job where jobname = 'lembretes-planner');
select cron.schedule('lembretes-planner', '0 * * * *', `$`$
  select net.http_post(
    url := 'https://$REF.supabase.co/functions/v1/lembretes',
    headers := jsonb_build_object('Content-Type','application/json','x-cron-key','$cronKey'),
    body := '{}'::jsonb);
`$`$);
"@
$arq = Join-Path (Get-Location) 'supabase\.agendar-lembretes.sql'
[IO.File]::WriteAllText($arq, $sql, (New-Object Text.UTF8Encoding($false)))
& npx --yes $SB db query --remote --yes -f $arq | Out-Null
if ($LASTEXITCODE -eq 0) { Ok 'Lembretes agendados'; Remove-Item $arq }
else {
  Write-Host 'Não consegui agendar pela linha de comando.' -ForegroundColor Yellow
  Write-Host "Abra o SQL Editor do Supabase, cole o conteúdo de $arq e clique em Run. Depois apague o arquivo."
}

Titulo 'Pronto! Guarde estes valores'
Write-Host 'No Netlify (Site configuration › Environment variables):'
Write-Host "  VITE_VAPID_PUBLIC_KEY=$($vapid.publicKey)"
Write-Host ''
Write-Host 'Webhook do Stripe (Developers › Webhooks):'
Write-Host "  https://$REF.supabase.co/functions/v1/assinatura-webhook"
Write-Host '  eventos: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted'
