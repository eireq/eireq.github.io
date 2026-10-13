-- jWorld: private Earth sim
-- Run once in the Supabase SQL Editor.
-- Then set your invite code:
--   update public.jworld_world set invite_code = 'your-secret' where id = 1;

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.jworld_world (
  id integer primary key check (id = 1),
  name text not null default 'jWorld',
  invite_code text not null,
  created_at timestamptz not null default now()
);

insert into public.jworld_world (id, name, invite_code)
values (1, 'jWorld', 'change-me')
on conflict (id) do nothing;

create table if not exists public.jworld_members (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  password_hash text,
  is_admin boolean not null default false,
  token uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now(),
  constraint jworld_members_name_len check (
    char_length(trim(display_name)) between 1 and 40
  )
);

create unique index if not exists jworld_members_name_unique
  on public.jworld_members (lower(trim(display_name)));

-- Seed admin by display name when present.
update public.jworld_members
set is_admin = true
where lower(trim(display_name)) = 'eire';

create table if not exists public.jworld_countries (
  id uuid primary key default gen_random_uuid(),
  owner_member_id uuid not null references public.jworld_members (id) on delete cascade,
  official_name text not null default 'Unnamed Country',
  common_names text not null default '',
  motto text not null default '',
  short_description text not null default '',
  lore text not null default '',
  leader text not null default '',
  memberships text not null default '',
  capital text not null default '',
  population text not null default '',
  languages text not null default '',
  religion jsonb not null default '{}'::jsonb,
  currency text not null default '',
  land_area text not null default '',
  cctlds text not null default '',
  timezones text not null default '',
  driving_side text not null default '',
  phone_codes text not null default '',
  politics jsonb not null default '{}'::jsonb,
  government jsonb not null default '{}'::jsonb,
  geography jsonb not null default '{}'::jsonb,
  symbols jsonb not null default '{}'::jsonb,
  geometry jsonb not null default '{"type":"Polygon","coordinates":[]}'::jsonb,
  flag_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists jworld_countries_owner_idx
  on public.jworld_countries (owner_member_id);

alter table public.jworld_world enable row level security;
alter table public.jworld_members enable row level security;
alter table public.jworld_countries enable row level security;

-- No direct table reads for world/members (invite_code + tokens stay private).
-- Countries are readable; mutations go through RPCs below.

drop policy if exists "Public can read jworld world meta" on public.jworld_world;
drop policy if exists "Public can read jworld members" on public.jworld_members;

drop policy if exists "Public can read jworld countries" on public.jworld_countries;
-- Countries are only listed via jworld_list_countries(token).

create or replace function public.jworld_member_from_token(p_token uuid)
returns public.jworld_members
language plpgsql
security definer
set search_path = public
as $$
declare
  m public.jworld_members;
begin
  select * into m from public.jworld_members where token = p_token;
  if m.id is null then
    raise exception 'Invalid session token';
  end if;
  return m;
end;
$$;

create or replace function public.jworld_session_payload(m public.jworld_members)
returns jsonb
language sql
immutable
as $$
  select jsonb_build_object(
    'memberId', m.id,
    'token', m.token,
    'displayName', m.display_name,
    'hasPassword', m.password_hash is not null,
    'isAdmin', coalesce(m.is_admin, false)
  );
$$;

create or replace function public.jworld_can_edit_country(
  m public.jworld_members,
  c public.jworld_countries
)
returns boolean
language sql
immutable
as $$
  select coalesce(m.is_admin, false) or (c.owner_member_id = m.id);
$$;

create or replace function public.jworld_assert_password(p_password text)
returns void
language plpgsql
as $$
begin
  if p_password is null or char_length(p_password) < 6 then
    raise exception 'Password must be at least 6 characters';
  end if;
end;
$$;

drop function if exists public.jworld_join(text, text);
drop function if exists public.jworld_join(text, text, text);

create or replace function public.jworld_join(
  p_invite_code text,
  p_display_name text,
  p_password text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  world public.jworld_world;
  m public.jworld_members;
  clean_name text;
begin
  clean_name := trim(p_display_name);
  if clean_name is null or char_length(clean_name) < 1 or char_length(clean_name) > 40 then
    raise exception 'Display name must be 1–40 characters';
  end if;
  perform public.jworld_assert_password(p_password);

  select * into world from public.jworld_world where id = 1;
  if world.id is null then
    raise exception 'World is not configured';
  end if;
  if trim(p_invite_code) is distinct from world.invite_code then
    raise exception 'Invalid invite code';
  end if;

  select * into m
  from public.jworld_members
  where lower(trim(display_name)) = lower(clean_name);

  if m.id is not null then
    if m.password_hash is not null then
      raise exception 'That name is taken — sign in instead';
    end if;
    update public.jworld_members
    set password_hash = extensions.crypt(p_password, extensions.gen_salt('bf'))
    where id = m.id
    returning * into m;
    return public.jworld_session_payload(m);
  end if;

  insert into public.jworld_members (display_name, password_hash)
  values (clean_name, extensions.crypt(p_password, extensions.gen_salt('bf')))
  returning * into m;

  return public.jworld_session_payload(m);
end;
$$;

create or replace function public.jworld_login(
  p_display_name text,
  p_password text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  m public.jworld_members;
  clean_name text;
begin
  clean_name := trim(p_display_name);
  if clean_name is null or char_length(clean_name) < 1 then
    raise exception 'Enter your display name';
  end if;
  perform public.jworld_assert_password(p_password);

  select * into m
  from public.jworld_members
  where lower(trim(display_name)) = lower(clean_name);

  if m.id is null then
    raise exception 'Unknown account — register with the invite code first';
  end if;
  if m.password_hash is null then
    raise exception 'This account has no password yet. Register once with the invite code to set one.';
  end if;
  if extensions.crypt(p_password, m.password_hash) is distinct from m.password_hash then
    raise exception 'Wrong password';
  end if;

  return public.jworld_session_payload(m);
end;
$$;

create or replace function public.jworld_set_password(
  p_token uuid,
  p_password text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  m public.jworld_members;
begin
  m := public.jworld_member_from_token(p_token);
  perform public.jworld_assert_password(p_password);

  update public.jworld_members
  set password_hash = extensions.crypt(p_password, extensions.gen_salt('bf'))
  where id = m.id
  returning * into m;

  return public.jworld_session_payload(m);
end;
$$;

create or replace function public.jworld_create_country(
  p_token uuid,
  p_official_name text,
  p_geometry jsonb,
  p_payload jsonb default '{}'::jsonb
)
returns public.jworld_countries
language plpgsql
security definer
set search_path = public
as $$
declare
  m public.jworld_members;
  c public.jworld_countries;
  name text;
begin
  m := public.jworld_member_from_token(p_token);
  name := coalesce(nullif(trim(p_official_name), ''), 'Unnamed Country');

  insert into public.jworld_countries (
    owner_member_id,
    official_name,
    common_names,
    motto,
    short_description,
    lore,
    leader,
    memberships,
    capital,
    population,
    languages,
    religion,
    currency,
    land_area,
    cctlds,
    timezones,
    driving_side,
    phone_codes,
    politics,
    government,
    geography,
    symbols,
    geometry,
    flag_path,
    updated_at
  )
  values (
    m.id,
    name,
    coalesce(p_payload->>'common_names', ''),
    coalesce(p_payload->>'motto', ''),
    coalesce(p_payload->>'short_description', ''),
    coalesce(p_payload->>'lore', ''),
    coalesce(p_payload->>'leader', ''),
    coalesce(p_payload->>'memberships', ''),
    coalesce(p_payload->>'capital', ''),
    coalesce(p_payload->>'population', ''),
    coalesce(p_payload->>'languages', ''),
    coalesce(p_payload->'religion', '{}'::jsonb),
    coalesce(p_payload->>'currency', ''),
    coalesce(p_payload->>'land_area', ''),
    coalesce(p_payload->>'cctlds', ''),
    coalesce(p_payload->>'timezones', ''),
    coalesce(p_payload->>'driving_side', ''),
    coalesce(p_payload->>'phone_codes', ''),
    coalesce(p_payload->'politics', '{}'::jsonb),
    coalesce(p_payload->'government', '{}'::jsonb),
    coalesce(p_payload->'geography', '{}'::jsonb),
    coalesce(p_payload->'symbols', '{}'::jsonb),
    coalesce(p_geometry, '{"type":"Polygon","coordinates":[]}'::jsonb),
    nullif(p_payload->>'flag_path', ''),
    now()
  )
  returning * into c;

  return c;
end;
$$;

create or replace function public.jworld_update_country(
  p_token uuid,
  p_country_id uuid,
  p_payload jsonb,
  p_geometry jsonb default null
)
returns public.jworld_countries
language plpgsql
security definer
set search_path = public
as $$
declare
  m public.jworld_members;
  c public.jworld_countries;
begin
  m := public.jworld_member_from_token(p_token);

  select * into c from public.jworld_countries where id = p_country_id;
  if c.id is null then
    raise exception 'Country not found';
  end if;
  if not public.jworld_can_edit_country(m, c) then
    raise exception 'You can only edit your own countries';
  end if;

  update public.jworld_countries set
    official_name = coalesce(nullif(trim(p_payload->>'official_name'), ''), official_name),
    common_names = coalesce(p_payload->>'common_names', common_names),
    motto = coalesce(p_payload->>'motto', motto),
    short_description = coalesce(p_payload->>'short_description', short_description),
    lore = coalesce(p_payload->>'lore', lore),
    leader = coalesce(p_payload->>'leader', leader),
    memberships = coalesce(p_payload->>'memberships', memberships),
    capital = coalesce(p_payload->>'capital', capital),
    population = coalesce(p_payload->>'population', population),
    languages = coalesce(p_payload->>'languages', languages),
    religion = coalesce(p_payload->'religion', religion),
    currency = coalesce(p_payload->>'currency', currency),
    land_area = coalesce(p_payload->>'land_area', land_area),
    cctlds = coalesce(p_payload->>'cctlds', cctlds),
    timezones = coalesce(p_payload->>'timezones', timezones),
    driving_side = coalesce(p_payload->>'driving_side', driving_side),
    phone_codes = coalesce(p_payload->>'phone_codes', phone_codes),
    politics = coalesce(p_payload->'politics', politics),
    government = coalesce(p_payload->'government', government),
    geography = coalesce(p_payload->'geography', geography),
    symbols = coalesce(p_payload->'symbols', symbols),
    flag_path = case
      when p_payload ? 'flag_path' then nullif(p_payload->>'flag_path', '')
      else flag_path
    end,
    geometry = coalesce(p_geometry, geometry),
    updated_at = now()
  where id = p_country_id
  returning * into c;

  return c;
end;
$$;

create or replace function public.jworld_delete_country(p_token uuid, p_country_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  m public.jworld_members;
  c public.jworld_countries;
begin
  m := public.jworld_member_from_token(p_token);

  select * into c from public.jworld_countries where id = p_country_id;
  if c.id is null then
    raise exception 'Country not found';
  end if;
  if not public.jworld_can_edit_country(m, c) then
    raise exception 'You can only delete your own countries';
  end if;

  delete from public.jworld_countries where id = p_country_id;
  return true;
end;
$$;

drop function if exists public.jworld_list_countries();
drop function if exists public.jworld_list_countries(uuid);

create or replace function public.jworld_list_countries(p_token uuid)
returns table (
  id uuid,
  owner_member_id uuid,
  owner_display_name text,
  official_name text,
  common_names text,
  motto text,
  short_description text,
  lore text,
  leader text,
  memberships text,
  capital text,
  population text,
  languages text,
  religion jsonb,
  currency text,
  land_area text,
  cctlds text,
  timezones text,
  driving_side text,
  phone_codes text,
  politics jsonb,
  government jsonb,
  geography jsonb,
  symbols jsonb,
  geometry jsonb,
  flag_path text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.jworld_member_from_token(p_token);

  return query
  select
    c.id,
    c.owner_member_id,
    m.display_name as owner_display_name,
    c.official_name,
    c.common_names,
    c.motto,
    c.short_description,
    c.lore,
    c.leader,
    c.memberships,
    c.capital,
    c.population,
    c.languages,
    c.religion,
    c.currency,
    c.land_area,
    c.cctlds,
    c.timezones,
    c.driving_side,
    c.phone_codes,
    c.politics,
    c.government,
    c.geography,
    c.symbols,
    c.geometry,
    c.flag_path,
    c.created_at,
    c.updated_at
  from public.jworld_countries c
  join public.jworld_members m on m.id = c.owner_member_id
  order by c.official_name asc;
end;
$$;

create or replace function public.jworld_world_meta()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', id,
    'name', name,
    'created_at', created_at
  )
  from public.jworld_world
  where id = 1;
$$;

grant execute on function public.jworld_join(text, text, text) to anon, authenticated;
grant execute on function public.jworld_login(text, text) to anon, authenticated;
grant execute on function public.jworld_set_password(uuid, text) to anon, authenticated;
grant execute on function public.jworld_create_country(uuid, text, jsonb, jsonb) to anon, authenticated;
grant execute on function public.jworld_update_country(uuid, uuid, jsonb, jsonb) to anon, authenticated;
grant execute on function public.jworld_delete_country(uuid, uuid) to anon, authenticated;
grant execute on function public.jworld_list_countries(uuid) to anon, authenticated;
grant execute on function public.jworld_world_meta() to anon, authenticated;
revoke all on function public.jworld_member_from_token(uuid) from public, anon, authenticated;

insert into storage.buckets (id, name, public)
values ('jworld-flags', 'jworld-flags', true)
on conflict (id) do update set public = true;

drop policy if exists "Public read jworld flags" on storage.objects;
create policy "Public read jworld flags"
  on storage.objects for select
  using (bucket_id = 'jworld-flags');

drop policy if exists "Anon upload jworld flags" on storage.objects;
create policy "Anon upload jworld flags"
  on storage.objects for insert
  with check (
    bucket_id = 'jworld-flags'
    and (storage.extension(name) in ('png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'))
  );

drop policy if exists "Anon update jworld flags" on storage.objects;
create policy "Anon update jworld flags"
  on storage.objects for update
  using (bucket_id = 'jworld-flags')
  with check (bucket_id = 'jworld-flags');

drop policy if exists "Anon delete jworld flags" on storage.objects;
create policy "Anon delete jworld flags"
  on storage.objects for delete
  using (bucket_id = 'jworld-flags');
