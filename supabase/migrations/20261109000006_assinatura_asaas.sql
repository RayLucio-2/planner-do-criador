-- Planner do Criador · parte 6: assinatura pelo Asaas, com cartão e 7 dias grátis

-- 1) dados do Asaas na assinatura
alter table public.subscriptions add column if not exists checkout_id text;
create index if not exists subs_cliente_idx on public.subscriptions (provider_customer_id);
create index if not exists subs_assinatura_idx on public.subscriptions (provider_subscription_id);
create index if not exists subs_checkout_idx on public.subscriptions (checkout_id);

-- 2) conta nova começa SEM acesso: os 7 dias grátis começam quando a pessoa cadastra o cartão
create or replace function public.nova_conta() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.subscriptions (user_id, status, trial_end, termos_aceitos_em)
  values (new.id, 'pendente', null,
          case when (new.raw_user_meta_data->>'termos') = 'sim' then now() end)
  on conflict (user_id) do nothing;
  return new;
end $$;

-- 3) avisos do Asaas já processados (o Asaas pode mandar o mesmo aviso mais de uma vez)
create table if not exists public.webhook_eventos (
  id text primary key,
  evento text,
  recebido_em timestamptz not null default now()
);
alter table public.webhook_eventos enable row level security;   -- só as funções do servidor usam
