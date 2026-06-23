create table if not exists public.messages (
  id text primary key,
  title text not null,
  category text not null,
  body text not null,
  profile_name text not null,
  profile_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create index if not exists idx_messages_category on public.messages (category);
create index if not exists idx_messages_created_at on public.messages (created_at);

alter table public.messages enable row level security;

-- Si solo usas el backend con service role, estas policies no son obligatorias.
-- Se dejan listas por si luego quieres usar el cliente de Supabase en frontend.
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'messages'
      and policyname = 'Allow read messages'
  ) then
    create policy "Allow read messages"
      on public.messages
      for select
      to anon, authenticated
      using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'messages'
      and policyname = 'Allow insert messages'
  ) then
    create policy "Allow insert messages"
      on public.messages
      for insert
      to anon, authenticated
      with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'messages'
      and policyname = 'Allow update messages'
  ) then
    create policy "Allow update messages"
      on public.messages
      for update
      to anon, authenticated
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'messages'
      and policyname = 'Allow delete messages'
  ) then
    create policy "Allow delete messages"
      on public.messages
      for delete
      to anon, authenticated
      using (true);
  end if;
end $$;
