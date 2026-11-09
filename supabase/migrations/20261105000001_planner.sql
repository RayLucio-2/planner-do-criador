-- Planner do Criador 2027 · banco de dados (cole no SQL Editor do Supabase e clique em Run)

-- 1) Assinaturas: cada conta nova ganha um teste grátis
create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users on delete cascade,
  status text not null default 'trialing',          -- trialing | active | past_due | canceled
  trial_end timestamptz,
  current_period_end timestamptz,
  provider text,                                     -- ex.: stripe
  provider_customer_id text,
  provider_subscription_id text,
  updated_at timestamptz not null default now()
);
alter table public.subscriptions enable row level security;
drop policy if exists "ler a própria assinatura" on public.subscriptions;
create policy "ler a própria assinatura" on public.subscriptions for select using (auth.uid() = user_id);
-- (ninguém escreve aqui pelo app: só o webhook de pagamento, com a service role)

-- 2) Função que diz se a pessoa tem acesso agora
create or replace function public.tem_acesso(uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from subscriptions s where s.user_id = uid and (
      (s.status = 'trialing' and s.trial_end > now()) or
      (s.status = 'active' and (s.current_period_end is null or s.current_period_end > now() - interval '3 days')) or
      (s.status in ('canceled','past_due') and s.current_period_end > now())
    )
  );
$$;

-- 3) Tudo o que a pessoa preenche no planner (uma linha por página)
create table if not exists public.entries (
  user_id uuid not null references auth.users on delete cascade,
  key text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);
alter table public.entries enable row level security;
drop policy if exists "ler os próprios dados" on public.entries;
drop policy if exists "criar com acesso" on public.entries;
drop policy if exists "editar com acesso" on public.entries;
drop policy if exists "apagar os próprios dados" on public.entries;
create policy "ler os próprios dados" on public.entries for select using (auth.uid() = user_id);
create policy "criar com acesso" on public.entries for insert with check (auth.uid() = user_id and public.tem_acesso(auth.uid()));
create policy "editar com acesso" on public.entries for update using (auth.uid() = user_id) with check (auth.uid() = user_id and public.tem_acesso(auth.uid()));
create policy "apagar os próprios dados" on public.entries for delete using (auth.uid() = user_id);

-- 4) Ao criar conta: começa o teste grátis de 7 dias (mude o intervalo se quiser)
create or replace function public.nova_conta() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.subscriptions (user_id, status, trial_end)
  values (new.id, 'trialing', now() + interval '7 days')
  on conflict (user_id) do nothing;
  return new;
end $$;
drop trigger if exists ao_criar_conta on auth.users;
create trigger ao_criar_conta after insert on auth.users for each row execute function public.nova_conta();

-- Para liberar alguém manualmente (ex.: você, a Arita, testes):
-- update public.subscriptions set status = 'active', current_period_end = '2027-12-31'
--   where user_id = (select id from auth.users where email = 'email@exemplo.com');
