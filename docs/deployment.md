# Deployment & Supabase

This project is deployed with GitHub Pages, and several features depend on Supabase for data storage, leaderboards, and world state.

## GitHub Pages deployment

The workflow builds on pushes to the `zapadoslavia` branch and publishes the build output to GitHub Pages.

Required repo secrets include:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_KHT_OWNER_ID`

## Supabase setup

Use the SQL scripts in the repo as needed:

| Feature | Script |
| --- | --- |
| lane runner and flag quiz scores | `src/games/racing/supabase.sql` |
| KHT bracket | `src/games/kht/supabase.sql` |
| jWorld | `src/jworld/supabase.sql` |
| jWorld upgrades | `src/jworld/supabase_*.sql` |

After the jWorld base script, set the invite code:

```sql
update public.jworld_world set invite_code = 'your-secret' where id = 1;
```

## KHT auth notes

KHT policies require the owner's auth user ID to be set in the Supabase configuration. The allowed redirect URLs should include:

- `https://eireq.github.io/kht`
- `http://localhost:5173/kht`

## Important security note

Because this is a static site on GitHub Pages, leaderboard submissions happen from the browser. The public Supabase anon key is therefore visible in the client bundle, which is normal for a frontend app.

This means:

- it is not a secret key
- it should be used only with RLS enabled
- serious anti-cheat validation should happen on a backend or edge function

## Related docs

- [Overview](overview.md)
- [Development](development.md)
- [Flags & tools](flags-and-tools.md)
- [jWorld](jworld.md)
