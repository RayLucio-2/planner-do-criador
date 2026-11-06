-- Planner do Criador · parte 3: reforços de segurança (rode depois do 002)

-- 1) Limites de tamanho: impede que alguém encha o banco com lixo
alter table public.entries drop constraint if exists entries_key_tamanho;
alter table public.entries add constraint entries_key_tamanho check (char_length(key) between 1 and 80);
alter table public.entries drop constraint if exists entries_data_tamanho;
alter table public.entries add constraint entries_data_tamanho check (pg_column_size(data) < 512000);   -- até ~500 KB por página

-- 2) Leads: e-mail válido e textos curtos
alter table public.leads drop constraint if exists leads_email_valido;
alter table public.leads add constraint leads_email_valido check (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');
alter table public.leads drop constraint if exists leads_nome_tamanho;
alter table public.leads add constraint leads_nome_tamanho check (nome is null or char_length(nome) <= 120);
alter table public.leads drop constraint if exists leads_origem_tamanho;
alter table public.leads add constraint leads_origem_tamanho check (origem is null or char_length(origem) <= 40);

-- 3) Lembretes: valores dentro do esperado
alter table public.push_subscriptions drop constraint if exists push_valores;
alter table public.push_subscriptions add constraint push_valores check (
  hora between 0 and 23 and char_length(endpoint) <= 1000 and char_length(fuso) <= 64 and endpoint like 'https://%');

-- 4) Ninguém consegue perguntar se OUTRA pessoa tem acesso.
--    As regras usam tem_meu_acesso(); a versão com parâmetro fica só para as funções do servidor.
create or replace function public.tem_meu_acesso() returns boolean
language sql stable security definer set search_path = public as $$
  select public.tem_acesso(auth.uid());
$$;
revoke execute on function public.tem_acesso(uuid) from public, anon, authenticated;
grant execute on function public.tem_acesso(uuid) to service_role;
grant execute on function public.tem_meu_acesso() to authenticated;

drop policy if exists "criar com acesso" on public.entries;
drop policy if exists "editar com acesso" on public.entries;
create policy "criar com acesso" on public.entries for insert with check (auth.uid() = user_id and public.tem_meu_acesso());
create policy "editar com acesso" on public.entries for update using (auth.uid() = user_id) with check (auth.uid() = user_id and public.tem_meu_acesso());

-- 5) A função de salvar só roda para quem está logado
revoke execute on function public.merge_entries(jsonb, text[]) from public, anon;
grant execute on function public.merge_entries(jsonb, text[]) to authenticated;
