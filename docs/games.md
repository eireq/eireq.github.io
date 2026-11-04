# Games

The games section is one of the core parts of the site. It includes arcade games, board-style games, and puzzle concepts built in the browser.

## Main games

### Lane Runner

An endless 4-lane dodging game.

Features:

- 4-lane procedural road
- keyboard controls: left/right or A/D
- pause with `P`
- exit with `Esc`
- score based on distance, overtakes, and speed
- local scores and global/weekly leaderboards

### Flag Quiz

A quiz built around the site's flag database.

Features:

- country, territory, historical, subdivision, and org flags
- multiple length modes
- score tracking and leaderboard integration
- answer checking that accepts common aliases like `USA` and `UK`

### Daily Flag

A daily challenge game.

Features:

- one country per UTC day
- six guesses
- browser-based streak tracking
- result copy as text or image

### HeXO

A hexagonal tic-tac-toe variation.

Features:

- board sizes and modes
- local play, practice bots, and together mode
- link-based multiplayer room setup
- optional rules and board configurations

### Connect

A family of connection games including variants like:

- bluD!NG
- Hex
- TwixT
- PÜNCT
- Star
- *Star
- Y

### Otrio

A ring-based game on a 3x3 board structure. Players try to create patterns and lines using ring sizes and positions.

### Go

A browser implementation of Go.

Features:

- 9x9, 13x13, or 19x19 board sizes
- area scoring
- komi and positional superko
- pass and dead-group handling

### Hex Chess

A hexagonal chess variant played on a 91-cell board using Gliński's setup.

## Game hosting and multiplayer

Some games are purely client-side. Others integrate with Supabase for global leaderboards or with MQTT for shared-room play.

## Related docs

- [Flags & tools](flags-and-tools.md)
- [Development](development.md)
- [Deployment & Supabase](deployment.md)
