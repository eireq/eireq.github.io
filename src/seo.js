export const SITE = "https://eireq.github.io";

const person = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "eire",
  alternateName: ["eireq", "eireball", "irelandball"],
  description:
    "Hobby developer from Slovakia. Games, a flag database, and small web experiments.",
  url: `${SITE}/me`,
  email: "mailto:eireball@proton.me",
  homeLocation: { "@type": "Country", name: "Slovakia" },
  sameAs: [
    "https://github.com/eireq",
    "https://www.youtube.com/@い丸",
  ],
};

const website = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "eire",
  alternateName: "eireq",
  url: `${SITE}/`,
  description:
    "Personal site of eire (eireq): games, a flag database, and small web experiments.",
  author: { "@type": "Person", name: "eire", url: `${SITE}/me` },
};

export const pages = [
  {
    path: "/",
    title: "eire (eireq) — games, flags, and experiments",
    description:
      "Personal site of eire (eireq), from Slovakia. Go, HeXO, hex chess, Otrio, daily pi, jWorld, and a 1,700-flag database.",
    jsonLd: [website, person],
    fallback: `
      <h1>hey. im eire.</h1>
      <p>board games, daily pi, a private earth, and a flag pile that somehow stayed online. eire (eireq) is from Slovakia.</p>
      <nav>
        <a href="/me">about me</a>
        <a href="/flagdb">flag database</a>
        <a href="/games/go">go</a>
        <a href="/games/otrio">Otrio</a>
        <a href="/games/hexo">HeXO</a>
        <a href="/games/hexchess">hex chess</a>
        <a href="/tools/pi">daily pi</a>
        <a href="/jworld">jWorld</a>
        <a href="/games">games</a>
        <a href="/contact">contact</a>
      </nav>`,
  },
  {
    path: "/me",
    title: "about eire (eireq)",
    description:
      "eire (also eireq or eireball) is a hobby developer from Slovakia, not Ireland. Flags, browser games, music, and small websites.",
    ogType: "profile",
    jsonLd: person,
    fallback: `
      <h1>about me.</h1>
      <p>you can call me eire, eireball, eireq, or irelandball. i am not actually irish. i am from slovakia.</p>
      <p>i code useless websites and website games, and i collect flags. recent projects: <a href="/games/go">go</a>, <a href="/games/hexo">HeXO</a>, <a href="/games/hexchess">hex chess</a>, <a href="/games/otrio">Otrio</a>, <a href="/tools/pi">daily pi</a>, and <a href="/jworld">jWorld</a>. my username on most platforms is eireq.</p>
      <p>contact: <a href="mailto:eireball@proton.me">eireball@proton.me</a>. also on <a href="https://github.com/eireq">github</a>.</p>`,
  },
  {
    path: "/games",
    title: "games — eire",
    description:
      "Browser games by eire: Lane Runner, a flag quiz, daily flag, HeXO, Otrio, Go, and hex chess.",
    fallback: `
      <h1>games.</h1>
      <p>a collection of games i've made. mostly small projects, experiments, and things i thought would be funny to make.</p>
      <nav>
        <a href="/games/racing">lane runner</a>
        <a href="/games/flagquiz">flag quiz</a>
        <a href="/games/daily">daily flag</a>
        <a href="/games/hexo">HeXO</a>
        <a href="/games/otrio">Otrio</a>
        <a href="/games/go">go</a>
        <a href="/games/hexchess">hex chess</a>
      </nav>`,
  },
  {
    path: "/games/racing",
    title: "lane runner — eire",
    description:
      "Endless 4-lane dodge game by eire. Change lanes, score distance and overtakes, and chase the leaderboard.",
    fallback: `<h1>eiracing :: lane runner</h1><p>lane changing game. with leaderboards.</p>`,
  },
  {
    path: "/games/flagquiz",
    title: "flag quiz — eire",
    description:
      "Name flags from eire's database: countries, territories, history, subdivisions, or organizations.",
    fallback: `<h1>flag quiz.</h1><p>identify flags from around the world. pools come from the flag database.</p>`,
  },
  {
    path: "/games/daily",
    title: "daily flag — eire",
    description:
      "One shared country flag each UTC day. Six guesses. The streak stays in this browser.",
    fallback: `<h1>daily flag.</h1><p>one shared flag every day. keep the streak alive.</p>`,
  },
  {
    path: "/games/hexo",
    title: "HeXO — eire",
    description: "Hexagonal tic-tac-toe by eire. Six in a row on 169 tiles.",
    fallback: `<h1>HeXO</h1><p>hexagonal tic-tac-toe. six in a row on 169 tiles.</p>`,
  },
  {
    path: "/games/otrio",
    title: "Otrio — eire",
    description:
      "Pass-and-play ring tic-tac-toe by eire. Three ring sizes, two to four players.",
    fallback: `<h1>Otrio</h1><p>tic-tac-toe with three ring sizes. two to four players.</p>`,
  },
  {
    path: "/games/go",
    title: "go — eire",
    description:
      "Baduk for two players on one screen. Boards of 9, 13, or 19.",
    fallback: `<h1>go</h1><p>baduk. capture stones on 9, 13, or 19. two players, one screen.</p>`,
  },
  {
    path: "/games/hexchess",
    title: "hex chess — eire",
    description: "Gliński's hexagonal chess. 91 cells, three bishops, nine pawns.",
    fallback: `<h1>hex chess</h1><p>glinski hexagonal chess. 91 cells, three bishops, nine pawns.</p>`,
  },
  {
    path: "/tools",
    title: "tools — eire",
    description:
      "Tools on eire's site: flag database, country tier list, random country, daily flag, daily pi, and flag compare.",
    fallback: `
      <h1>tools.</h1>
      <p>browse flags, pick random places, and poke around the data.</p>
      <nav>
        <a href="/flagdb">flag database</a>
        <a href="/tiers">country tier list</a>
        <a href="/rc">random country</a>
        <a href="/games/daily">daily flag</a>
        <a href="/tools/pi">daily pi</a>
        <a href="/compare">compare flags</a>
      </nav>`,
  },
  {
    path: "/tools/pi",
    title: "daily pi — eire",
    description:
      "One pi lesson per UTC day. Learn a few more digits, then take the quiz. Progress stays in this browser.",
    fallback: `<h1>daily pi.</h1><p>one lesson per utc day. study a few new digits, then take the quiz.</p>`,
  },
  {
    path: "/flagdb/weeks",
    title: "flag of the week — eire",
    description: "The editorial flags that rotate through the home-page flag of the week.",
    fallback: `<h1>flag of the week</h1><p>the editorial set behind the home-page flag.</p>`,
  },
  {
    path: "/flagdb",
    title: "flag database — eire",
    description:
      "Search about 1,700 flags: countries, territories, subdivisions, historical flags, and organizations.",
    fallback: `<h1>flag database</h1><p>search and browse 1,700+ flags with details, categories, and collections.</p>`,
  },
  {
    path: "/compare",
    title: "compare flags — eire",
    description:
      "Put two flags from eire's database side by side. Colors, proportions, dates, and a similarity score.",
    fallback: `<h1>compare flags.</h1><p>pick two flags and compare colors, proportions, and dates.</p>`,
  },
  {
    path: "/tiers",
    title: "country tier list — eire",
    description:
      "Rank country flags into tiers. Drag flags, keep the list in this browser, copy a link, or download an image.",
    fallback: `<h1>country tier list.</h1><p>rank country flags into tiers. the list stays in this browser.</p>`,
  },
  {
    path: "/rc",
    title: "random country — eire",
    description:
      "Draw a random entry from eire's flag corpus and open its record.",
    fallback: `<h1>pick a place.</h1><p>a random entry from the same flag database as the quiz and the flag explorer.</p>`,
  },
  {
    path: "/jpol",
    title: "jPol — eire",
    description:
      "jPol, a political values quiz by eire. Full or express. No correct answers.",
    fallback: `<h1>jPol</h1><p>full or express political values quiz with a shareable compass result.</p>`,
  },
  {
    path: "/politics",
    title: "political preferences — eire",
    description: "Saved political-values charts from jPol.",
    fallback: `<h1>political compass &amp; values</h1><p>saved charts from the jPol values quiz.</p>`,
  },
  {
    path: "/elections",
    title: "doulantese elections — eire",
    description:
      "Doulantese elections: the Discord union assembly ballot, with parties, votes, and seats.",
    fallback: `<h1>Doulantese elections.</h1><p>the discord union assembly ballot. parties, votes, and seats from the last count.</p>`,
  },
  {
    path: "/kht",
    title: "KHT tournament — eire",
    description: "KHT, a large public bracket tournament. Anyone can view it.",
    fallback: `<h1>KHT</h1><p>a giant bracket tournament. watch it update live.</p>`,
  },
  {
    path: "/art",
    title: "art — eire",
    description:
      "Art by eire: digital experiments and fictional flag designs.",
    fallback: `<h1>art.</h1><p>digital experiments, flag designs, and things i thought would be funny to draw.</p>`,
  },
  {
    path: "/misc",
    title: "misc — eire",
    description:
      "Miscellaneous projects by eire: jPol, election results, and links out to other experiments.",
    fallback: `
      <h1>misc.</h1>
      <p>projects that do not fit into games, tools, or art.</p>
      <nav>
        <a href="/jpol">jPol</a>
        <a href="/politics">political preferences</a>
        <a href="/elections">doulantese elections</a>
      </nav>`,
  },
  {
    path: "/contact",
    title: "contact eire (eireq)",
    description:
      "Contact eire (eireq) about programming, flags, games, music, or anything else. Email eireball@proton.me.",
    fallback: `
      <h1>contact.</h1>
      <p>want to talk about programming, flags, games, music, movies, or anything else? send a message.</p>
      <p><a href="mailto:eireball@proton.me">eireball@proton.me</a></p>`,
  },
];

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function pageUrl(path) {
  return path === "/" ? `${SITE}/` : `${SITE}${path}`;
}

export function seoForPath(path) {
  const normalized =
    path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path || "/";
  return pages.find((page) => page.path === normalized) || null;
}

export function headTags(page) {
  const url = pageUrl(page.path);
  const lines = [
    `<title>${escapeHtml(page.title)}</title>`,
    `<meta name="description" content="${escapeHtml(page.description)}">`,
    `<link rel="canonical" href="${escapeHtml(url)}">`,
    `<meta property="og:title" content="${escapeHtml(page.title)}">`,
    `<meta property="og:description" content="${escapeHtml(page.description)}">`,
    `<meta property="og:url" content="${escapeHtml(url)}">`,
    `<meta property="og:type" content="${page.ogType || "website"}">`,
    `<meta property="og:image" content="${SITE}/og.png">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:image" content="${SITE}/og.png">`,
    `<meta name="google-site-verification" content="ePz_bVG4jiZArH9rrItRNk8IY7gURIRRspbTQ5GZCCQ">`,
  ];

  const entries = page.jsonLd
    ? Array.isArray(page.jsonLd)
      ? page.jsonLd
      : [page.jsonLd]
    : [];

  for (const entry of entries) {
    lines.push(
      `<script type="application/ld+json">${JSON.stringify(entry)}</script>`,
    );
  }

  return lines.join("\n    ");
}

export function fallbackHtml(page) {
  return `<article id="seo-fallback">${page.fallback}</article>`;
}
