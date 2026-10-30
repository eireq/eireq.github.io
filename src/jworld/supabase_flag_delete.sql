-- Run this if supabase_improve.sql was already applied before flag cleanup existed.
-- Fresh installs can skip it: the same function is at the end of supabase_improve.sql.

create or replace function public.jworld_delete_replaced_flag(
  p_token uuid,
  p_country_id uuid,
  p_old_path text
)
returns void
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  m public.jworld_members;
  c public.jworld_countries;
begin
  if p_old_path is null or length(trim(p_old_path)) = 0 then
    return;
  end if;
  if p_old_path ~* '^https?://' or p_old_path like 'data:%' then
    return;
  end if;

  m := public.jworld_member_from_token(p_token);
  select * into c from public.jworld_countries where id = p_country_id;
  if c.id is null or not public.jworld_can_edit_country(m, c) then
    raise exception 'You can only edit your own countries';
  end if;
  if c.flag_path = p_old_path then
    return;
  end if;

  delete from storage.objects
  where bucket_id = 'jworld-flags'
    and name = p_old_path;
end;
$$;

grant execute on function public.jworld_delete_replaced_flag(uuid, uuid, text) to anon, authenticated;
