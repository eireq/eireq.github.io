# lane runner

an 8-bit arcade driving game for github pages.

## features

- 4-lane endless procedural road
- pixel-art canvas rendering
- keyboard controls: arrow keys or wasd
- gradually increasing speed
- traffic that becomes slightly more challenging
- distance + overtakes scoring
- local player name
- global and weekly top-50 leaderboards
- supabase database integration
- completely static frontend, so github pages can host it
- external music files are optional

## local setup

1. from the repo root, run `npm install` then `npm run dev`.
2. copy `.env.example` to `.env`.
3. add your Supabase project URL and anon/publishable key to `.env`.
4. run `src/games/racing/supabase.sql` in the supabase sql editor.
5. put optional music files in `public/games/racing/assets/`:
   - `menu.mp3`
   - `game.mp3`
   - `click.mp3`

## supabase setup

the browser uses the public anon/publishable key. this is normal for a Supabase frontend.

the key is loaded from environment variables so it does not need to be committed to GitHub.
Vite still embeds `VITE_*` values into the deployed JavaScript, so this does **not** make the
publishable key private. Never use a service-role or secret key in this app. Keep RLS enabled
and use the supplied policies to control what anonymous visitors can do.

do not put a service-role key into `src/games/racing/config.js`.

the database is intentionally configured so visitors can:

- read scores
- insert scores

visitors cannot update or delete scores through the supplied policies.

## github pages

the Vue app builds to static files. Before deploying, add these repository or environment
secrets in GitHub under **Settings > Secrets and variables > Actions**:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

The workflow injects them during the build. They will still be visible to anyone inspecting
the deployed site because the leaderboard calls Supabase directly from the browser.

If the goal is to hide credentials from site visitors, the leaderboard must move behind a
server-side API or Supabase Edge Function. GitHub Pages alone cannot provide that server.

## important anti-cheat note

because github pages is client-side and score submission happens from the browser, the supplied leaderboard is **not cheat-proof**. someone determined enough can call the supabase api themselves and submit fake scores.

for a casual arcade leaderboard this is acceptable.

if you later want serious anti-cheat, move score validation to a server/edge function and validate run data there.

## future expansion ideas

- car selection and unlocks
- more traffic types
- roadside buildings
- weather and time-of-day
- achievements
- ghost replays
- proper server-side anti-cheat
- accounts
- multiplayer, once civilization has survived everything else
