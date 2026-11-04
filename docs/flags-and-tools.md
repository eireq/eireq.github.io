# Flags & tools

This section covers the data-heavy, informational parts of the site: flag records, comparison tools, daily flag features, and various utility pages.

## Flag database

The site stores its flag content in `src/assets/master_flags.json`.

This dataset includes:

- countries
- territories
- subdivisions
- historical flags
- organizations
- special collections such as Soviet and revolutionary-era sets

Flag pages pull in:

- colors
- dates
- ratio
- designer information when present
- Wikipedia summaries
- similar flags

## Flag of the week

The site has a rotating flag-of-the-week feature.

- featured on the home page
- stored in an archive at `/flagdb/weeks`
- draws from a curated list or from the pool when needed

## Daily flag

`/games/daily` is a daily guess game.

Players:

- guess the country for the day
- have six attempts
- keep a browser-based streak
- copy their result as text or an image

## Flag comparison

`/compare` lets users compare two flags side-by-side and see a similarity score. It accepts query params like `?a=` and `?b=`.

## Tier list

`/tiers` is a country tier list from S to F.

Features:

- drag/drop ordering
- browser-persistent state
- shareable link
- PNG export/import

## Daily Pi

`/tools/pi` gives a digit-of-pi lesson once per UTC day.

Features:

- incrementally growing digit batches
- guided learning
- quiz progression
- saved progress in-browser

## Random country and random flag

The site has quick-access randomization features for country/flag discovery.

## Related docs

- [Games](games.md)
- [Development](development.md)
- [Deployment & Supabase](deployment.md)
