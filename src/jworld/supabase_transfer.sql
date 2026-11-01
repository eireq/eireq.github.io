-- Admin: list members + transfer country ownership.
-- Run in Supabase SQL Editor.

create or replace function public.jworld_list_members(p_token uuid)
returns table (
  id uuid,
  display_name text,
  is_admin boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  m public.jworld_members;
begin
  m := public.jworld_member_from_token(p_token);
  if not coalesce(m.is_admin, false) then
    raise exception 'Only admins can list members';
  end if;

  return query
  select
    mem.id,
    mem.display_name,
    coalesce(mem.is_admin, false) as is_admin
  from public.jworld_members mem
  order by lower(mem.display_name);
end;
$$;

create or replace function public.jworld_transfer_country(
  p_token uuid,
  p_country_id uuid,
  p_new_owner_id uuid
)
returns table (
  id uuid,
  owner_member_id uuid,
  owner_display_name text,
  official_name text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  m public.jworld_members;
  c public.jworld_countries;
  new_owner public.jworld_members;
begin
  m := public.jworld_member_from_token(p_token);
  if not coalesce(m.is_admin, false) then
    raise exception 'Only admins can transfer ownership';
  end if;

  select * into c from public.jworld_countries where jworld_countries.id = p_country_id;
  if c.id is null then
    raise exception 'Country not found';
  end if;

  select * into new_owner
  from public.jworld_members
  where jworld_members.id = p_new_owner_id;

  if new_owner.id is null then
    raise exception 'New owner not found';
  end if;

  if c.owner_member_id = new_owner.id then
    raise exception 'That member already owns this country';
  end if;

  update public.jworld_countries
  set
    owner_member_id = new_owner.id,
    updated_at = now()
  where jworld_countries.id = p_country_id
  returning * into c;

  return query
  select
    c.id,
    c.owner_member_id,
    new_owner.display_name,
    c.official_name;
end;
$$;

grant execute on function public.jworld_list_members(uuid) to anon, authenticated;
grant execute on function public.jworld_transfer_country(uuid, uuid, uuid) to anon, authenticated;
