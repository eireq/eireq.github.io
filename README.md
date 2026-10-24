# eireq.github.io

Personal site: games, a large flag corpus, a political-values quiz, and a private map sim.

**Live:** https://eireq.github.io/

Vue 3 single-page app, built with Vite and deployed to GitHub Pages from the `hayastan` branch.

## Pages

| Path | What it is |
| --- | --- |
| `/` | Home. Daily flag and flag database up front, a short tour, and flag of the week. |
| `/me` | About. |
| `/games` | Game index. |
| `/games/racing` | Lane Runner. |
| `/games/flagquiz` | Flag quiz. |
| `/games/daily` | Daily flag. |
| `/games/hexo` | HeXO. |
| `/kht` | KHT bracket. Public to view, owner can edit. |
| `/tools` | Tool index. |
| `/flagdb` | Flag database. |
| `/flagdb/detail/:flagId` | One flag: palette, record fields, Wikipedia, similar flags. |
| `/compare` | Two flags side by side, with a similarity score. Accepts `?a=` and `?b=`. |
| `/rc` | Random entry from the flag corpus. |
| `/jpol` | jPol values quiz. |
| `/jworld` | jWorld, a private shared Earth. Full-screen, no site header. |
| `/jworld/c/:id` | One jWorld country. |
| `/politics` | Saved political-test charts. |
| `/elections` | Doulantese election results. |
| `/art` | Art. |
| `/misc` | Politics, jPol, elections, plus links out to modes and GitHub. |
| `/contact` | Contact, with an email draft. |
| `/modes` | Redirects to https://eireq.github.io/modes |

Lane Runner, the flag quiz, HeXO, and jWorld hide the site header and footer.

## Flag corpus

`src/assets/master_flags.json` is the shared source for the database, quiz, daily flag, random country, compare, and flag of the week. About 1,700 records: countries, territories, subdivisions, historical flags, organizations, and a few curated collections (Soviet, revolutionary, pan-Arab, pride, and others).

A flag page reads colors out of the SVG, shows adoption and cancellation dates, proportions, and designer when those fields exist, pulls a Wikipedia summary, and lists similar flags. Compare puts two records next to each other and scores how close they are.

**Daily flag** is one shared country flag per UTC day. Six guesses. The streak stays in this browser. The result can be copied.

**Flag of the week** is picked from a short editorial list (or the country pool if that list misses) and shown on the home page, with links into the record and compare.

**Flag quiz** draws its pools from the same file:

- countries
- territories
- historical
- subdivisions
- organizations
- all flags

You pick a length, type names, then get a breakdown of the ones you missed. Scores go to a per-mode Supabase leaderboard. Opening devtools during a run voids that run. The player name is shared with Lane Runner and stored locally (`eirePlayerName`).

**Random country** uses the same pools and links through to the flag record.

## Games

### Lane Runner — `/games/racing`

Endless 4-lane dodge game on a canvas. Arrow keys or WASD, `p` to pause. Score mixes distance, overtakes, and top speed. Global and weekly top-50 leaderboards. Optional menu, game, and click audio live in `public/games/racing/assets/`. Setup notes and the leaderboard caveats are in [`src/games/racing/README.md`](src/games/racing/README.md).

### HeXO — `/games/hexo`

Hexagonal tic-tac-toe. The first stone goes on the center. After that each turn is two stones, and six in a line wins. Boards are base 8 or base 13, with no clock, 5 minutes, or 10.

- **Two players** on one screen.
- **Practice** against a bot, as X or O.
- **Together** shares one game between two browsers. The room name in the invite link is the only secret. Chat sits under the move list. Rematch swaps sides.

The board can be flipped, guide lines toggled, and a game undone (except in together). A replay is written into the URL, and the score line can be copied.

### KHT — `/kht`

A 370-entry bracket. Anyone can watch it. The owner signs in with a Supabase magic link and edits names and scores; changes save as one JSON document in `kht_bracket`. Odd rounds give the last unpaired entry a bye.

## jPol — `/jpol`

Political values quiz in the vein of the political compass, 8values, and sapplyvalues. Full is 60 questions, express is 18. Five-point answers, no correct ones.

The result is a compass dot plus six axes (equality, economy, authority, freedom, identity, progress), the topics that pulled hardest, and a short calibration note when answers were mostly neutral, mostly extreme, or mostly mild. You can download a PNG, copy a result link, keep recent runs on this device, and paste a friend's code onto the same compass.

English, German, and Russian strings are written out. The other language modes rewrite the English copy.

## jWorld — `/jworld`

Private Earth sim on Leaflet. Sign-in is a display name and password; registration and password reset need the world's invite code.

Once in:

- Draw a country, or snap a border to a simplified real-world outline and drag the handles before saving.
- Add territories, merge them, and edit borders.
- Place, move, or clear a capital.
- Fill a country page: names, motto, lore, politics, government, geography, symbols, flag upload, and the rest of the record in `src/jworld/countryFields.js`.
- Transfer ownership.
- Filter the list (all / mine / others), search, and open a country at `/jworld/c/:id`.
- Admins can edit countries they do not own.

The map polls for other players' changes. jWorld uses the same Supabase project as the leaderboards, with its own tables.

## Languages

The language menu is in the header and remembered locally.

Hand-written locales:

- English (`eng`)
- German (`deu`), including jPol
- Russian (`rus`), including jPol
- Klingon (`kgn`), an approximate overlay so the site stays navigable

The rest clone English and run a filter: drunk, pirate, uwu, serious, vulgar, brainrot, Jenglish, IPA, emoji, a toki-pona-style simplification, and shortened words. Those are jokes, not translations.

## Stack

- Vue 3, Vue Router, Vite
- Leaflet and leaflet-draw for jWorld
- topojson-client for snap-to-shape
- Supabase for Lane Runner scores, flag-quiz scores, the KHT bracket, and jWorld
- A public MQTT broker for HeXO together-mode
- GitHub Pages, with a `404.html` that sends unknown paths back into the SPA

After a redeploy, a tab that still asks for an old hashed chunk reloads once and continues on the same path.

## Run it locally

Node 22 (the deploy workflow uses 22).

```bash
git clone https://github.com/eireq/eireq.github.io.git
cd eireq.github.io
npm install
npm run dev
```

Dev server: http://localhost:5173

```bash
npm run build
npm run preview
```

Copy `.env.example` to `.env` when you want leaderboards, KHT editing, or jWorld:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_KHT_REDIRECT_URL=https://eireq.github.io/kht
```

`VITE_KHT_OWNER_ID` is the Supabase Auth user id allowed to edit the bracket. Set it for production builds. Vite inlines every `VITE_*` value into the client bundle, so use the anon key only, with RLS on. Never put a service-role key in this app.

The site still runs with an empty `.env`. Leaderboards, KHT saving, and jWorld sign-in stay unavailable until Supabase is configured.

### Database

Run these in the Supabase SQL editor:

| What | Script |
| --- | --- |
| Lane Runner and flag-quiz scores | `src/games/racing/supabase.sql` |
| KHT bracket | `src/games/kht/supabase.sql` |
| jWorld | `src/jworld/supabase.sql`, then `src/jworld/supabase_improve.sql` |

After the jWorld base script:

```sql
update public.jworld_world set invite_code = 'your-secret' where id = 1;
```

Other `src/jworld/supabase_*.sql` files are later upgrades (accounts, capitals, transfers, admin, flags, passwords). Read the comment at the top of a file before running it.

KHT policies need the owner's Auth user id in place of the placeholder UUID. In Supabase Authentication, allow these redirect URLs:

- `https://eireq.github.io/kht`
- `http://localhost:5173/kht`

Magic links return to the URL that requested them. A link minted on localhost only works while that dev server is running.

## Deploy

`.github/workflows/deploy.yml` builds on every push to `hayastan` and publishes `dist` to GitHub Pages. Repository secrets:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_KHT_OWNER_ID`

## Layout

```
src/
  App.vue                 header, router view, footer
  i18n.js                 locales and joke filters
  locales/                German and Russian overlays
  router/index.js
  views/                  one file per page
  components/             header and footer
  data/                   flags, daily flag, flag of the week, jPol, profile name
  assets/master_flags.json
  games/racing/           canvas game, audio, leaderboard client
  games/hexo/             rules and the together-mode link
  games/kht/              bracket client
  jworld/                 map, geometry, country fields, Supabase
public/404.html           GitHub Pages fallback into the SPA
```

## Contact

- Email: eireball@proton.me
- GitHub: https://github.com/eireq
- Discord: https://dsc.gg/pissedoff
- YouTube: https://www.youtube.com/@いぃ八

© 2026 eire
