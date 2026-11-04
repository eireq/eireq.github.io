# jWorld

jWorld is the site's private collaborative world-building map. It is a custom geography and nation editor built on top of Leaflet and drawing tools.

## What it does

Once a user is in the world, they can:

- draw a country
- snap a region to a real-world outline and refine the borders by hand
- add territories and merge them
- place a capital
- fill in country metadata such as names, lore, government, and flags
- change ownership or assignment of a country
- search and filter the country list
- open a country page at `/jworld/c/:id`

## Access and permissions

The world is private and uses a display-name sign-in flow plus a password for access. Registration and password reset require the world invite code.

Admins can edit any country's data. The map also polls for others' changes in real time.

## Storage

jWorld shares a Supabase project with the site's leaderboards, but uses its own tables for world data.

## Setup

The base database script is:

- `src/jworld/supabase.sql`

There are later upgrades in files like:

- `src/jworld/supabase_improve.sql`
- other `src/jworld/supabase_*.sql` files

These files are incremental upgrades, so read the comments at the top before running them.

After the base script, you typically set the invite code like:

```sql
update public.jworld_world set invite_code = 'your-secret' where id = 1;
```

## Related docs

- [Development](development.md)
- [Deployment & Supabase](deployment.md)
