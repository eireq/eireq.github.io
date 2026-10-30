create table if not exists public.kht_bracket (
  id integer primary key check (id = 1),
  bracket jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.kht_bracket enable row level security;

create policy "Anyone can view the KHT bracket"
  on public.kht_bracket for select
  using (true);

create policy "Only the KHT owner can edit the bracket"
  on public.kht_bracket for all
  using (auth.uid() = '00000000-0000-0000-0000-000000000000'::uuid)
  with check (auth.uid() = '00000000-0000-0000-0000-000000000000'::uuid);

-- Replace the placeholder UUID in both expressions with your Supabase user id.