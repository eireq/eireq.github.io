-- Give eire admin rights (edit/delete any country).
-- Run in Supabase SQL Editor.

alter table public.jworld_members
  add column if not exists is_admin boolean not null default false;

update public.jworld_members
set is_admin = true
where lower(trim(display_name)) = 'eire';

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
