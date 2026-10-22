-- Map list includes the wiki capital name.
-- Run once in the Supabase SQL Editor.
-- The app also copies that name onto geography when a country is saved,
-- so capitals still label correctly before this is applied.

drop function if exists public.jworld_list_map_countries(uuid);

create or replace function public.jworld_list_map_countries(p_token uuid)
returns table (
  id uuid,
  owner_member_id uuid,
  owner_display_name text,
  official_name text,
  common_names text,
  capital text,
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
    c.capital,
    c.geometry,
    c.geography,
    c.flag_path,
    c.updated_at
  from public.jworld_countries c
  join public.jworld_members m on m.id = c.owner_member_id
  order by c.official_name asc;
end;
$$;

grant execute on function public.jworld_list_map_countries(uuid) to anon, authenticated;
