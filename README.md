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
| `/games/otrio` | Otrio. Ring tic-tac-toe for 2–4 players. |
| `/games/go` | Go. Baduk for two players on one screen. |
| `/games/hexchess` | Hex chess. Gliński's board, 91 cells. |
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

Lane Runner, the flag quiz, HeXO, hex chess, and jWorld hide the site header and footer.

## Flag corpus

`src/assets/master_flags.json` is the shared source for the database, quiz, daily flag, random country, compare, and flag of the week. About 1,700 records: countries, territories, subdivisions, historical flags, organizations, and a few curated collections (Soviet, revolutionary, pan-Arab, pride, and others).

A flag page reads colors out of the SVG, shows adoption and cancellation dates, proportions, and designer when those fields exist, pulls a Wikipedia summary, and lists similar flags. Compare puts two records next to each other and scores how close they are.

**Daily flag** is one shared country flag per UTC day. Six guesses. The streak stays in this browser, and a missed puzzle sets it to 0. A tab left open past UTC midnight loads that day's flag. The result can be copied.

**Flag of the week** is picked from a short editorial list (or the country pool if that list misses) and shown on the home page, with links into the record and compare.

**Flag quiz** draws its pools from the same file:

- countries
- territories
- historical
- subdivisions
- organizations
- all flags

You pick a length, type names, then get a breakdown of the ones you missed. `USA` and `UK` count for the United States and the United Kingdom. A blank answer is ignored. Scores go to a per-mode Supabase leaderboard ranked by correct answers, then percentage, with one best run per name. Opening devtools during a run voids that run. The player name is shared with Lane Runner and stored locally (`eirePlayerName`).

**Random country** uses the same pools and links through to the flag record.

## Games

### Lane Runner — `/games/racing`

Endless 4-lane dodge game on a canvas. Left and right arrows, or A and D, change lanes. `p` pauses, and Esc or the menu button leaves a run. Score mixes distance, overtakes, and top speed. Global and weekly top-50 leaderboards. Optional menu, game, and click audio live in `public/games/racing/assets/`. Setup notes and the leaderboard caveats are in [`src/games/racing/README.md`](src/games/racing/README.md).

### Otrio — `/games/otrio`

Pass-and-play ring tic-tac-toe. Each of the nine circles holds a small, medium, and large ring. A color wins with three of one size in a line, with small-medium-large along a line in either direction, or with all three sizes stacked in one circle. Two players each take a pair of opposite colors (tan with black, white with blue) and swap colors as play goes around the board. Three players leave one color out.

### HeXO — `/games/hexo`

Hexagonal tic-tac-toe. X places one stone on the center (h8 on base 8, m13 on base 13). Every later turn is two stones, and O takes the first of those. Six in a line on any of the three axes wins. Check means the side to move can finish a line with the stones still left this turn. The side to move may resign. Boards are base 8 or base 13, with no clock, 5 minutes, or 10. A clock runs only on the turn. Type a square such as `g7` to play it.

Two, three, or four players (X, O, Y, and Z) take the same kind of turn. Grids are hex, triangle, square, or octagon, and the octagon also uses the diamonds. Optional rules are duck, king duck, an Egyptian soft cap, echo, orbit, and meteor.

- **On one screen**, two to four players.
- **Practice** against a bot, as any side.
- **Together** shares one game between browsers. The room name in the invite link is the only secret, and it keeps the board size. You start as X. Chat sits under the move list. Rematch swaps sides. A third or fourth player joins with `s=Y` or `s=Z` on the invite.

The board can be flipped, zoomed, and fit. Guide lines can be toggled, and a game undone (except in together). The move list can be stepped through. A replay is written into the URL, and the score line can be copied.

### Go — `/games/go`

Baduk for two players on one screen. Boards are 9×9, 13×13, or 19×19. Click a crossing, or move with the arrows and Enter. Stones of the same color that touch share liberties; a group with none is captured. Suicide is illegal, and positional superko forbids a move that restores any earlier arrangement of stones.

Chinese rules, area scoring. Two passes open the count: click groups both players treat as dead, then accept, or go back to playing. The score is living stones plus the empty points they enclose. White receives 7.5 komi. Either side can undo or resign.

### Hex chess — `/games/hexchess`

Gliński's hexagonal chess. Ninety-one cells, files a–l with j skipped, ranks 1–11, center f6. Each side has three bishops and nine pawns. Rooks slide through edges, bishops through corners and stay on one color, queens do both. Kings step one cell in any of those twelve directions and do not castle. Knights jump two cells through edges, then one at a sixty-degree turn. Pawns step straight ahead on their file, may step two from a start cell when both cells are empty, and capture one cell forward at sixty degrees, including en passant. A pawn that reaches the far end of a file promotes.

Checkmate wins. Stalemate wins for the side that delivered it. Threefold repetition, fifty moves with no capture or pawn move, and a position where each side has at most a king and one bishop or knight are draws.

- **Two players** on one screen. White moves first.
- **Practice** against a bot, as white or black.

The board can be dragged, zoomed, and flipped. Type a square such as `g1` to select it or play it. The move list can be stepped through, and the moves can be copied.

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

The flag-quiz leaderboard reads `flag_quiz_best` from the racing script (best correct count, then percentage, one row per name). If the tables already exist from an older run, run the function at the bottom of that script again. Until then the page sorts the latest 1,000 rows the same way in the browser.

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
  games/go/               board, captures, Chinese scoring
  games/otrio/            ring tic-tac-toe rules
  games/hexo/             rules and the together-mode link
  games/hexchess/         Gliński board and moves
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
