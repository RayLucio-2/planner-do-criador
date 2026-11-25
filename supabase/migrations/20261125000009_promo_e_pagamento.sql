-- Planner do Criador · parte 9: preço da promoção por 12 meses e "já pagou a 1ª mensalidade"

alter table public.subscriptions
  add column if not exists pagou_em timestamptz,            -- 1ª mensalidade paga (libera o que fica bloqueado no teste)
  add column if not exists preco_promo_ate timestamptz,     -- até quando vale o preço da promoção
  add column if not exists valor_apos_promo numeric(10,2),  -- valor que passa a valer depois (vazio = já reajustado)
  add column if not exists email_reajuste_em timestamptz;   -- aviso do reajuste enviado

-- quem já está ativo já pagou
update public.subscriptions set pagou_em = coalesce(pagou_em, updated_at) where status = 'active';
