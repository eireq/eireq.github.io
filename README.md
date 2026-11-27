# eireq.github.io

my website. games, a big pile of flags, a politics quiz, and a private map where my friends draw fake countries.

**live:** https://eireq.github.io/

it's a vue 3 app built with vite. github pages deploys it from the `zapadoslavia` branch 

## pages

| path | what's there |
| --- | --- |
| `/` | home. three ways in (quick and daily, deep games, explore) and the flag of the week |
| `/me` | about me |
| `/games` | all the games, plus a random game button if you can't decide |
| `/games/racing` | lane runner |
| `/games/cave` | cave flyer |
| `/games/roof` | roof run |
| `/games/flagquiz` | flag quiz |
| `/games/daily` | daily flag |
| `/games/hexo` | HeXO |
| `/games/connect` | connect: bluD!NG, Hex, TwixT, PÜNCT, Star, *Star, and Y |
| `/games/otrio` | Otrio, ring tic-tac-toe for 2–4 players |
| `/games/go` | go, two players on one screen |
| `/games/hexchess` | hex chess on Gliński's 91-cell board |
| `/kht` | KHT bracket. anyone can watch, only i can edit |
| `/tools` | tools |
| `/tools/pi` | daily pi, one digit lesson per utc day |
| `/lingo` | name 500 basic words and translate with them |
| `/dum` | learn dum languag, lesson by lesson |
| `/flagdb` | flag database |
| `/flagdb/weeks` | every flag of the week, with the little write-ups |
| `/flagdb/detail/:flagId` | one flag: colors, dates, wikipedia, similar flags |
| `/compare` | two flags side by side with a similarity score. takes `?a=` and `?b=` |
| `/tiers` | country tier list, S to F |
| `/rc` | random flag from the pile |
| `/jpol` | jPol, the values quiz |
| `/jworld` | jWorld, full screen, no header |
| `/jworld/c/:id` | one jWorld country |
| `/art` | art |
| `/misc` | jPol and some links out. `/politics` and `/elections` end up here too |
| `/contact` | contact, with an email draft |
| `/modes` | goes to https://eireq.github.io/modes |

lane runner, cave flyer, roof run, the flag quiz, HeXO, connect, hex chess, and jWorld hide the site header and footer. go, Otrio, HeXO, connect, and hex chess have a full screen button.

## flags

everything flag-related reads `src/assets/master_flags.json`: 1,755 records of countries, territories, subdivisions, historical flags, organizations, and a few collections (soviet, revolutionary, pan-arab, pride, and so on). the database list loads a slimmer copy, `src/assets/flag_index.json`, so it opens faster.

- **flag pages** pull the colors out of the svg, show dates, ratio, and designer when the record has them, grab a wikipedia summary, and list similar flags. click a color to find it in the database.
- **daily flag** is one country per utc day, six guesses. the streak lives in your browser, and missing a day puts it back to 0. you can copy the result as text or as a little image.
- **flag of the week** comes from a short list i wrote (or the country pool if that runs out). it's on the home page, and the old ones are on `/flagdb/weeks`.
- **flag quiz** has countries, territories, historical, subdivisions, organizations, and all flags. pick a length, type names, see what you missed. `USA` and `UK` count. scores go to a supabase leaderboard per mode (most correct, then percentage, one best run per name). opening devtools mid-run voids the run, nice try. "challenge a friend" copies a link with the same mode and length. your name is shared with lane runner and saved as `eirePlayerName`.
- **random country** uses the same pools.

## daily pi

`/tools/pi`. one lesson per utc day, saved as `eireDailyPi`. learn a few new digits, then take the quiz. batches start at 3 digits and grow as you go, up to the 1,000 digits stored here. every question gets three tries. burn all three and the streak resets and those digits don't count. once you know everything, it's recall only. results can be copied as text or as an image.

## games

### lane runner

endless 4-lane dodging on a canvas. arrows or A/D to switch lanes, `p` to pause, esc to leave. score is distance, overtakes, and top speed. global and weekly top 50. the optional audio is in `public/games/racing/assets/`, and setup notes are in [`src/games/racing/README.md`](src/games/racing/README.md).

### cave flyer

`/games/cave`. hold to climb, let go to drop, and stay off the rock. the cave gets narrower and the turns get sharper. score is distance. six modes, each with its own global and weekly top 50: normal, slow (same cave, the gap closes later), glide (the gap closes like normal, and you fly slower), flip (hold to drop, let go to climb), narrow (the gap starts tight and stays there), and random (a new set of turns every run, and the gap still closes). same name as the other games. if the boards already exist, run [`src/games/run/supabase.sql`](src/games/run/supabase.sql) again so the extra modes can save.

### roof run

`/games/roof`. the roofs scroll toward you. space, click, or tap to jump. gaps and landings wander, and they get a little meaner the farther you go. most roofs sit level or lower. a higher roof still has a lip, so jumping late means you hit it. score is distance. same leaderboards as cave flyer. run [`src/games/run/supabase.sql`](src/games/run/supabase.sql) once if the boards should save.

### Otrio

pass-and-play. each of the nine circles holds a small, medium, and large ring. you win with three of one size in a line, small-medium-large along a line, or all three sizes stacked in one circle. with two players, each takes two opposite colors. with three, one color sits out.

### HeXO

hexagonal tic-tac-toe. X opens with one stone in the center, then every turn is two stones. six in a line wins. boards are base 8 or 13, with no clock, 5 minutes, or 10. type a square like `g7` to play it.

it goes way past that: 2 to 4 players, hex/triangle/square/octagon/radial grids, and a stack of optional rules (duck, king duck, egyptian, echo, orbit, meteor, raid, slide, frost, pair, scatter, siege, pendulum, mine, and a hidden one). the rules button in the game explains all of it.

you can play on one screen, against a practice bot, or **together** over a link. the room name in the link is the only secret. two players get one invite, three or four get one per seat. there's chat under the move list, and rematch swaps sides. replays live in the url.

### connect

bluD!NG, Hex, TwixT, PÜNCT, Star, *Star, and Y. you win by connecting edges (or scoring off connections) instead of making a row. red goes first. hotseat or practice bot, swap rule where the game has one, pan and zoom, and links carry the game. each game's rules show up the first time you play it. Star and *Star are still beta.

### go

baduk on 9×9, 13×13, or 19×19. click a crossing, use the arrows and enter, or type a point like `d4`. chinese rules, area scoring, 7.5 komi, positional superko. pass twice, click the dead groups, accept.

### hex chess

Gliński's hexagonal chess. 91 cells, files a–l without j, three bishops and nine pawns each. checkmate wins, and so does stalemate for the side that delivered it. threefold repetition, fifty moves, and bare kings with one minor piece are draws. two players or a practice bot. drag, zoom, flip, type a square like `g1`, step through the moves, copy them.

## KHT

`/kht`. a 370-entry bracket. anyone can watch. i sign in with a supabase magic link and edit names and scores, and it saves as one JSON blob in `kht_bracket`. odd rounds give the last entry a bye.

## tier list

`/tiers`. drag country flags from S to F (or tap a flag, then a row). it stays in your browser. you can share a link, download it as a PNG, and import that PNG later to get the list back.

## lingo

`/lingo`. a lingojam-style translator for a language you make yourself. the list is 500 basic english words: people, little words, numbers, time, qualities, verbs, and things. type your word next to each one.

`goes`, `went`, and `going` follow `go`, and `am` / `is` / `are` follow `be`, until you add a phrase that says otherwise. plurals follow the noun (`cats` follows `cat`). a dash leaves a word out. contractions such as `don't` and `it's` expand first.

phrases are extra swaps and they win over the word list. the longer phrase wins. english to yours, and yours back to english. if two words share a translation, the way back uses the earlier word in the list.

it stays in this browser as `eireLingo`. download it as json and import it later. "fill the blanks" invents a placeholder for anything you have not named, and leaves the ones you wrote.

dum languag is the featured language on that page. loading it asks first if the browser already has one. the words and sentences are [`src/data/dum-languag.lingo.json`](src/data/dum-languag.lingo.json).

## dum languag

`/dum`. a course for that language. eighteen units, five hearts. you choose, type, match, or tap. a miss shows the answer. running out of hearts ends the lesson without saving it. the streak is the local day you finish a lesson, saved as `eireDum`. english word order stays, endings such as going still use the root gloss, `q'` marks a possessive, question words start with `?`, and a noun starts with a capital. the sentence unit has a third lesson. the units after the extra words teach the newer words.

## jPol

a values quiz like the political compass, 8values, and sapplyvalues. full is 60 questions, express is 18. five-point answers, no right ones. you get a compass dot, six axes (equality, economy, authority, freedom, identity, progress), the topics that pulled you hardest, and a note if you answered mostly neutral or mostly extreme. download a PNG, copy a result link, keep old runs on this device, or paste a friend's code onto the same compass.

english, german, and russian are written out properly. the other languages are english run through a filter.

## jWorld

a private earth on leaflet. you sign in with a display name and password. registering and resetting a password need the world's invite code.

once you're in, you can:

- draw a country, or snap to a real-world outline and fix the coast by hand
- add territories, merge them, and redraw borders
- place a capital
- fill in a country page (names, motto, lore, government, flag, and the rest of `src/jworld/countryFields.js`)
- hand the country to someone else
- search and filter the list, and open a country at `/jworld/c/:id`

admins can edit anyone's country. the map polls for other people's changes. it shares the supabase project with the leaderboards, with its own tables.

## languages

the language menu is in the header and remembers your pick.

real ones:

- english (`eng`)
- german (`deu`), jPol included
- russian (`rus`), jPol included
- klingon (`kgn`), roughly, enough to get around
- slovak ('slk')

everything else is english through a filter: drunk, pirate, uwu, serious, vulgar, brainrot, Jenglish, IPA, emoji, toki-pona-ish, and shortened words. those are jokes.

## stack

- vue 3, vue router, vite
- leaflet and leaflet-draw for jWorld, topojson-client for the snapping
- supabase for scores, the KHT bracket, and jWorld
- a public MQTT broker for HeXO together games
- github pages, with a `404.html` that sends unknown paths back into the app

after a deploy, a tab that asks for an old chunk reloads once and keeps your page.

## running it

node 22 (that's what the deploy uses).

```bash
git clone https://github.com/eireq/eireq.github.io.git
cd eireq.github.io
npm install
npm run dev
```

should be on http://localhost:5173

```bash
npm run build
npm run preview
```

tests use node's own runner:

```bash
node --test --experimental-strip-types src/**/*.test.js
```

### .env

copy `.env.example` to `.env` if you want leaderboards, KHT editing, or jWorld:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_KHT_REDIRECT_URL=https://eireq.github.io/kht
```

`VITE_KHT_OWNER_ID` is the supabase auth user id that can edit the bracket. set it for production builds.

vite puts every `VITE_*` value into the bundle, so only use the anon key, with RLS on. never put a service-role key in here.

with an empty `.env` the site still runs. leaderboards, KHT saving, and jWorld just won't work.

### database

run these in the supabase SQL editor:

| what | script |
| --- | --- |
| lane runner and flag quiz scores | `src/games/racing/supabase.sql` |
| cave flyer and roof run scores | `src/games/run/supabase.sql` |
| KHT bracket | `src/games/kht/supabase.sql` |
| jWorld | `src/jworld/supabase.sql`, then `src/jworld/supabase_improve.sql` |

the flag quiz leaderboard reads `flag_quiz_best` from the racing script. if your tables are from an older run, run the function at the bottom of that script again. until you do, the page sorts the latest 1,000 rows itself.

after the jWorld base script:

```sql
update public.jworld_world set invite_code = 'your-secret' where id = 1;
```

the other `src/jworld/supabase_*.sql` files are later upgrades (accounts, capitals, transfers, admin, flags, passwords). read the comment at the top before running one.

KHT policies need the owner's auth user id in place of the placeholder UUID. in supabase authentication, allow these redirect urls:

- `https://eireq.github.io/kht`
- `http://localhost:5173/kht`

magic links go back to wherever they were requested. one sent from localhost only works while that dev server is running.

## deploy

`.github/workflows/deploy.yml` builds every push to `zapadoslavia` and puts `dist` on github pages. it needs these repo secrets:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_KHT_OWNER_ID`

## where things are

```
src/
  App.vue                 header, page, footer
  i18n.js                 languages and the joke filters
  locales/                german and russian
  router/index.js
  views/                  one file per page
  components/             header and footer
  data/                   flags, daily flag, flag of the week, daily pi, tier list, jPol, lingo, share cards
  assets/master_flags.json
  assets/flag_index.json  the slim copy for the database list
  games/fullscreen.js     the full screen button
  games/racing/           lane runner, audio, leaderboard
  games/run/              cave flyer and roof run, shared board
  games/go/               board, captures, scoring
  games/otrio/            ring rules
  games/hexo/             rules, grids, bot, together mode
  games/connect/          all seven connect games and the bot
  games/hexchess/         board and moves
  games/kht/              bracket
  jworld/                 map, borders, country fields, supabase
public/404.html           sends github pages 404s back into the app
public/og.png             the link preview image
```

## contact

- email: eireball@proton.me
- github: https://github.com/eireq
- discord: https://dsc.gg/pissedoff
- youtube: https://www.youtube.com/@eireq

© 2026 eire
