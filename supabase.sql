create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  customer_name text not null,
  phone text not null,
  protein text not null,
  plate_size text not null,
  sides text[] not null default '{}',
  lemonade_flavor text not null,
  quantity integer not null default 1,
  extra_lemonade_count integer not null default 0,
  cake_slice_count integer not null default 0,
  special_instructions text,
  order_total numeric(10, 2) not null default 0,
  paid boolean not null default false,
  status text not null default 'new',
  archived boolean not null default false
);

alter table orders enable row level security;

create policy "Anyone can insert an order"
  on orders for insert
  to anon
  with check (true);

create policy "Anyone can read orders"
  on orders for select
  to anon
  using (true);

create policy "Anyone can update orders"
  on orders for update
  to anon
  using (true)
  with check (true);

alter publication supabase_realtime add table orders;
