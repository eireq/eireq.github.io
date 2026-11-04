# Development

This page covers running the project locally, testing it, and understanding the repository structure.

## Requirements

- Node 22

## Local setup

```bash
git clone https://github.com/eireq/eireq.github.io.git
cd eireq.github.io
npm install
npm run dev
```

Open http://localhost:5173.

## Production build preview

```bash
npm run build
npm run preview
```

## Testing

Tests use Node's built-in runner:

```bash
node --test --experimental-strip-types src/**/*.test.js
```

## Environment variables

Copy `.env.example` to `.env` if you want:

- leaderboards
- KHT editing
- jWorld features

Example:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_KHT_REDIRECT_URL=https://eireq.github.io/kht
```

`VITE_KHT_OWNER_ID` should be set for production builds.

Do not put a service-role key into the frontend environment. Vite will embed `VITE_*` values into the JavaScript bundle, so only use the public anon key with RLS enabled.

## Repository layout

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

## Project notes

- The app is deployed from the `zapadoslavia` branch.
- GitHub Pages uses the `404.html` fallback to route unknown paths back into the app.
- The site supports multiple language modes and a few “joke” filters in addition to actual languages.

## Related docs

- [Overview](overview.md)
- [Games](games.md)
- [Flags & tools](flags-and-tools.md)
- [jWorld](jworld.md)
- [Deployment & Supabase](deployment.md)
