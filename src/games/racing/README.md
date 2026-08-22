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
2. edit `src/games/racing/config.js`.
3. add your supabase project url and anon/publishable key.
4. run `src/games/racing/supabase.sql` in the supabase sql editor.
5. put optional music files in `public/games/racing/assets/`:
   - `menu.mp3`
   - `game.mp3`
   - `click.mp3`

## supabase setup

the browser uses the public anon/publishable key. this is normal for a supabase frontend.

do not put a service-role key into `src/games/racing/config.js`.

the database is intentionally configured so visitors can:

- read scores
- insert scores

visitors cannot update or delete scores through the supplied policies.

## github pages

the vue app builds to static files. github actions deploys `dist` on push to `main`.

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
