-- Planner do Criador · parte 8: e-mails automáticos, motivo do cancelamento e "indique uma amiga"

alter table public.subscriptions
  add column if not exists criada_em timestamptz not null default now(),
  add column if not exists email_boasvindas_em timestamptz,
  add column if not exists email_cartao_em timestamptz,
  add column if not exists email_cobranca_em timestamptz,
  add column if not exists cancel_motivo text,
  add column if not exists cancelado_em timestamptz,
  add column if not exists meses_gratis int not null default 0;

-- quem já tem conta não recebe boas-vindas nem o lembrete do cartão agora
update public.subscriptions set email_boasvindas_em = coalesce(email_boasvindas_em, now()), email_cartao_em = coalesce(email_cartao_em, now());

-- indicações: quem indicou, quem foi indicada e se o prêmio (1 mês grátis para as duas) já saiu
create table if not exists public.indicacoes (
  id uuid primary key default gen_random_uuid(),
  indicadora uuid not null references auth.users on delete cascade,
  indicada uuid not null unique references auth.users on delete cascade,
  status text not null default 'aguardando',   -- aguardando | premiada
  criada_em timestamptz not null default now(),
  premiada_em timestamptz
);
alter table public.indicacoes enable row level security;
drop policy if exists "ver as minhas indicações" on public.indicacoes;
create policy "ver as minhas indicações" on public.indicacoes for select using (auth.uid() = indicadora);

-- conta nova: cria a assinatura (ainda sem acesso) e registra quem indicou, se veio por um link de indicação
create or replace function public.nova_conta() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  ref text := lower(coalesce(new.raw_user_meta_data->>'ref', ''));
  quem uuid;
begin
  insert into public.subscriptions (user_id, status, trial_end, termos_aceitos_em)
  values (new.id, 'pendente', null,
          case when (new.raw_user_meta_data->>'termos') = 'sim' then now() end)
  on conflict (user_id) do nothing;
  if ref ~ '^[0-9a-f]{8}$' then
    select id into quem from auth.users where id::text like ref || '%' and id <> new.id limit 1;
    if quem is not null then
      insert into public.indicacoes (indicadora, indicada) values (quem, new.id) on conflict (indicada) do nothing;
    end if;
  end if;
  return new;
end $$;
