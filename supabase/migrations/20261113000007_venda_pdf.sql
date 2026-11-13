-- Planner do Criador · parte 7: venda do PDF completo (pagamento único pelo Asaas)

create table if not exists public.compras_pdf (
  id uuid primary key default gen_random_uuid(),
  token uuid not null default gen_random_uuid(),     -- vai no link de download, junto com o id
  nome text not null,
  email text not null,
  asaas_customer text,
  checkout_id text,
  payment_id text,
  valor numeric(10,2),
  status text not null default 'pendente',           -- pendente | pago | estornado
  pago_em timestamptz,
  email_enviado_em timestamptz,
  downloads int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists compras_checkout_idx on public.compras_pdf (checkout_id);
create index if not exists compras_cliente_idx on public.compras_pdf (asaas_customer);
create index if not exists compras_email_idx on public.compras_pdf (lower(email));
alter table public.compras_pdf enable row level security;   -- sem regras: só as funções do servidor acessam

-- pasta privada onde fica o PDF à venda (o arquivo é enviado pelo painel: Storage › produtos)
insert into storage.buckets (id, name, public)
values ('produtos', 'produtos', false)
on conflict (id) do nothing;
