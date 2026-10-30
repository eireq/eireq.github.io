-- Reset a jWorld password (run in Supabase SQL Editor).
-- Change the display name and new password, then Run.

update public.jworld_members
set password_hash = extensions.crypt('PUT-NEW-PASSWORD-HERE', extensions.gen_salt('bf'))
where lower(trim(display_name)) = lower('eire');

-- Optional: confirm it worked (hash should be non-null)
select id, display_name, password_hash is not null as has_password
from public.jworld_members
where lower(trim(display_name)) = lower('eire');
