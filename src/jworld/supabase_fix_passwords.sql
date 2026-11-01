-- Fix: gen_salt/crypt live in the extensions schema on Supabase.
-- Run this in the SQL Editor, then try "Save password" again.

create extension if not exists pgcrypto with schema extensions;

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
