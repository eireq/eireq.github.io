# eireq.github.io

my website. games, a big pile of flags, a politics quiz, and a private map where my friends draw fake countries.

Live: https://eireq.github.io/

This is a Vue 3 app built with Vite. GitHub Pages deploys it from the `zapadoslavia` branch.

## Quick links

- [Overview](docs/overview.md)
- [Games](docs/games.md)
- [Flags & tools](docs/flags-and-tools.md)
- [jWorld](docs/jworld.md)
- [Development](docs/development.md)
- [Deployment & Supabase](docs/deployment.md)

## Pages

| Path | What's there |
| --- | --- |
| `/` | home; quick and daily entry points, deep games, explore, and the flag of the week |
| `/me` | about me |
| `/games` | all games, plus a random-game button |
| `/games/racing` | lane runner |
| `/games/flagquiz` | flag quiz |
| `/games/daily` | daily flag |
| `/games/hexo` | HeXO |
| `/games/connect` | connect games |
| `/games/otrio` | Otrio |
| `/games/go` | go |
| `/games/hexchess` | hex chess |
| `/kht` | KHT bracket |
| `/tools` | tools |
| `/tools/pi` | daily pi |
| `/flagdb` | flag database |
| `/flagdb/weeks` | flag of the week archive |
| `/flagdb/detail/:flagId` | a single flag page |
| `/compare` | side-by-side flag comparison |
| `/tiers` | country tier list |
| `/rc` | random flag |
| `/jpol` | jPol |
| `/jworld` | jWorld map |
| `/jworld/c/:id` | one jWorld country |
| `/art` | art |
| `/misc` | misc and links |
| `/contact` | contact |

## Stack

- Vue 3, Vue Router, Vite
- Leaflet and Leaflet Draw for jWorld
- Supabase for scores, the KHT bracket, and jWorld
- MQTT for HeXO together mode
- GitHub Pages, with a 404 fallback into the app

## Local development

Requirements: Node 22.

```bash
git clone https://github.com/eireq/eireq.github.io.git
cd eireq.github.io
npm install
npm run dev
```

Then open http://localhost:5173.

```bash
npm run build
npm run preview
```

Tests use Node's built-in runner:

```bash
node --test --experimental-strip-types src/**/*.test.js
```

## Environment variables

Copy `.env.example` to `.env` if you want leaderboards, KHT editing, or jWorld.

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_KHT_REDIRECT_URL=https://eireq.github.io/kht
```

`VITE_KHT_OWNER_ID` is used for the Supabase auth user that can edit the bracket. Set it for production builds.

The site still runs without `.env`; the features that depend on Supabase just won't work.

## Project structure

```text
src/
  App.vue
  i18n.js
  locales/
  router/
  views/
  components/
  data/
  assets/
  games/
  jworld/
public/
  404.html
  og.png
```

## Contact

- email: eireball@proton.me
- github: https://github.com/eireq
- discord: https://dsc.gg/pissedoff
- youtube: https://www.youtube.com/@eireq

© 2026 eire
