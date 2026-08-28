# eireq.github.io

**My main page. Everything I did is here.**

A modern, interactive portfolio website built with **Vue 3** and **Vite**, featuring games, tools, and multi-language support.

**Live site:** https://eireq.github.io/

---

> NOTE: This README reflects the file layout and contents from the `hayastan` branch (not `main`). The hayastan branch contains several view components and other branch-specific changes.

## 🎯 Overview

This is a GitHub Pages portfolio site showcasing creative projects and interactive experiences.

### Key Features:
- ✨ **Vue 3 + Vite** — Modern, fast SPA framework
- 🎮 **Interactive Games** — Multiple arcade-style games with leaderboards
- 🌍 **Multi-language Support** — English and Slovak (via i18n system)
- 🎨 **Dark Theme** — Sleek, minimal design
- 📱 **Responsive** — Works seamlessly on mobile and desktop
- 🗂️ **Component-based** — Modular Vue components for reusability

---

## 📁 Project Structure (hayastan branch)

```
eireq.github.io/
├── src/
│   ├── App.vue                      # Root Vue component with routing
│   ├── main.js                      # Vue app initialization
│   ├── i18n.js                      # Internationalization (multi-language)
│   ├── assets/
│   │   └── main.css                 # Global styles
│   ├── components/                  # Reusable Vue components
│   │   ├── AppHeader.vue            # Navigation header
│   │   └── AppFooter.vue            # Footer with contact info
│   ├── views/                       # Page-level components (hayastan branch)
│   │   ├── [AboutMeView.vue](https://github.com/eireq/eireq.github.io/blob/hayastan/src/views/AboutMeView.vue) — Personal bio and introduction
│   │   ├── [ArtView.vue](https://github.com/eireq/eireq.github.io/blob/hayastan/src/views/ArtView.vue) — Gallery and digital art showcase
│   │   ├── [ContactView.vue](https://github.com/eireq/eireq.github.io/blob/hayastan/src/views/ContactView.vue) — Contact information and message form
│   │   ├── [DoulanteseElectionsView.vue](https://github.com/eireq/eireq.github.io/blob/hayastan/src/views/DoulanteseElectionsView.vue) — Mock election results / community polls
│   │   ├── [FlagQuizView.vue](https://github.com/eireq/eireq.github.io/blob/hayastan/src/views/FlagQuizView.vue) — Flag quiz game with leaderboards
│   │   ├── [GameRacingView.vue](https://github.com/eireq/eireq.github.io/blob/hayastan/src/views/GameRacingView.vue) — Lane Runner / racing game entry point
│   │   ├── [GamesView.vue](https://github.com/eireq/eireq.github.io/blob/hayastan/src/views/GamesView.vue) — Games index and links
│   │   ├── [HomeView.vue](https://github.com/eireq/eireq.github.io/blob/hayastan/src/views/HomeView.vue) — Landing / hero section
│   │   ├── [MiscView.vue](https://github.com/eireq/eireq.github.io/blob/hayastan/src/views/MiscView.vue) — Misc tools and utilities (random country, modes, etc.)
│   │   ├── [PoliticalPreferencesView.vue](https://github.com/eireq/eireq.github.io/blob/hayastan/src/views/PoliticalPreferencesView.vue) — Political quiz/results gallery
│   │   └── [RandomCountryView.vue](https://github.com/eireq/eireq.github.io/blob/hayastan/src/views/RandomCountryView.vue) — Random country picker tool
│   ├── games/                       # Game implementations
│   │   └── racing/
│   │       ├── config.js            # Game configuration
│   │       └── supabase.js          # Leaderboard database
│   ├── router/                      # Vue Router configuration
│   └── data/                        # Static data files
├── package.json                     # Dependencies & scripts
├── vite.config.js                   # Vite build config
├── index.html                       # SPA root entry point
└── README.md                        # This file (updated for hayastan)
```

---

## 🛠️ Technologies

**Frontend:**
- **Vue 3** — Progressive JavaScript framework
- **Vue Router** — Client-side routing
- **Vite** — Next-generation build tool
- **CSS3** — Modern styling with responsive design

**Backend & Database:**
- **Supabase** — Real-time database for leaderboards
- **Supabase JS SDK** — Client library for database operations

**Hosting:**
- **GitHub Pages** — Free static site hosting

---

## 📦 Dependencies

```json
{
  "dependencies": {
    "vue": "^3.5.13",
    "vue-router": "^4.5.0",
    "@supabase/supabase-js": "^2.49.1"
  },
  "devDependencies": {
    "vite": "^6.2.0",
    "@vitejs/plugin-vue": "^5.2.1"
  }
}
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

```bash
# Clone the repository
git clone https://github.com/eireq/eireq.github.io.git
cd eireq.github.io

# Install dependencies
npm install
```

### Development

```bash
# Start dev server (http://localhost:5173)
npm run dev
```

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🎮 Games

### Lane Runner
An 8-bit arcade-style driving game where you dodge traffic by changing lanes.

**Features:**
- Lane-changing mechanics
- Global and weekly leaderboards (powered by Supabase)
- Multiple game modes (Normal & Speed Bomb)
- Score, speed, distance, and overtake tracking
- Player name saving

**Location:** `/src/games/racing/`

---

## 🌐 Internationalization (i18n)

Multi-language support is built-in via `src/i18n.js`. Currently supports:
- **English** (en)
- **Slovak** (sk)

Language strings are centralized in the i18n file, making it easy to add more languages.

---

## 🔗 Navigation

- **Home:** `/`
- **About:** `/me`
- **Random Country Tool:** `/rc`
- **Games:** `/games`
- **Lane Runner Game:** `/games/racing`

---

## 🎨 Design

- **Color Scheme:** Dark theme (black background, white text)
- **Typography:** Clean, minimal sans-serif
- **Layout:** Responsive grid-based design
- **Animations:** Smooth transitions and hover effects

---

## 📊 Architecture

### Component Hierarchy
```
App.vue
├── AppHeader.vue (navigation)
├── Router Views (page content)
└── AppFooter.vue (footer)
```

### Data Flow
- Vue Router manages page navigation
- Components fetch data as needed
- Supabase handles leaderboard persistence

---

## 🤝 Community

- **Discord:** [Join the community](https://discord.gg/zwvvbqBFPV)
- **GitHub:** [@eireq](https://github.com/eireq)
- **YouTube:** [@いぃ八](https://www.youtube.com/@%E3%81%84%E4%B8%A8)

---

## 📧 Contact

Reach out via email: **eireball@proton.me**

---

## 📝 Latest Update

**v2.4** — Flag quiz and mode leaderboards! 🚀

---

## 📄 License

© 2026 eire

---

## 🚀 Contributing

Found a bug or have a feature request? Feel free to:
- Open an issue on GitHub
- Contact via email
- Join the Discord community

---

*Built with ❤️ using Vue 3 and Vite*
