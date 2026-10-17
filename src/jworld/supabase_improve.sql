-- jWorld follow-up. Run in the Supabase SQL editor after supabase.sql.
-- Safe to re-run. Deploy the site in the same change:
--   flag uploads move to short-lived grants, and sign-out revokes that device.

-- Per-device sessions. Existing member tokens are copied so current browsers stay signed in.
create table if not exists public.jworld_sessions (
  token uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.jworld_members (id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now()
);

create index if not exists jworld_sessions_member_idx
  on public.jworld_sessions (member_id);

alter table public.jworld_sessions enable row level security;

insert into public.jworld_sessions (token, member_id, expires_at)
select m.token, m.id, now() + interval '30 days'
from public.jworld_members m
where not exists (
  select 1 from public.jworld_sessions s where s.token = m.token
);

create table if not exists public.jworld_auth_attempts (
  id bigint generated always as identity primary key,
  action text not null,
  subject text not null,
  created_at timestamptz not null default now()
);

alter table public.jworld_auth_attempts enable row level security;

create table if not exists public.jworld_flag_grants (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.jworld_members (id) on delete cascade,
  country_id uuid not null,
  expires_at timestamptz not null default (now() + interval '10 minutes')
);

alter table public.jworld_flag_grants enable row level security;

create or replace function public.jworld_rate_limit(
  p_action text,
  p_subject text,
  p_limit integer,
  p_window interval
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  recent integer;
begin
  delete from public.jworld_auth_attempts
  where created_at < now() - interval '1 day';

  select count(*) into recent
  from public.jworld_auth_attempts
  where action = p_action
    and subject = p_subject
    and created_at > now() - p_window;

  if recent >= p_limit then
    raise exception 'Too many attempts. Wait a few minutes and try again.';
  end if;

  insert into public.jworld_auth_attempts (action, subject)
  values (p_action, p_subject);
end;
$$;

create or replace function public.jworld_member_from_token(p_token uuid)
returns public.jworld_members
language plpgsql
security definer
set search_path = public
as $$
declare
  m public.jworld_members;
  s public.jworld_sessions;
begin
  select * into s from public.jworld_sessions where token = p_token;
  if s.token is null then
    raise exception 'Invalid session token';
  end if;
  if s.expires_at <= now() then
    delete from public.jworld_sessions where token = p_token;
    raise exception 'Session expired. Sign in again.';
  end if;

  update public.jworld_sessions
  set expires_at = now() + interval '30 days'
  where token = p_token;

  select * into m from public.jworld_members where id = s.member_id;
  if m.id is null then
    raise exception 'Invalid session token';
  end if;
  return m;
end;
$$;

create or replace function public.jworld_open_session(p_member_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_token uuid;
begin
  insert into public.jworld_sessions (member_id)
  values (p_member_id)
  returning token into new_token;
  return new_token;
end;
$$;

drop function if exists public.jworld_session_payload(public.jworld_members);

create or replace function public.jworld_session_payload(
  m public.jworld_members,
  p_token uuid
)
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'memberId', m.id,
    'token', p_token,
    'displayName', m.display_name,
    'hasPassword', m.password_hash is not null,
    'isAdmin', coalesce(m.is_admin, false)
  );
$$;

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
  session_token uuid;
begin
  clean_name := trim(p_display_name);
  if clean_name is null or char_length(clean_name) < 1 or char_length(clean_name) > 40 then
    raise exception 'Display name must be 1–40 characters';
  end if;
  perform public.jworld_assert_password(p_password);
  perform public.jworld_rate_limit('join', 'world', 30, interval '10 minutes');
  perform public.jworld_rate_limit('join-name', lower(clean_name), 8, interval '10 minutes');

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
  else
    insert into public.jworld_members (display_name, password_hash)
    values (clean_name, extensions.crypt(p_password, extensions.gen_salt('bf')))
    returning * into m;
  end if;

  session_token := public.jworld_open_session(m.id);
  return public.jworld_session_payload(m, session_token);
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
  session_token uuid;
begin
  clean_name := trim(p_display_name);
  if clean_name is null or char_length(clean_name) < 1 then
    raise exception 'Enter your display name';
  end if;
  perform public.jworld_assert_password(p_password);
  perform public.jworld_rate_limit('login', lower(clean_name), 8, interval '10 minutes');

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

  session_token := public.jworld_open_session(m.id);
  return public.jworld_session_payload(m, session_token);
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

  return public.jworld_session_payload(m, p_token);
end;
$$;

create or replace function public.jworld_logout(p_token uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.jworld_sessions where token = p_token;
end;
$$;

create or replace function public.jworld_reset_password(
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
  session_token uuid;
begin
  clean_name := trim(p_display_name);
  if clean_name is null or char_length(clean_name) < 1 then
    raise exception 'Enter your display name';
  end if;
  perform public.jworld_assert_password(p_password);
  perform public.jworld_rate_limit('reset', lower(clean_name), 8, interval '10 minutes');

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

  if m.id is null then
    raise exception 'Unknown account — register with the invite code first';
  end if;

  update public.jworld_members
  set password_hash = extensions.crypt(p_password, extensions.gen_salt('bf'))
  where id = m.id
  returning * into m;

  delete from public.jworld_sessions where member_id = m.id;
  session_token := public.jworld_open_session(m.id);
  return public.jworld_session_payload(m, session_token);
end;
$$;

drop function if exists public.jworld_update_country(uuid, uuid, jsonb, jsonb);

create or replace function public.jworld_update_country(
  p_token uuid,
  p_country_id uuid,
  p_payload jsonb,
  p_geometry jsonb default null,
  p_expected_updated_at timestamptz default null
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
  if p_expected_updated_at is not null
     and c.updated_at is distinct from p_expected_updated_at then
    raise exception 'This country was updated by someone else. Reload and try again.';
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

create or replace function public.jworld_get_country(
  p_token uuid,
  p_country_id uuid
)
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
  where c.id = p_country_id;
end;
$$;

create or replace function public.jworld_list_map_countries(p_token uuid)
returns table (
  id uuid,
  owner_member_id uuid,
  owner_display_name text,
  official_name text,
  common_names text,
  geometry jsonb,
  geography jsonb,
  flag_path text,
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
    c.geometry,
    c.geography,
    c.flag_path,
    c.updated_at
  from public.jworld_countries c
  join public.jworld_members m on m.id = c.owner_member_id
  order by c.official_name asc;
end;
$$;

create or replace function public.jworld_countries_stamp(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  country_count bigint;
  latest timestamptz;
begin
  perform public.jworld_member_from_token(p_token);
  select count(*), max(c.updated_at)
  into country_count, latest
  from public.jworld_countries c;
  return jsonb_build_object(
    'count', country_count,
    'latest', latest
  );
end;
$$;

create or replace function public.jworld_flag_grant_ok(p_grant_id text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.jworld_flag_grants g
    where g.id::text = p_grant_id
      and g.expires_at > now()
  );
$$;

create or replace function public.jworld_begin_flag_upload(
  p_token uuid,
  p_country_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  m public.jworld_members;
  c public.jworld_countries;
  grant_id uuid;
begin
  m := public.jworld_member_from_token(p_token);

  select * into c from public.jworld_countries where id = p_country_id;
  if c.id is null then
    raise exception 'Country not found';
  end if;
  if not public.jworld_can_edit_country(m, c) then
    raise exception 'You can only edit your own countries';
  end if;

  delete from public.jworld_flag_grants
  where expires_at <= now();

  insert into public.jworld_flag_grants (member_id, country_id)
  values (m.id, c.id)
  returning id into grant_id;

  return grant_id;
end;
$$;

revoke all on function public.jworld_rate_limit(text, text, integer, interval) from public, anon, authenticated;
revoke all on function public.jworld_open_session(uuid) from public, anon, authenticated;
revoke all on function public.jworld_member_from_token(uuid) from public, anon, authenticated;

grant execute on function public.jworld_logout(uuid) to anon, authenticated;
grant execute on function public.jworld_reset_password(text, text, text) to anon, authenticated;
grant execute on function public.jworld_get_country(uuid, uuid) to anon, authenticated;
grant execute on function public.jworld_list_map_countries(uuid) to anon, authenticated;
grant execute on function public.jworld_countries_stamp(uuid) to anon, authenticated;
grant execute on function public.jworld_begin_flag_upload(uuid, uuid) to anon, authenticated;
grant execute on function public.jworld_flag_grant_ok(text) to anon, authenticated;
grant execute on function public.jworld_update_country(uuid, uuid, jsonb, jsonb, timestamptz) to anon, authenticated;

drop policy if exists "Anon upload jworld flags" on storage.objects;
drop policy if exists "Grant upload jworld flags" on storage.objects;
create policy "Grant upload jworld flags"
  on storage.objects for insert
  to anon, authenticated
  with check (
    bucket_id = 'jworld-flags'
    and public.jworld_flag_grant_ok((storage.foldername(name))[1])
    and (storage.extension(name) in ('png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'))
  );

drop policy if exists "Anon update jworld flags" on storage.objects;
drop policy if exists "Anon delete jworld flags" on storage.objects;
