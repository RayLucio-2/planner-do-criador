-- Planner do Criador · parte 4: registra quando o e-mail da amostra grátis foi enviado
alter table public.leads add column if not exists email_enviado_em timestamptz;
create index if not exists leads_email_idx on public.leads (lower(email));
create index if not exists leads_enviado_idx on public.leads (email_enviado_em);
