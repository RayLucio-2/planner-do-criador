-- Planner do Criador · parte 2 (rode depois do 001)

-- 1) Salvar só os campos alterados (dois aparelhos não se atropelam)
create or replace function public.merge_entries(p jsonb, p_replace text[] default '{}')
returns void language plpgsql security invoker set search_path = public as $$
declare k text; v jsonb;
begin
  for k, v in select * from jsonb_each(p) loop
    insert into public.entries (user_id, key, data, updated_at)
    values (auth.uid(), k, v, now())
    on conflict (user_id, key) do update
      set data = case when k = any(p_replace) then excluded.data else public.entries.data || excluded.data end,
          updated_at = now();
  end loop;
end $$;
grant execute on function public.merge_entries(jsonb, text[]) to authenticated;

-- 2) Tempo real: o celular recebe na hora o que foi editado no computador
do $$ begin
  alter publication supabase_realtime add table public.entries;
exception when duplicate_object then null; end $$;

-- 3) Lembretes (notificações no celular)
create table if not exists public.push_subscriptions (
  endpoint text primary key,
  user_id uuid not null references auth.users on delete cascade,
  p256dh text not null,
  auth text not null,
  hora smallint not null default 9,            -- hora local do lembrete diário (0–23)
  fuso text not null default 'America/Sao_Paulo',
  post_do_dia boolean not null default true,
  fim_do_mes boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
drop policy if exists "minhas notificações" on public.push_subscriptions;
create policy "minhas notificações" on public.push_subscriptions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 4) Leads da isca (e-mail de quem baixou o PDF grátis)
create table if not exists public.leads (
  id bigint generated always as identity primary key,
  email text not null,
  nome text,
  origem text default 'isca-pdf',
  consentimento boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.leads enable row level security;
drop policy if exists "qualquer pessoa pode se cadastrar" on public.leads;
create policy "qualquer pessoa pode se cadastrar" on public.leads for insert to anon, authenticated with check (consentimento = true);
-- (ninguém lê os leads pelo app; você vê em Table Editor > leads)

-- 5) Aceite dos termos
alter table public.subscriptions add column if not exists termos_aceitos_em timestamptz;
create or replace function public.nova_conta() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.subscriptions (user_id, status, trial_end, termos_aceitos_em)
  values (new.id, 'trialing', now() + interval '7 days',
          case when (new.raw_user_meta_data->>'termos') = 'sim' then now() end)
  on conflict (user_id) do nothing;
  return new;
end $$;

-- 6) Agendar os lembretes (a cada hora, no minuto 0).
-- Antes, ative as extensões pg_cron e pg_net em Database > Extensions e troque SEU-PROJETO e SUA-CHAVE-CRON:
-- select cron.schedule('lembretes-planner', '0 * * * *', $$
--   select net.http_post(
--     url := 'https://SEU-PROJETO.supabase.co/functions/v1/lembretes',
--     headers := jsonb_build_object('Content-Type','application/json','x-cron-key','SUA-CHAVE-CRON'),
--     body := '{}'::jsonb);
-- $$);
