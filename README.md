# eireq.github.io

Personal site: games, a large flag corpus, a political-values quiz, and a private map sim.

**Live:** https://eireq.github.io/

Vue 3 single-page app, built with Vite and deployed to GitHub Pages from the `zapadoslavia` branch.

## Pages

| Path | What it is |
| --- | --- |
| `/` | Home. Three tours (quick and daily, deep games, explore), plus flag of the week. |
| `/me` | About. |
| `/games` | Game index. |
| `/games/racing` | Lane Runner. |
| `/games/flagquiz` | Flag quiz. |
| `/games/daily` | Daily flag. |
| `/games/hexo` | HeXO. |
| `/games/connect` | Connect. bluD!NG, Hex, TwixT, PÜNCT, Star, *Star, and Y. |
| `/games/otrio` | Otrio. Ring tic-tac-toe for 2–4 players. |
| `/games/go` | Go. Baduk for two players on one screen. |
| `/games/hexchess` | Hex chess. Gliński's board, 91 cells. |
| `/kht` | KHT bracket. Public to view, owner can edit. |
| `/tools` | Tool index. |
| `/tools/pi` | Daily pi. One digit lesson per UTC day. |
| `/flagdb` | Flag database. |
| `/flagdb/detail/:flagId` | One flag: palette, record fields, Wikipedia, similar flags. |
| `/compare` | Two flags side by side, with a similarity score. Accepts `?a=` and `?b=`. |
| `/rc` | Random entry from the flag corpus. |
| `/jpol` | jPol values quiz. |
| `/jworld` | jWorld, a private shared Earth. Full-screen, no site header. |
| `/jworld/c/:id` | One jWorld country. |
| `/art` | Art. |
| `/misc` | jPol, plus links out to modes and GitHub. |
| `/contact` | Contact, with an email draft. |
| `/modes` | Redirects to https://eireq.github.io/modes |

Lane Runner, the flag quiz, HeXO, connect, hex chess, and jWorld hide the site header and footer. Go, Otrio, HeXO, connect, and hex chess can fill the screen.

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

## Daily pi — `/tools/pi`

One lesson per UTC day, stored in this browser (`eireDailyPi`). Study a few new digits, then take the quiz. Batches start at 3 digits and grow as more are mastered, up to the 1,000 digits stored here. The quiz builds today's new digits in steps, then asks for older ones. Each question has three tries. Using them all resets the streak and leaves those digits unlearned. Once every stored digit is known, the day is recall only. A finished lesson can be copied. A tab left open past UTC midnight loads the next lesson.

## Games

### Lane Runner — `/games/racing`

Endless 4-lane dodge game on a canvas. Left and right arrows, or A and D, change lanes. `p` pauses, and Esc or the menu button leaves a run. Score mixes distance, overtakes, and top speed. Global and weekly top-50 leaderboards. Optional menu, game, and click audio live in `public/games/racing/assets/`. Setup notes and the leaderboard caveats are in [`src/games/racing/README.md`](src/games/racing/README.md).

### Otrio — `/games/otrio`

Pass-and-play ring tic-tac-toe. Each of the nine circles holds a small, medium, and large ring. A color wins with three of one size in a line, with small-medium-large along a line in either direction, or with all three sizes stacked in one circle. Two players each take a pair of opposite colors (tan with black, white with blue) and swap colors as play goes around the board. Three players leave one color out.

### HeXO — `/games/hexo`

Hexagonal tic-tac-toe. X places one stone on the center (h8 on base 8, m13 on base 13). Every later turn is two stones, and O takes the first of those. Six in a line on any of the three axes wins. Check means the side to move can finish a line with the stones still left this turn. The side to move may resign. Boards are base 8 or base 13, with no clock, 5 minutes, or 10. A clock runs only on the turn. Type a square such as `g7` to play it.

Two, three, or four players (X, O, Y, and Z) take the same kind of turn. Grids are hex, triangle, square, octagon (including the diamonds), or radial. On a radial board, six around a ring or six outward on a spoke wins.

Optional rules can be combined:

- **Duck.** After your stones, move the duck. No one plays on it.
- **King duck.** The ring around the duck is closed, and stones there do not count.
- **Egyptian.** A soft cap (move cap), 12 by default and adjustable up to 40. Over it (when it's your 12th move), lift up to two of your older stones, or leave them. An echo never lifts a stone.
- **Echo.** Copies a stone onto its mirror after two full turns. A duck echo moves the duck only if it is still on that cell.
- **Orbit.** Every stone turns one step around the center. The duck stays.
- **Meteor.** Every third turn, the farthest ring is cleared. A copy born that turn stays.
- **Raid.** After your stones, take one of theirs. It becomes yours.
- **Slide.** The second action can move one of your stones onto an empty neighbor.
- **Frost.** A stone placed this turn does not count in a line until the turn ends.
- **Pair.** The two stones of a turn have to share a side. The opening stone is free.
- **Scatter.** The two stones of a turn must not share a side. Pair and scatter exclude each other.
- **Siege.** After the opening, every stone is placed beside an opponent's stone.
- **Pendulum.** When everyone has taken a turn, each stone steps one ring toward the center. The center stone stays.
- **Mine.** The second action can plant a mine. The next stone played there is lost, and the mine is gone.
- **Rift bloom.** Hidden until the title is clicked five times. Shimmering cells move each turn. Play on one and a ghost grows on the mirror. It becomes a stone if two of your stones touch it before it fades.

Ways to play:

- **On one screen**, two to four players.
- **Practice** against a bot, as any side.
- **Together** shares one game between browsers. The room name in the invite link is the only secret, and it keeps the board size. You start as X. Chat sits under the move list. Rematch swaps sides. A third or fourth player joins with `s=Y` or `s=Z` on the invite.

The board can be flipped, zoomed, and fit. Guide lines can be toggled, and a game undone (except in together). The move list can be stepped through (you can display your previous moves). A replay is written into the URL, and the score line can be copied.

### Connect — `/games/connect`

bluD!NG, Hex, TwixT, PÜNCT, Star, *Star, and Y. The win is a connection, or a score taken from one, instead of a row of stones.

Red moves first. Hotseat or practice. Where the game uses it, blue may swap seats after the first move. The board pans and zooms. A link can carry the game.

- **bluD!NG** (Bridg-it). Red joins top to bottom, blue joins the sides. A link that would cross is blocked.
- **Hex.** Red joins left to right, blue joins top to bottom.
- **TwixT.** Place a peg, then knight's-move links. Links cannot cross. Corners are out, and a peg cannot sit in the opponent's border.
- **PÜNCT.** Three-dot pieces, placed or slid along the punct. Stacking and bridges are in the standard rules. Either player may join any opposite pair. The center is entered only by a move.
- **Y.** Both players join all three sides of a triangle. Corners count for both edges.
### !!!!!!BETA!!!!!!
- **Star.** A group touching three or more border cells scores two less than it touches.
- **\*Star.** Own edge cells with as few stars as you can. The empty center joins both colors.

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

`.github/workflows/deploy.yml` builds on every push to `zapadoslavia` and publishes `dist` to GitHub Pages. Repository secrets:

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
  data/                   flags, daily flag, flag of the week, daily pi, jPol, profile name
  assets/master_flags.json
  games/fullscreen.js     shared fullscreen control
  games/racing/           canvas game, audio, leaderboard client
  games/go/               board, captures, Chinese scoring
  games/otrio/            ring tic-tac-toe rules
  games/hexo/             rules and the together-mode link
  games/connect/          bluD!NG, Hex, TwixT, PÜNCT, Star, *Star, Y
  games/hexchess/         Gliński board and moves
  games/kht/              bracket client
  jworld/                 map, geometry, country fields, Supabase
public/404.html           GitHub Pages fallback into the SPA
```

## Contact

- Email: eireball@proton.me
- GitHub: https://github.com/eireq
- Discord: https://dsc.gg/pissedoff
- YouTube: https://www.youtube.com/@eireq also another link will change later

© 2026 eire
