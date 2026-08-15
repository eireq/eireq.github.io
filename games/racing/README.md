# lane runner

an 8-bit arcade driving game for github pages.

## features

- 4-lane endless procedural road
- pixel-art canvas rendering
- keyboard controls: arrow keys or wasd
- gradually increasing speed
- traffic that becomes slightly more challenging
- distance + overtakes scoring
- speed bomb mode
- local player name
- global and weekly top-50 leaderboards
- supabase database integration
- completely static frontend, so github pages can host it
- external music files are optional

## local setup

1. put the folder on a static web server. opening `index.html` directly usually works, but a local server is better.
2. edit `js/config.js`.
3. add your supabase project url and anon/publishable key.
4. run `supabase.sql` in the supabase sql editor.
5. put optional music files in `assets/`:
   - `menu.mp3`
   - `game.mp3`
   - `click.mp3`

## supabase setup

the browser uses the public anon/publishable key. this is normal for a supabase frontend.

do not put a service-role key into `js/config.js`.

the database is intentionally configured so visitors can:
- read scores
- insert scores

visitors cannot update or delete scores through the supplied policies.

## github pages

push the whole folder to your repository and enable github pages from the branch/folder containing `index.html`.

there is no node server required.

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
