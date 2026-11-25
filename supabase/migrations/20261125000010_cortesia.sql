-- Planner do Criador · parte 10: acesso cortesia dado pela equipe (pelo Perfil do app)

-- cortesias para quem ainda não tem conta: aplicadas sozinhas quando a pessoa se cadastrar com este e-mail
create table if not exists public.cortesias (
  email text primary key,
  dias int not null check (dias between 1 and 730),
  criada_em timestamptz not null default now(),
  aplicada_em timestamptz
);
alter table public.cortesias enable row level security;   -- só a função "cortesia" (service role) lê e escreve

-- conta nova: cria a assinatura, aplica cortesia pendente e registra quem indicou
create or replace function public.nova_conta() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  ref text := lower(coalesce(new.raw_user_meta_data->>'ref', ''));
  quem uuid;
  c public.cortesias%rowtype;
begin
  insert into public.subscriptions (user_id, status, trial_end, termos_aceitos_em)
  values (new.id, 'pendente', null,
          case when (new.raw_user_meta_data->>'termos') = 'sim' then now() end)
  on conflict (user_id) do nothing;
  select * into c from public.cortesias where email = lower(new.email) and aplicada_em is null;
  if found then
    update public.subscriptions set status = 'active', provider = 'cortesia', trial_end = null,
      current_period_end = now() + make_interval(days => c.dias), pagou_em = now(),
      email_cartao_em = now(), updated_at = now()
    where user_id = new.id;
    update public.cortesias set aplicada_em = now() where email = c.email;
  end if;
  if ref ~ '^[0-9a-f]{8}$' then
    select id into quem from auth.users where id::text like ref || '%' and id <> new.id limit 1;
    if quem is not null then
      insert into public.indicacoes (indicadora, indicada) values (quem, new.id) on conflict (indicada) do nothing;
    end if;
  end if;
  return new;
end $$;

-- procura a conta pelo e-mail (só a service role usa)
create or replace function public.id_por_email(e text) returns uuid
language sql security definer set search_path = public, auth as $$
  select id from auth.users where lower(email) = lower(e) limit 1
$$;
revoke all on function public.id_por_email(text) from public, anon, authenticated;
