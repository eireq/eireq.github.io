# Overview

This repository is the source for eireq.github.io, a personal website and web app suite built around games, flag content, political tools, and a private collaborative map project.

The site is a Vue 3 app deployed through GitHub Pages. The active deploy branch is `zapadoslavia`.

## What is on the site

The site includes:

- games, from arcade challenges to board games and logic puzzles
- a large flag database with country records, comparisons, and historical flags
- daily and weekly flag activities
- political and values-oriented quiz pages
- a private world-building map called jWorld
- miscellaneous personal and project pages

## Main sections

- [Games](games.md)
- [Flags & tools](flags-and-tools.md)
- [jWorld](jworld.md)
- [Development](development.md)
- [Deployment & Supabase](deployment.md)

## Site philosophy

The site is intentionally eclectic: one part personal website, one part game collection, one part data project. That means the codebase is more like a small platform of mini-apps than a single standard website.

Most parts are client-side and static-friendly, which is a good fit for GitHub Pages. The bigger pieces that need storage or shared state use Supabase.

## Quick start

```bash
git clone https://github.com/eireq/eireq.github.io.git
cd eireq.github.io
npm install
npm run dev
```

Then open http://localhost:5173.

See [Development](development.md) for the full workflow and testing setup.
