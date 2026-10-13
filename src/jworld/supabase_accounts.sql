-- jWorld accounts migration (run in Supabase SQL Editor on existing DBs)
-- Adds passwords so the same member can sign in on multiple devices.
-- New installs: you can also re-run the updated supabase.sql, or just this file.

create extension if not exists pgcrypto with schema extensions;

alter table public.jworld_members
  add column if not exists password_hash text;

-- Merge duplicate display names before the unique index (keeps oldest row).
with ranked as (
  select
    id,
    lower(trim(display_name)) as name_key,
    row_number() over (
      partition by lower(trim(display_name))
      order by created_at asc, id asc
    ) as rn
  from public.jworld_members
),
keepers as (
  select id, name_key from ranked where rn = 1
),
dupes as (
  select r.id as dupe_id, k.id as keep_id
  from ranked r
  join keepers k on k.name_key = r.name_key
  where r.rn > 1
)
update public.jworld_countries c
set owner_member_id = d.keep_id
from dupes d
where c.owner_member_id = d.dupe_id;

with ranked as (
  select
    id,
    row_number() over (
      partition by lower(trim(display_name))
      order by created_at asc, id asc
    ) as rn
  from public.jworld_members
)
delete from public.jworld_members m
using ranked r
where m.id = r.id and r.rn > 1;

create unique index if not exists jworld_members_name_unique
  on public.jworld_members (lower(trim(display_name)));

create or replace function public.jworld_session_payload(m public.jworld_members)
returns jsonb
language sql
immutable
as $$
  select jsonb_build_object(
    'memberId', m.id,
    'token', m.token,
    'displayName', m.display_name,
    'hasPassword', m.password_hash is not null
  );
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

-- Register (invite + name + password). Also claims legacy members that have no password yet.
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
    -- Legacy member (joined before passwords): claim with invite + set password
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

grant execute on function public.jworld_join(text, text, text) to anon, authenticated;
grant execute on function public.jworld_login(text, text) to anon, authenticated;
grant execute on function public.jworld_set_password(uuid, text) to anon, authenticated;
