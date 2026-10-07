import { ref } from "vue";
import { jpolDeu } from "./locales/jpol-deu.js";
import { jpolRus } from "./locales/jpol-rus.js";
import { siteDeu } from "./locales/site-deu.js";
import { siteRus } from "./locales/site-rus.js";

export const languageGroups = [
  {
    label: "real languages",
    languages: [
      { code: "eng", label: "english" },
      { code: "deu", label: "deutsch" },
      { code: "rus", label: "русский" },
      { code: "kgn", label: "klingon" },
    ],
  },
  // Joke modes below: not hand-translated. They clone English and run string filters.
  {
    label: "stereotypes (auto english jokes)",
    languages: [
      { code: "dnk", label: "drunk english" },
      { code: "prt", label: "pirate english" },
      { code: "uwu", label: "kawaii uwu anime gurl :3" },
      { code: "srs", label: "serious english" },
      { code: "fck", label: "vulgar english" },
      { code: "ttt", label: "brainrot english" },
    ],
  },
  {
    label: "crazy filters (also auto, not real translations)",
    languages: [
      { code: "jjj", label: "Jenglish (english but every consonant is J)" },
      { code: "ipa", label: "international phonetic alphabet" },
      { code: "emj", label: "emojis" },
      {
        code: "tkp",
        label:
          "toki pona but every word is translated back to english so its just a simpler type of english",
      },
      { code: "sew", label: "shortening every word" },
    ],
  },
];

export const languages = languageGroups.flatMap((group) => group.languages);

const savedLanguage = window.localStorage.getItem("language");
const language = ref(
  languages.some((item) => item.code === savedLanguage) ? savedLanguage : "eng",
);

const messages = {
  eng: {
    nav: {
      about: "about me",
      randomCountry: "random country",
      modes: "modes.",
      games: "games",
      tools: "tools",
      art: "art",
      misc: "misc",
      contact: "contact",
      github: "github",
      discord: "discord serv",
      youtube: "youtube",
      language: "language",
      available: "available",
      comingSoon: "coming soon",
      moreLanguages: "more languages",
      menu: "menu",
      close: "close",
    },
    home: {
      greeting: "hey.",
      signature: "im eire.",
      lead:
        "games, a giant flag database, and a few experiments that somehow stayed online.",
      about: "about me ->",
      contact: "contact ->",
      dailyCta: "daily flag ->",
      flagDbCta: "flag database ->",
      whatTitle: "what to do here",
      whatIntro:
        "a short tour of the best bits. pick anything. leaving is optional.",
      featDaily: "daily flag",
      featDailyText: "one shared country flag every UTC day. six guesses.",
      featDb: "flag database",
      featDbText: "1,700+ flags with colors, ratios, and wikipedia writeups.",
      featQuiz: "flag quiz",
      featQuizText: "countries, territories, history, orgs — your call.",
      featCompare: "compare flags",
      featCompareText: "put two flags side by side and spot the differences.",
      featRacing: "lane runner",
      featRacingText: "change lanes, dodge traffic, chase the leaderboard.",
      featJpol: "jPol",
      featJpolText: "full or express values map. no correct answers.",
      weekTitle: "flag of the week",
      weekOpen: "open flag record ->",
      weekCompare: "compare it ->",
    },
    games: {
      title: "games.",
      intro:
        "a collection of games i've made. mostly small projects, experiments, and things i thought would be funny to make.",
      racing: "racing",
      racingText: "lane changing game. with leaderboards!!",
      flagQuiz: "flag quiz",
      flagQuizText:
        "identify flags from around the world. how many can you get right?",
      dailyFlag: "daily flag",
      dailyFlagText: "one shared flag every day. keep the streak alive.",
      kht: "KHT tournament",
      khtText: "a giant bracket tournament. watch it update live.",
    },
    tools: {
      title: "tools.",
      intro:
        "useful (and less useful) utilities. browse flags, pick random places, and poke around the data.",
      flagDatabase: "flag database",
      flagDatabaseText:
        "search and browse 1,700+ flags with details, categories, and collections.",
      randomCountry: "random country",
      randomCountryText:
        "generate a random entry from the shared flag corpus.",
      dailyFlag: "daily flag",
      dailyFlagText: "guess today's flag. streaks stay on this device.",
      flagQuiz: "flag quiz",
      flagQuizText: "quiz modes powered by the same flag database.",
      compare: "compare flags",
      compareText: "two flags, colors, ratios, and a similarity score.",
    },
    compare: {
      title: "compare flags.",
      intro:
        "pick two flags from the shared database and compare colors, proportions, and dates.",
      loading: "loading flag corpus…",
      left: "flag a",
      right: "flag b",
      search: "search flags…",
      pickPrompt: "search for a flag above.",
      category: "category",
      adopted: "adopted",
      proportions: "proportions",
      colors: "colors",
      similarity: "similarity score",
    },
    misc: {
      title: "misc.",
      intro:
        "a collection of miscellaneous projects, experiments, and other things that do not fit into games, tools, or art.",
      politics: "political preferences",
      politicsText: "my ideological charts and political test results.",
      jpol: "jPol",
      jpolText:
        "full or express political values quiz with a shareable compass result.",
      modes: "modes",
      modesText: "another project from my collection of web experiments.",
      discordBots: "discord bots",
      discordBotsText:
        "small bots and other experiments from my GitHub projects.",
      elections: "Doulantese elections",
      electionsText: "results from the Discord union assembly.",
    },
    art: {
      title: "art.",
      intro:
        "a collection of art i've made. mostly digital experiments, flag designs, and things i thought would be funny to draw.",
      digital: "digital art",
      digitalText: "drawings, experiments, and other digital creations.",
      flags: "flag designs",
      flagsText: "fictional flags and designs inspired by vexillology.",
      more: "more coming soon",
      moreText:
        "i'll add more of my art here when i make something worth showing.",
    },
    contact: {
      title: "contact.",
      intro:
        "want to talk about programming, flags, games, music, movies, or anything else? send me a message.",
      find: "find me",
      server: "discord server",
      username: "my username on most platforms is",
      send: "send a message",
      name: "name",
      email: "email",
      message: "message",
      openDraft: "open email draft",
      status: "your email app should open with the message ready to send.",
    },
    randomCountry: {
      eyebrow: "random country",
      title: "pick a place.",
      intro:
        "powered by the same flag database as the quiz and flag explorer. the map is bigger than you think.",
      yourPlace: "your random place",
      randomize: "randomize",
      pool: "the full pool",
      entries: "entries",
      find: "find an entry",
      search: "search...",
      empty: "no places found.",
      loading: "loading flag corpus…",
      poolFilter: "pool",
      openRecord: "open flag record →",
      pickPrompt: "hit randomize",
    },
    dailyFlag: {
      eyebrow: "daily challenge",
      title: "daily flag.",
      intro:
        "one country flag for everyone each UTC day. six guesses. streaks stay on your device.",
      loading: "loading today's flag…",
      streak: "streak",
      flagAlt: "today's mystery flag",
      guess: "your guess",
      placeholder: "country name...",
      submit: "guess",
      attempts: "attempts",
      solved: "solved. come back tomorrow.",
      failed: "out of guesses. the flag wins today.",
      answer: "answer",
      share: "copy result",
      copied: "copied!",
    },
    politics: {
      title: "political compass & values",
      subtitle:
        "a collection of my ideological charts and political test results.",
      results: "political test results",
      compass: "traditional 2D axes",
      sapply: "3D compass grid",
      dozen: "12 core values",
      orbs: "spherical model",
      eight: "4 independent axes",
      nine: "9 detailed axes",
      scales: "8 characteristics & tags",
      left: "left-wing spectrum",
      right: "right-wing spectrum",
      alt: "alternative values spectrum",
      unavailable: "image not uploaded yet",
    },
    footer: {
      contact: "contact",
      text: "you can contact me via",
      email: "email",
    },
    flagQuiz: {
      title: "flag quiz.",
      intro:
        "how well do you know the world's flags? pools now come straight from the flag database.",
      name: "name",
      namePlaceholder: "a guy",
      mode: "quiz mode",
      amount: "number of flags",
      flags: "flags",
      start: "start quiz →",
      loading: "loading flags...",
      flagAlt: "mystery flag",
      unavailable: "flag image unavailable",
      countryPlaceholder: "country name...",
      enter: "enter",
      score: "score",
      complete: "quiz complete.",
      analysis: "analyze missed flags",
      hideAnalysis: "hide analysis",
      allCorrect: "perfect. you got every flag right.",
      yourAnswer: "your answer",
      correctAnswer: "correct answer",
      noAnswer: "no answer",
      leaderboard: "leaderboard",
      loadingLeaderboard: "loading leaderboard...",
      noScores: "no scores yet.",
      position: "your position:",
      playAgain: "play again →",
      perfect: "perfect score. suspicious.",
      good: "pretty good. you may continue existing.",
      okay: "not terrible. the flags remain unconvinced.",
      defeated: "the flags have defeated you.",
      cheatedTitle: "devtools detected.",
      cheatedText:
        "nice try. answers aren't in the DOM, and opening the console voids the run. no leaderboard for detectives.",
      cheatedAgain: "try again without cheating →",
      modes: {
        normal: "countries",
        countries: "countries",
        territorial: "territories",
        historical: "historical",
        subdivisions: "subdivisions",
        organizations: "organizations",
        all: "all flags",
      },
    },
    elections: {
      eyebrow: "Discord union assembly",
      title: "Doulantese elections.",
      intro: "preference results as recorded from the election ballot.",
      results: "election results",
      choice: "choice",
      review: "last reviewed: 2026/08/28 13:30 Central European Summer Time",
      party: "party",
      votes: "votes",
      share: "vote share",
      seats: "seats",
    },
    flagDb: {
      title: "Flag database",
      records: "records",
      intro: "browse flags <3 click on a flag to see more info.",
      loading: "loading flag records…",
      search: "Search flags",
      searchPlaceholder: "Name, detail, date, designer...",
      category: "Category",
      allCategories: "All categories",
      territories: "Territories & dependencies",
      sortBy: "Sort by",
      sortNameAsc: "Name, A to Z",
      sortNameDesc: "Name, Z to A",
      sortAdoptOld: "Adoption date, oldest",
      sortAdoptNew: "Adoption date, newest",
      sortCancelOld: "Cancellation date, oldest",
      sortCancelNew: "Cancellation date, newest",
      collections: "Collections",
      subdivisions: "Subdivisions",
      allSubdivisions: "All subdivisions",
      empty: "No flags match those filters. Try a broader search.",
      matching: "matching flags",
      showing: "Showing",
      details: "Details",
      previous: "Previous",
      next: "Next",
      page: "Page",
      of: "of",
      allCountries: "All countries",
      ariaDirectory: "Flag records",
      ariaCollections: "Flag collections",
      ariaSubdivisions: "Subdivision countries",
      ariaPages: "Flag list pages",
    },
    flagDetail: {
      loading: "loading flag record…",
      database: "Flag database",
      unavailable: "Flag image unavailable",
      colors: "Colors",
      readingPalette: "reading palette from svg…",
      noColors: "no hex colors found in the source svg.",
      flagOf: "Flag of",
      loadingWiki: "loading wikipedia article…",
      readMore: "Read more on Wikipedia",
      recordDetails: "Record details",
      category: "Category",
      adopted: "Adopted",
      cancelled: "Cancelled",
      proportions: "Proportions",
      designer: "Designer",
      palette: "Palette",
      similar: "Similar flags",
      compare: "Compare with another flag",
      notFound: "Flag not found",
      back: "Back to the database",
      notRecorded: "Not recorded",
    },
    kht: {
      title: "KHT",
      intro:
        "Enter the scores for each matchup. The higher score advances, and odd rounds give the last unpaired entry a bye.",
      ownerEditing: "owner editing enabled",
      publicView: "public view",
      ownerAccess: "Owner access",
      ownerOnly: "Only the tournament owner can edit item names or scores.",
      ownerEmail: "owner email",
      sending: "sending...",
      sendLogin: "send login link",
      editingAsOwner: "Editing as owner",
      autosave: "Changes save automatically for everyone viewing this bracket.",
      signOut: "sign out",
      match: "match",
      matches: "matches",
    },
    jpol: {
      title: "jPol",
      intro:
        "a political values quiz inspired by the political compass, 8values, and sapplyvalues. no correct answers — just a map of tendencies.",
      modeFull: "full · 60 questions",
      modeExpress: "express · 18 questions",
      start: "start quiz",
      question: "question",
      back: "back",
      next: "next question",
      seeResult: "see my result",
      stronglyAgree: "Strongly agree",
      agree: "Agree",
      neutral: "Neutral / unsure",
      disagree: "Disagree",
      stronglyDisagree: "Strongly disagree",
      hintStrongAgree: "very much me",
      hintAgree: "mostly me",
      hintNeutral: "somewhere in between",
      hintDisagree: "mostly not me",
      hintStrongDisagree: "not me at all",
      resultLabel: "your jPol result",
      resultNote:
        "These scores describe the balance of answers you gave, not a permanent political identity.",
      download: "download PNG",
      share: "copy result link",
      shared: "link copied",
      again: "take it again",
      economic: "economic",
      social: "social",
      socialChange: "social change",
      progressive: "progressive",
      conservative: "conservative",
      left: "left",
      right: "right",
      libertarian: "libertarian",
      authoritarian: "authoritarian",
      balanced: "balanced",
      compassNote:
        "Authoritarian is up, libertarian is down — same layout as the classic political compass.",
      axesTitle: "six value axes",
      issuesTitle: "topics that pulled hardest",
      calibrationNeutral:
        "lots of neutral answers — your dot is near the middle partly because you skipped strong opinions.",
      calibrationExtreme:
        "almost every answer was strongly agree/disagree — your result is sharp, maybe sharper than you feel day to day.",
      calibrationFlat:
        "answers stayed mild overall — treat the exact coordinates as a soft estimate.",
      historyTitle: "recent results on this device",
      historyEmpty: "no saved runs yet.",
      compareTitle: "compare with a friend",
      comparePlaceholder: "paste their result code or link",
      compareApply: "show on compass",
      compareClear: "clear",
      compareInvalid: "could not read that result code.",
      you: "you",
      friend: "friend",
      setupTitle: "choose a path",
      axisEquality: "Equality",
      axisEqualityLeft: "equality",
      axisEqualityRight: "markets",
      axisCoordination: "Economy",
      axisCoordinationLeft: "public",
      axisCoordinationRight: "private",
      axisPower: "Authority",
      axisPowerLeft: "liberty",
      axisPowerRight: "order",
      axisAutonomy: "Freedom",
      axisAutonomyLeft: "personal freedom",
      axisAutonomyRight: "social control",
      axisIdentity: "Identity",
      axisIdentityLeft: "pluralism",
      axisIdentityRight: "homogeneity",
      axisProgress: "Progress",
      axisProgressLeft: "tradition",
      axisProgressRight: "progress",
      issues: {
        economy: "economy",
        welfare: "welfare",
        labor: "labor",
        speech: "speech",
        privacy: "privacy",
        order: "order & security",
        immigration: "immigration",
        nation: "nation & culture",
        tradition: "tradition",
        science: "science & change",
      },
      ideology: {
        authLeft: {
          name: "authoritarian left",
          blurb:
            "you lean toward collective economic goals paired with a stronger guiding state.",
        },
        authLeftProgressive: {
          name: "progressive authoritarian left",
          blurb:
            "left economics, comfort with authority, and openness to social change.",
        },
        authRight: {
          name: "authoritarian right",
          blurb:
            "you favor markets or hierarchy alongside firm order and national cohesion.",
        },
        authRightConservative: {
          name: "conservative authoritarian right",
          blurb:
            "order, tradition, and economic right instincts sit near the top of your map.",
        },
        libLeft: {
          name: "libertarian left",
          blurb:
            "you want a fairer economy without handing everyday life to a heavy state.",
        },
        libLeftProgressive: {
          name: "progressive libertarian left",
          blurb:
            "equality-minded, freedom-first, and usually impatient with inherited norms.",
        },
        libRight: {
          name: "libertarian right",
          blurb:
            "personal freedom and market choice matter more to you than managed equality.",
        },
        libRightConservative: {
          name: "conservative libertarian right",
          blurb:
            "small government instincts with a preference for familiar cultural norms.",
        },
        centerLeft: {
          name: "center-left",
          blurb:
            "mildly left on economics, without a strong authoritarian or libertarian tilt.",
        },
        centerRight: {
          name: "center-right",
          blurb:
            "mildly right on economics, without a strong authoritarian or libertarian tilt.",
        },
        authCenter: {
          name: "authoritarian center",
          blurb:
            "you prioritize order and capable institutions over a sharp left/right economic fight.",
        },
        libCenter: {
          name: "libertarian center",
          blurb:
            "you prioritize personal freedom while staying near the economic middle.",
        },
        centristProgressive: {
          name: "progressive centrist",
          blurb:
            "centrist coordinates with a clear pull toward social and cultural change.",
        },
        centristConservative: {
          name: "conservative centrist",
          blurb:
            "centrist coordinates with a clear pull toward continuity and tradition.",
        },
        centrist: {
          name: "centrist",
          blurb:
            "your answers balance across the map — a mixed, moderate profile.",
        },
      },
      q: {
        eq1: "A fair society keeps the gap between rich and poor from getting huge.",
        eq2: "Healthcare, education, and basic housing should be guaranteed for everyone.",
        eq3: "Very large inheritances should be taxed so wealth does not stay locked in a few families.",
        eq4: "Workers should have a real say in how the companies they work for are run.",
        eq5: "Natural resources should mainly benefit the public, not only private owners.",
        eq6: "Taxes on the wealthy should be much higher than taxes on ordinary workers.",
        eq7: "People should keep most of what they earn, even if public services get thinner.",
        eq8: "Big differences in wealth are fine if people had a fair chance to succeed.",
        eq9: "Private property rights matter more than trying to equalize outcomes.",
        eq10: "Economic growth matters more than reducing inequality.",
        co1: "Free markets usually allocate resources better than government planners.",
        co2: "The freer the market, the freer the people.",
        co3: "Businesses should mostly set their own prices without heavy state control.",
        co4: "Private companies usually adapt to new needs faster than public agencies.",
        co5: "Some essential services work better when run for profit.",
        co6: "Key industries should be publicly owned or tightly controlled by the state.",
        co7: "Trade unions are an important check on employer power.",
        co8: "Rent controls are justified when markets price people out of housing.",
        co9: "Government should intervene in the economy to protect consumers and workers.",
        co10: "Long-term national projects are often better run by the public sector.",
        po1: "A government that can act quickly is better than one constantly blocked.",
        po2: "In a serious crisis, leaders should be trusted with extra powers.",
        po3: "People should generally obey the law even when they dislike it.",
        po4: "Social order sometimes matters more than protest or disobedience.",
        po5: "Strict punishments are needed to deter crime and keep society stable.",
        po6: "It is better for government to decide slowly than to concentrate too much power.",
        po7: "Breaking an unjust law can be the responsible thing to do.",
        po8: "Ordinary people should be able to challenge institutions that fail them.",
        po9: "No leader or office should be treated as above criticism.",
        po10: "Popular opinion should restrain officials, not the other way around.",
        au1: "Adults should be free to live how they want if they are not harming others.",
        au2: "The state should stay out of most personal lifestyle choices.",
        au3: "People must be free to criticize the government without fear of punishment.",
        au4: "Privacy matters more than giving police easy access to everyone's data.",
        au5: "A messy free society is better than an orderly one built on constant surveillance.",
        au6: "People sometimes need to give up personal freedoms so society can function.",
        au7: "Authorities should be able to restrict speech that threatens social cohesion.",
        au8: "Police need broad powers, even if that reduces privacy.",
        au9: "The government should guide citizens toward healthier or more moral choices.",
        au10: "Public safety justifies tighter controls on what people can say online.",
        id1: "Nobody should be less welcome in public life because of their background.",
        id2: "Different cultures can share one country without becoming the same.",
        id3: "Minorities need active protection from majorities that can outvote them.",
        id4: "National belonging should be open to anyone who commits to the community's rules.",
        id5: "No ethnic or cultural group is inherently superior to another.",
        id6: "A shared national culture should come before preserving every minority custom.",
        id7: "A country should be cautious about immigration that may change its character.",
        id8: "It is natural to feel pride mainly in one's own nation or people.",
        id9: "Immigrants should be expected to assimilate into the majority culture.",
        id10: "International bodies should not override a nation's right to decide its identity.",
        pr1: "Scientific evidence should beat tradition when the two conflict.",
        pr2: "Old customs should have to prove their value rather than get automatic respect.",
        pr3: "Society should try new solutions instead of waiting for perfect certainty.",
        pr4: "Education should prepare people for a changing future, not mainly preserve the past.",
        pr5: "Cultural change is usually a sign of a living society, not of decline.",
        pr6: "New ideas should be treated cautiously until their consequences are clear.",
        pr7: "A custom can be valuable simply because it has lasted for generations.",
        pr8: "Traditional family structures are usually better for society than newer alternatives.",
        pr9: "We should be careful about discarding norms that held society together.",
        pr10: "Maintaining continuity with the past matters more than chasing social novelty.",
      },
    },
    footer: { contact: "contact", text: "you can contact me via", email: "email" },
    about: {
      title: "about me.",
      who: "who am i?",
      intro:
        "so hi everyone, this is my personal website. here you can find some information about me, my projects, and other stuff. feel free to reach out to me if you want to collaborate or just say hi.",
      first: "first i'd like to introduce myself.",
      names:
        "you can call me eire, eireball, eireq, irelandball, or whatever you want.",
      origin:
        "i would like to clarify that i am not actually irish, i am from slovakia.",
      pronouns:
        "my pronouns are mostly he/him, but i do not really care about pronouns, so you can use whatever you want.",
      interests: "my interests",
      interestsText:
        "in my free time i like to code and make websites, play video games, watch movies, and generally waste time on the internet.",
      flagsText:
        "i am also a hobby-vexillophile, which means that i have a strong interest in flags. i am especially interested in their designs, history, symbolism, and sometimes questionable decisions.",
      movies: "movies & tv",
      moviesText:
        "from movies i like american action comedies the most. examples include the naked gun and police squad!, rush hour, hot shots!, and jim carrey movies like ace ventura, the mask, liar liar, and many more.",
      tvText:
        "from tv shows i like the it crowd, family guy, two and a half men, peacemaker, big bang theory, and many more.",
      music: "music",
      musicText:
        "i also like to make some music, but i am not very good at it. i mostly make some random stuff in fl studio :)",
      musicLikes:
        "from music i like basically everything, mostly dubioza kolektiv, young fathers, gorillaz, fontaines d.c., and many more.",
      jazz: "i have mixed opinions about jazz.",
      coding: "coding & projects",
      codingText:
        "i mostly code useless websites and website games in my free time, but i also like to make some discord bots.",
      projectsText:
        "i have made quite a lot of random projects over time, mostly websites, small games, discord bots, and other things that i thought would be funny or interesting to make.",
      projectsInclude: "my projects include",
      randomCountry: "random country",
      modes: "modes",
      racing: "racing",
      flagQuiz: "flag quiz",
      moreProjects: "you can find more of my projects on my",
      currently: "currently",
      currentlyText:
        "currently, i am working on this website and also on the arcade game.",
      planning:
        "i am also planning to make the projects mentioned above, although knowing me, there is a reasonable chance that i will start something completely different halfway through.",
      favoriteFlags: "favorite flags",
      favoriteFlagsText:
        "my favorite flags are ireland, slovakia, armenia, and saint pierre and miquelon, although this list changes whenever i discover another unnecessarily good flag.",
      randomFacts: "random facts",
      facts: [
        "i stole a license plate from a car once",
        "i plan to become a hyperpolyglot!",
        "did you know platypuses do not have teats, so they sweat milk out of their skin for their babies to drink?",
        "i really like the color yellow",
        "what to put here?",
        "i really shouldn't make this section",
        "why are you still reading this? go away, i have nothing else to say.",
        "sorry for being rude",
      ],
      where: "where you can find me",
      contactText: "you can contact me via",
      contactMore: "you can also find me on",
      username: "my username on most platforms is",
      final:
        "if you want to talk about programming, flags, games, music, movies, or literally anything else, feel free to contact me.",
    },
  },
  deu: {
    nav: {
      about: "über mich",
      randomCountry: "zufälliges Land",
      modes: "modi.",
      games: "spiele",
      tools: "werkzeuge",
      art: "kunst",
      misc: "sonstiges",
      contact: "kontakt",
      github: "github",
      discord: "discord-server",
      youtube: "youtube",
      language: "sprache",
      available: "verfügbar",
      comingSoon: "demnächst",
      moreLanguages: "weitere Sprachen",
      menu: "menü",
      close: "schließen",
    },
    home: { about: "über mich ->", contact: "kontakt ->" },
    games: {
      title: "spiele.",
      intro:
        "eine Sammlung von Spielen, die ich erstellt habe. meistens kleine Projekte, Experimente und Dinge, die lustig schienen.",
      racing: "racing",
      racingText: "spiel zum Spurwechseln, mit Bestenlisten!!",
      flagQuiz: "flaggenquiz",
      flagQuizText:
        "erkenne Flaggen aus aller Welt. wie viele schaffst du richtig?",
      dailyFlag: "tagesflagge",
      dailyFlagText: "eine gemeinsame Flagge jeden Tag. halte die Serie.",
      kht: "KHT-Turnier",
      khtText: "ein riesiges Bracket-Turnier. live aktualisiert.",
    },
    tools: {
      title: "werkzeuge.",
      intro:
        "nützliche (und weniger nützliche) Utilities. Flaggen durchsuchen, Orte würfeln und in den Daten stöbern.",
      flagDatabase: "flaggendatenbank",
      flagDatabaseText:
        "durchsuche und browsen 1.700+ Flaggen mit Details, Kategorien und Sammlungen.",
      randomCountry: "zufälliges Land",
      randomCountryText:
        "würfle einen Eintrag aus dem gemeinsamen Flaggenkorpus.",
      dailyFlag: "tagesflagge",
      dailyFlagText: "rate die Flagge des Tages. Serien bleiben auf dem Gerät.",
      flagQuiz: "flaggenquiz",
      flagQuizText: "Quiz-Modi aus derselben Flaggendatenbank.",
      compare: "flaggen vergleichen",
      compareText:
        "zwei flaggen, farben, proportionen und ein ähnlichkeitswert.",
    },
    misc: {
      title: "sonstiges.",
      intro:
        "eine Sammlung verschiedener Projekte, Experimente und anderer Dinge, die nicht zu Spielen, Werkzeugen oder Kunst passen.",
      politics: "politische Präferenzen",
      politicsText:
        "meine ideologischen Diagramme und Ergebnisse politischer Tests.",
      jpol: "jPol",
      jpolText:
        "volles oder express-wertequiz mit teilbarem kompass-ergebnis.",
      modes: "modi",
      modesText:
        "ein weiteres Projekt aus meiner Sammlung von Web-Experimenten.",
      discordBots: "Discord-Bots",
      discordBotsText:
        "kleine Bots und andere Experimente aus meinen GitHub-Projekten.",
      elections: "Doulantese-Wahlen",
      electionsText: "Ergebnisse der Discord-Gewerkschaftsversammlung.",
    },
    art: {
      title: "kunst.",
      intro:
        "eine Sammlung meiner Kunst. hauptsächlich digitale Experimente, Flaggendesigns und Dinge, die lustig zu zeichnen schienen.",
      digital: "digitale Kunst",
      digitalText: "Zeichnungen, Experimente und andere digitale Kreationen.",
      flags: "Flaggendesigns",
      flagsText: "Fiktive Flaggen und von Vexillologie inspirierte Designs.",
      more: "mehr kommt bald",
      moreText:
        "ich füge hier weitere Kunst hinzu, sobald ich etwas Vorzeigbares mache.",
    },
    contact: {
      title: "kontakt.",
      intro:
        "du möchtest über Programmierung, Flaggen, Spiele, Musik, Filme oder etwas anderes sprechen? schreib mir.",
      find: "hier findest du mich",
      server: "Discord-Server",
      username: "mein Benutzername auf den meisten Plattformen ist",
      send: "Nachricht senden",
      name: "Name",
      email: "E-Mail",
      message: "Nachricht",
      openDraft: "E-Mail-Entwurf öffnen",
      status: "deine E-Mail-App sollte sich mit der fertigen Nachricht öffnen.",
    },
    randomCountry: {
      eyebrow: "zufälliges Land",
      title: "wähle einen Ort.",
      intro:
        "Länder, Gebiete und historische Staaten. die Weltkarte ist größer, als du denkst.",
      yourPlace: "dein zufälliger Ort",
      randomize: "zufällig auswählen",
      pool: "die vollständige Auswahl",
      entries: "Einträge",
      find: "Eintrag finden",
      search: "suchen...",
      empty: "keine Orte gefunden.",
    },
    politics: {
      title: "politischer Kompass & Werte",
      subtitle:
        "eine Sammlung meiner ideologischen Diagramme und Ergebnisse politischer Tests.",
      results: "Ergebnisse politischer Tests",
      compass: "traditionelle 2D-Achsen",
      sapply: "3D-Kompassraster",
      dozen: "12 Grundwerte",
      orbs: "sphärisches Modell",
      eight: "4 unabhängige Achsen",
      nine: "9 detaillierte Achsen",
      scales: "8 Eigenschaften & Tags",
      left: "linkes Spektrum",
      right: "rechtes Spektrum",
      alt: "alternatives Wertespektrum",
      unavailable: "Bild noch nicht hochgeladen",
    },
    footer: { contact: "kontakt", text: "du kannst mich per", email: "E-Mail" },
    about: {
      title: "über mich.",
      who: "wer bin ich?",
      intro:
        "hallo zusammen, dies ist meine persönliche Website. hier findest du Informationen über mich, meine Projekte und andere Dinge. melde dich gerne, wenn du zusammenarbeiten oder einfach Hallo sagen möchtest.",
      first: "zuerst möchte ich mich vorstellen.",
      names:
        "du kannst mich eire, eireball, eireq, irelandball oder nennen, wie du möchtest.",
      origin:
        "ich möchte klarstellen, dass ich nicht irisch bin, sondern aus der Slowakei komme.",
      pronouns:
        "meine Pronomen sind meistens er/ihm, aber Pronomen sind mir nicht besonders wichtig.",
      interests: "meine Interessen",
      interestsText:
        "in meiner Freizeit programmiere ich gerne und erstelle Websites, spiele Videospiele, schaue Filme und verschwende allgemein Zeit im Internet.",
      flagsText:
        "ich interessiere mich außerdem als Hobby-Vexillologe sehr für Flaggen, besonders für ihr Design, ihre Geschichte, Symbolik und manchmal fragwürdige Entscheidungen.",
      movies: "filme & tv",
      moviesText:
        "bei Filmen mag ich amerikanische Actionkomödien am meisten. dazu gehören Die nackte Kanone und Police Squad!, Rush Hour, Hot Shots! sowie Jim-Carrey-Filme wie Ace Ventura, Die Maske und Liar Liar.",
      tvText:
        "bei Serien mag ich The IT Crowd, Family Guy, Two and a Half Men, Peacemaker, The Big Bang Theory und viele weitere.",
      music: "musik",
      musicText:
        "ich mache auch gerne Musik, bin darin aber nicht besonders gut. meistens erstelle ich zufällige Sachen in FL Studio :)",
      musicLikes:
        "bei Musik mag ich eigentlich alles, besonders Dubioza Kolektiv, Young Fathers, Gorillaz, Fontaines D.C. und viele weitere.",
      jazz: "zu Jazz habe ich gemischte Gefühle.",
      coding: "programmierung & projekte",
      codingText:
        "in meiner Freizeit programmiere ich hauptsächlich nutzlose Websites und Webspiele, aber ich erstelle auch gerne Discord-Bots.",
      projectsText:
        "im Laufe der Zeit habe ich viele zufällige Projekte erstellt, meistens Websites, kleine Spiele, Discord-Bots und andere Dinge, die lustig oder interessant schienen.",
      projectsInclude: "zu meinen Projekten gehören",
      randomCountry: "zufälliges Land",
      modes: "modi",
      racing: "racing",
      flagQuiz: "flaggenquiz",
      moreProjects: "mehr Projekte findest du auf meinem",
      currently: "aktuell",
      currentlyText:
        "aktuell arbeite ich an dieser Website und am Arcade-Spiel.",
      planning:
        "ich plane außerdem, die genannten Projekte zu erstellen. obwohl es bei mir gut möglich ist, dass ich zwischendurch etwas völlig anderes anfange.",
      favoriteFlags: "lieblingsflaggen",
      favoriteFlagsText:
        "meine Lieblingsflaggen sind Irland, die Slowakei, Armenien und Saint-Pierre und Miquelon. diese Liste ändert sich, sobald ich eine weitere unnötig gute Flagge entdecke.",
      randomFacts: "zufällige Fakten",
      facts: [
        "ich habe einmal ein Nummernschild von einem Auto gestohlen",
        "ich möchte ein Hyperpolyglott werden!",
        "wusstest du, dass Schnabeltiere keine Zitzen haben, sondern Milch durch ihre Haut ausschwitzen?",
        "ich mag die Farbe Gelb sehr",
        "was soll hier stehen?",
        "ich sollte diesen Abschnitt wirklich nicht machen",
        "warum liest du das noch? geh weg, ich habe nichts mehr zu sagen.",
        "entschuldigung für meine Unhöflichkeit",
      ],
      where: "wo du mich findest",
      contactText: "du kannst mich per",
      contactMore: "du findest mich auch auf",
      username: "mein Benutzername auf den meisten Plattformen ist",
      final:
        "wenn du über Programmierung, Flaggen, Spiele, Musik, Filme oder irgendetwas anderes sprechen möchtest, kannst du dich gerne melden.",
    },
  },
};

// Hand-written German packs for newer surfaces (flag db/detail, jPol, etc.).
Object.assign(messages.deu, siteDeu, { jpol: jpolDeu });

/**
 * JOKE LOCALES (ttt, jjj, ipa, emj, tkp, sew, drunk/pirate/uwu/…)
 * -------------------------------------------------------------
 * These are NOT real translations sitting "in front of" German/Russian.
 * Real locales are: eng, deu, rus (+ playful kgn).
 *
 * Everything in this block clones English and runs silly string transformers
 * so the language menu can offer meme modes. Skip this whole section if you
 * are looking for actual translated copy.
 */
const variantTransformers = {
  dnk: (text) => text
    .replace(/\byou\b/gi, "ya")
    .replace(/\byour\b/gi, "yer")
    .replace(/\band\b/gi, "n")
    .replace(/\bthe\b/gi, "tha")
    .replace(/\babout\b/gi, "'bout")
    .replace(/ing\b/gi, "in'")
    .replace(/[!?]+/g, "...") + " *hic*",
  prt: (text) => text
    .replace(/\byou\b/gi, "ye")
    .replace(/\byour\b/gi, "yer")
    .replace(/\bfriend\b/gi, "matey")
    .replace(/\bfriends\b/gi, "mateys")
    .replace(/\bmy\b/gi, "me")
    .replace(/\bthe\b/gi, "thee")
    .replace(/\bis\b/gi, "be") + " Arr!",
  uwu: (text) => text
    .replace(/r|l/gi, "w")
    .replace(/n([aeiou])/gi, "ny$1")
    .replace(/\bthe\b/gi, "da")
    .replace(/\bthis\b/gi, "dis") + " uwu :3",
  srs: (text) => text
    .replace(/\bfunny\b/gi, "amusing")
    .replace(/\bstuff\b/gi, "matters")
    .replace(/\bthing(s)?\b/gi, "matter$1")
    .replace(/[!?]+/g, "."),
  fck: (text) => text
    .replace(/\bgood\b/gi, "damn good")
    .replace(/\bbad\b/gi, "fucking awful")
    .replace(/\bvery\b/gi, "fucking")
    .replace(/\bwhat\b/gi, "what the hell")
    .replace(/[!?]+/g, "!"),
  ttt: (text) => `${text} no cap fr fr`,
  jjj: (text) => text.replace(/[bcdfghjklmnpqrstvwxyz]/g, "j").replace(/[BCDFGHJKLMNPQRSTVWXYZ]/g, "J"),
  ipa: (text) => text.replace(/th/gi, "ð").replace(/sh/gi, "ʃ").replace(/ch/gi, "tʃ").replace(/r/gi, "ɹ"),
  emj: (text) => text.replace(/love/gi, "❤️").replace(/music/gi, "🎵").replace(/game/gi, "🎮").replace(/flag/gi, "🏳️").replace(/contact/gi, "✉️").replace(/country/gi, "🌍") + " ✨",
  tkp: (text) => text.replace(/information/gi, "facts").replace(/approximately/gi, "about").replace(/miscellaneous/gi, "random").replace(/currently/gi, "now").replace(/whatever you want/gi, "anything"),
  sew: (text) => text.replace(/[A-Za-z]{5,}/g, (word) => `${word.slice(0, 3)}.`),
  ttt: (text) => brainrotize(text),
  jjj: (text) =>
    text
      .replace(/[bcdfghjklmnpqrstvwxyz]/g, "j")
      .replace(/[BCDFGHJKLMNPQRSTVWXYZ]/g, "J"),
  ipa: (text) =>
    text
      .replace(/th/gi, "ð")
      .replace(/sh/gi, "ʃ")
      .replace(/ch/gi, "tʃ")
      .replace(/r/gi, "ɹ"),
  emj: (text) => {
    const emojiWords = {
      a: "🅰️",
      about: "💬",
      add: "➕",
      all: "🌐",
      and: "➕",
      answer: "✍️",
      art: "🎨",
      available: "✅",
      because: "💡",
      best: "🏆",
      but: "↩️",
      call: "📞",
      cancel: "❌",
      change: "🔀",
      city: "🏙️",
      code: "💻",
      collection: "🗂️",
      contact: "✉️",
      country: "🌍",
      countries: "🌍",
      discover: "🔎",
      distance: "📏",
      email: "📧",
      enter: "↩️",
      every: "♾️",
      experiment: "🧪",
      find: "🔎",
      flag: "🏳️",
      flags: "🏳️",
      game: "🎮",
      games: "🎮",
      github: "🐙",
      good: "👍",
      historical: "🏛️",
      how: "❓",
      i: "🙋",
      identify: "🔍",
      image: "🖼️",
      information: "ℹ️",
      internet: "🌐",
      language: "🗣️",
      leaderboard: "🏆",
      learn: "📚",
      loading: "⏳",
      made: "🛠️",
      message: "💌",
      music: "🎵",
      name: "🏷️",
      new: "🆕",
      no: "🚫",
      number: "🔢",
      of: "🔗",
      on: "📍",
      or: "🔀",
      other: "📦",
      place: "📍",
      political: "🏛️",
      probably: "🤷",
      project: "📁",
      quiz: "❓",
      random: "🎲",
      racing: "🏎️",
      read: "📖",
      score: "💯",
      search: "🔎",
      send: "📤",
      server: "🖥️",
      small: "🔹",
      something: "✨",
      start: "▶️",
      territorial: "🗺️",
      text: "📝",
      the: "🔤",
      this: "👉",
      time: "⏱️",
      to: "➡️",
      unavailable: "🚫",
      very: "📈",
      want: "🙋",
      well: "👌",
      what: "❓",
      world: "🌎",
      you: "👉",
      your: "🫵",
      youtube: "▶️",
    };
    return text.replace(
      /[A-Za-z]+/g,
      (word) => emojiWords[word.toLowerCase()] || "🔤",
    );
  },
  tkp: (text) => tokiPonaize(text),
  sew: (text) =>
    text.replace(/[A-Za-z]{5,}/g, (word) => `${word.slice(0, 3)}.`),
};

const brainrotWords = {
  a: "the",
  about: "boutta",
  all: "everyone",
  and: "plus",
  answer: "respond",
  art: "peak content",
  available: "locked in",
  but: "however",
  call: "ring",
  cancel: "yeet",
  change: "switch up",
  country: "nation arc",
  countries: "nation arcs",
  discover: "unlock",
  distance: "mileage",
  email: "electronic mail",
  enter: "press enter bestie",
  every: "literally every",
  experiment: "lab arc",
  find: "locate",
  flag: "banner",
  flags: "banners",
  game: "gameplay",
  games: "gameplays",
  good: "goated",
  historical: "ancient lore",
  how: "how tho",
  i: "me fr",
  identify: "lock in and identify",
  image: "picture drop",
  information: "lore",
  internet: "the web fr",
  language: "yap dialect",
  leaderboard: "aura leaderboard",
  learn: "obtain lore",
  loading: "edging",
  made: "cooked",
  message: "dm",
  music: "vibes",
  name: "username",
  new: "fresh spawn",
  no: "nah",
  number: "count thingy",
  of: "from",
  on: "upon",
  or: "alternatively",
  other: "random ahh",
  place: "spot",
  political: "government lore",
  probably: "lowkey",
  project: "side quest",
  quiz: "knowledge check",
  random: "rng",
  racing: "vroom vroom arc",
  read: "consume text",
  score: "point total",
  search: "investigate",
  send: "yeet forth",
  server: "digital hangout",
  small: "mini",
  something: "some random ahh thing",
  start: "begin the grind",
  territorial: "map lore",
  text: "yap",
  the: "that",
  this: "dis",
  time: "chronological moment",
  to: "towards",
  unavailable: "not in the meta",
  very: "mad",
  want: "desire",
  well: "valid",
  what: "what the sigma",
  world: "the whole map",
  you: "chat",
  your: "ur",
};

const brainrotFallbacks = [
  "skibidi",
  "sigma",
  "gyatt",
  "rizz",
  "aura",
  "bussin",
  "fanum tax",
];

function brainrotize(text) {
  return text.replace(/[A-Za-z]+/g, (word) => {
    const mapped = brainrotWords[word.toLowerCase()];
    if (mapped) return mapped;

    const hash = [...word.toLowerCase()].reduce(
      (total, character) => (total * 31 + character.charCodeAt(0)) >>> 0,
      0,
    );
    return brainrotFallbacks[hash % brainrotFallbacks.length];
  });
}

const tokiPonaWords = {
  a: "wan",
  about: "lon tenpo ni",
  add: "sin",
  all: "ali",
  and: "en",
  another: "ante",
  answer: "toki",
  art: "sitelen",
  available: "ken",
  because: "tan ni",
  best: "pona mute",
  but: "taso",
  call: "nimi",
  can: "ken",
  collection: "kulupu",
  color: "kule",
  contact: "toki",
  country: "ma",
  countries: "ma mute",
  currently: "tenpo ni",
  discover: "sona sin",
  distance: "weka",
  do: "pali",
  email: "lipu toki",
  enter: "tawa insa",
  every: "ali",
  experiment: "pali sona",
  find: "lukin",
  flag: "len ma",
  flags: "len ma mute",
  free: "mani ala",
  game: "musi",
  games: "musi mute",
  good: "pona",
  historical: "tenpo pini",
  how: "seme",
  i: "mi",
  identify: "sona",
  image: "sitelen",
  information: "sona",
  internet: "ilo toki",
  language: "toki",
  leaderboard: "lipu lawa",
  learn: "kama sona",
  loading: "awen",
  made: "pali",
  message: "lipu toki",
  miscellaneous: "ante mute",
  more: "mute",
  music: "kalama",
  name: "nimi",
  new: "sin",
  no: "ala",
  number: "nanpa",
  of: "pi",
  on: "lon",
  or: "anu",
  other: "ante",
  place: "ma",
  political: "ma lawa",
  probably: "ken la",
  project: "pali",
  quiz: "sona",
  random: "jo ala sona",
  racing: "tawa kepeken wawa",
  read: "lukin lipu",
  score: "nanpa pona",
  search: "lukin",
  send: "toki tawa",
  server: "ilo kulupu",
  small: "lili",
  something: "ijo",
  start: "open",
  territorial: "ma",
  text: "toki",
  the: "ni",
  this: "ni",
  time: "tenpo",
  to: "tawa",
  unavailable: "ken ala",
  very: "mute",
  want: "wile",
  well: "pona",
  what: "seme",
  where: "tawa ma seme",
  world: "ma ali",
  you: "sina",
  your: "sina",
};

function tokiPonaize(text) {
  const tokiPona = text.replace(
    /[A-Za-z]+/g,
    (word) => tokiPonaWords[word.toLowerCase()] || "ijo",
  );

  return tokiPona.replace(
    /[A-Za-z]+/g,
    (word) => tokiPonaBackToEnglish[word.toLowerCase()] || "thing",
  );
}

const tokiPonaBackToEnglish = {
  ali: "all",
  ala: "not",
  anu: "or",
  ante: "other",
  awen: "wait",
  en: "and",
  ijo: "thing",
  ilo: "tool",
  jo: "have",
  kalama: "sound",
  kama: "become",
  ken: "can",
  kule: "color",
  kulupu: "group",
  lawa: "main",
  len: "cover",
  lili: "small",
  lipu: "page",
  lon: "at",
  lukin: "look",
  ma: "land",
  mani: "money",
  mi: "me",
  mu: "sound",
  musi: "play",
  mute: "much",
  nanpa: "number",
  ni: "this",
  nimi: "name",
  open: "start",
  pali: "make",
  pi: "of",
  pona: "good",
  seme: "what",
  sina: "you",
  sitelen: "picture",
  sona: "know",
  sin: "new",
  tan: "because",
  tawa: "go",
  tenpo: "time",
  toki: "talk",
  wan: "one",
  wawa: "power",
  weka: "far",
  wile: "want",
};

const emojiWords = {
  a: "🅰️",
  about: "💬",
  all: "🌐",
  and: "➕",
  art: "🎨",
  available: "✅",
  but: "↩️",
  collection: "🗂️",
  contact: "✉️",
  country: "🌍",
  countries: "🌍",
  discover: "🔎",
  email: "📧",
  enter: "↩️",
  experiment: "🧪",
  find: "🔎",
  flag: "🏳️",
  flags: "🏳️",
  game: "🎮",
  games: "🎮",
  github: "🐙",
  historical: "🏛️",
  how: "❓",
  i: "🙋",
  image: "🖼️",
  language: "🗣️",
  leaderboard: "🏆",
  loading: "⏳",
  music: "🎵",
  name: "🏷️",
  no: "🚫",
  number: "🔢",
  of: "🔗",
  or: "🔀",
  other: "📦",
  political: "🏛️",
  probably: "🤷",
  project: "📁",
  quiz: "❓",
  random: "🎲",
  racing: "🏎️",
  score: "💯",
  search: "🔎",
  server: "🖥️",
  start: "▶️",
  territorial: "🗺️",
  the: "🔤",
  to: "➡️",
  unavailable: "🚫",
  very: "📈",
  well: "👌",
  world: "🌎",
  you: "👉",
  your: "🫵",
  youtube: "▶️",
};

function toEmoji(text) {
  return text.replace(
    /[A-Za-z]+/g,
    (word) => emojiWords[word.toLowerCase()] || "🔤",
  );
}

function cloneAndTransform(value, transformer) {
  if (typeof value === "string") return transformer(value);
  if (Array.isArray(value))
    return value.map((item) => cloneAndTransform(item, transformer));
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      cloneAndTransform(item, transformer),
    ]),
  );
}

for (const [code, transformer] of Object.entries(variantTransformers)) {
  messages[code] = cloneAndTransform(messages.eng, transformer);
}

function mergeMessages(base, overrides) {
  return Object.fromEntries(
    Object.entries(base).map(([section, values]) => [
      section,
      { ...values, ...(overrides[section] || {}) },
    ]),
  );
}

messages.rus = mergeMessages(messages.eng, {
  ...siteRus,
  jpol: jpolRus,
  nav: {
    about: "обо мне",
    randomCountry: "случайная страна",
    modes: "режимы.",
    games: "игры",
    tools: "инструменты",
    art: "искусство",
    misc: "разное",
    contact: "контакты",
    discord: "сервер Discord",
    language: "язык",
    available: "реальные языки",
    comingSoon: "скоро",
    moreLanguages: "другие языки",
  },
  home: { about: "обо мне ->", contact: "контакты ->" },
  games: {
    title: "игры.",
    intro:
      "коллекция игр, которые я создал. в основном небольшие проекты, эксперименты и забавные идеи.",
    racing: "гонки",
    racingText: "игра со сменой полос. с таблицей лидеров!!",
    flagQuiz: "викторина о флагах",
    flagQuizText:
      "узнай флаги со всего мира. сколько ответов будет правильными?",
    dailyFlag: "флаг дня",
    dailyFlagText: "один общий флаг каждый день. стрик на этом устройстве.",
    kht: "турнир KHT",
    khtText: "огромная турнирная сетка. обновляется вживую.",
  },
  tools: {
    title: "инструменты.",
    intro:
      "полезные (и не очень) утилиты. смотри флаги, выбирай случайные места и копайся в данных.",
    flagDatabase: "база флагов",
    flagDatabaseText:
      "ищи и просматривай 1700+ флагов с деталями, категориями и коллекциями.",
    randomCountry: "случайная страна",
    randomCountryText: "получи случайную страну и узнай что-нибудь новое.",
    dailyFlag: "флаг дня",
    dailyFlagText: "угадай сегодняшний флаг. стрик остаётся на устройстве.",
    flagQuiz: "викторина о флагах",
    flagQuizText: "режимы викторины на той же базе флагов.",
    compare: "сравнить флаги",
    compareText: "два флага, цвета, пропорции и оценка схожести.",
  },
  misc: {
    title: "разное.",
    intro:
      "коллекция разных проектов, экспериментов и других вещей, которые не относятся к играм, инструментам или искусству.",
    politics: "политические предпочтения",
    politicsText:
      "мои идеологические диаграммы и результаты политических тестов.",
    jpol: "jPol",
    jpolText:
      "полная или короткая викторина ценностей с результатом на компасе.",
    modes: "режимы",
    modesText: "ещё один проект из моей коллекции веб-экспериментов.",
    discordBots: "боты Discord",
    discordBotsText:
      "небольшие боты и эксперименты из моих проектов на GitHub.",
    elections: "выборы Doulantese",
    electionsText: "результаты ассамблеи Discord-союза.",
  },
  art: {
    title: "искусство.",
    intro:
      "коллекция созданных мной работ. в основном цифровые эксперименты, дизайны флагов и забавные рисунки.",
    digital: "цифровое искусство",
    digitalText: "рисунки, эксперименты и другие цифровые работы.",
    flags: "дизайны флагов",
    flagsText: "вымышленные флаги и дизайны, вдохновлённые вексиллологией.",
    more: "скоро будет больше",
    moreText:
      "я добавлю сюда новые работы, когда создам что-нибудь достойное показа.",
  },
  contact: {
    title: "контакты.",
    intro:
      "хочешь поговорить о программировании, флагах, играх, музыке, фильмах или чём-нибудь ещё? напиши мне.",
    find: "где меня найти",
    server: "сервер Discord",
    username: "моё имя пользователя на большинстве платформ",
    send: "отправить сообщение",
    name: "имя",
    email: "электронная почта",
    message: "сообщение",
    openDraft: "открыть черновик письма",
    status: "почтовое приложение должно открыть готовое сообщение.",
  },
  randomCountry: {
    eyebrow: "случайная страна",
    title: "выбери место.",
    intro:
      "страны, территории и исторические государства. карта больше, чем кажется.",
    yourPlace: "твоё случайное место",
    randomize: "выбрать случайно",
    pool: "полный список",
    entries: "записей",
    find: "найти запись",
    search: "поиск...",
    empty: "места не найдены.",
  },
  politics: {
    title: "политический компас и ценности",
    subtitle:
      "коллекция моих идеологических диаграмм и результатов политических тестов.",
    results: "результаты политических тестов",
    compass: "традиционные 2D-оси",
    sapply: "3D-сетка компаса",
    dozen: "12 основных ценностей",
    orbs: "сферическая модель",
    eight: "4 независимые оси",
    nine: "9 подробных осей",
    scales: "8 характеристик и тегов",
    left: "левый политический спектр",
    right: "правый политический спектр",
    alt: "альтернативный спектр ценностей",
    unavailable: "изображение ещё не загружено",
  },
  footer: {
    contact: "контакты",
    text: "со мной можно связаться по адресу",
    email: "электронной почте",
  },
  about: {
    title: "обо мне.",
    who: "кто я?",
    intro:
      "привет всем, это мой личный сайт. здесь можно найти информацию обо мне, моих проектах и других вещах. пишите мне, если хотите посотрудничать или просто поздороваться.",
    first: "сначала я хочу представиться.",
    names:
      "можете называть меня eire, eireball, eireq, irelandball или как угодно.",
    origin: "хочу уточнить, что я не ирландец, а родом из Словакии.",
    pronouns:
      "обычно я использую местоимения он/его, но мне это не особенно важно.",
    interests: "мои интересы",
    interestsText:
      "в свободное время я программирую, создаю сайты, играю в видеоигры, смотрю фильмы и вообще трачу время в интернете.",
    flagsText:
      "я также увлекаюсь вексиллологией, то есть флагами, их дизайном, историей, символикой и иногда сомнительными решениями.",
    movies: "кино и телевидение",
    moviesText:
      "больше всего я люблю американские комедийные боевики: Голый пистолет, Полицейский отряд!, Час пик, Без чувств и фильмы Джима Керри.",
    tvText:
      "из сериалов мне нравятся Компьютерщики, Гриффины, Два с половиной человека, Миротворец, Теория большого взрыва и многие другие.",
    music: "музыка",
    musicText:
      "я также иногда сочиняю музыку, хотя делаю это не очень хорошо. обычно создаю что-нибудь случайное в FL Studio :)",
    musicLikes:
      "в музыке я люблю почти всё, особенно Dubioza Kolektiv, Young Fathers, Gorillaz и Fontaines D.C.",
    jazz: "к джазу у меня смешанное отношение.",
    coding: "кодинг и проекты",
    codingText:
      "в основном я создаю бесполезные сайты и игры для сайтов, но также люблю делать ботов Discord.",
    projectsText:
      "со временем я создал много случайных проектов: сайты, небольшие игры, ботов Discord и другие забавные или интересные вещи.",
    projectsInclude: "среди моих проектов",
    randomCountry: "случайная страна",
    modes: "режимы",
    racing: "гонки",
    flagQuiz: "викторина о флагах",
    moreProjects: "больше проектов можно найти на моём",
    currently: "сейчас",
    currentlyText: "сейчас я работаю над этим сайтом и аркадной игрой.",
    planning:
      "я также планирую сделать упомянутые проекты, хотя, зная себя, могу начать что-нибудь совершенно другое.",
    favoriteFlags: "любимые флаги",
    favoriteFlagsText:
      "мои любимые флаги: Ирландия, Словакия, Армения и Сен-Пьер и Микелон.",
    randomFacts: "случайные факты",
    facts: [
      "однажды я украл номерной знак с машины",
      "я планирую стать гиперполиглотом!",
      "у утконосов нет сосков: они выделяют молоко через кожу",
      "я очень люблю жёлтый цвет",
      "что сюда написать?",
      "мне не стоило создавать этот раздел",
      "почему ты всё ещё это читаешь? уходи.",
      "извините за грубость",
    ],
    where: "где меня найти",
    contactText: "со мной можно связаться по",
    contactMore: "также я есть в",
    username: "моё имя пользователя на большинстве платформ",
    final:
      "если хотите поговорить о программировании, флагах, играх, музыке, фильмах или чём угодно, пишите мне.",
  },
});

// Klingon terminology is approximate, but the complete site remains navigable in this mode.
messages.kgn = mergeMessages(messages.eng, {
  nav: {
    about: "jIH ghu'",
    randomCountry: "yu' Sep",
    modes: "mIw.",
    games: "Quj",
    tools: "jan",
    art: "nagh",
    misc: "latlh",
    contact: "Qum",
    discord: "Discord Qum",
    language: "Hol",
    available: "Holmey",
    comingSoon: "tugh",
    moreLanguages: "latlh Holmey",
  },
  home: { about: "jIH ghu' ->", contact: "Qum ->" },
  games: {
    title: "Quj.",
    intro: "jIchenmoHbogh Qujmey tetlh. machbogh mIw, ngugh mIwvam je.",
    racing: "qet",
    racingText: "chaw' ghom Quj. mIwvaD pat!!",
    flagQuiz: "joqwI' ghojmoH",
    flagQuizText: "qo' Hoch joqwI' yIqel. 'ar bIyaj?",
    kht: "KHT Quj",
    khtText: "Quj bracket. yIn Qap.",
  },
  tools: {
    title: "jan.",
    intro: "janmey. joqwI' yInej, Sep yIwIv.",
    flagDatabase: "joqwI' De'",
    flagDatabaseText: "joqwI'mey yInej.",
    randomCountry: "yu' Sep",
    randomCountryText: "yu' Sep yISam.",
  },
  misc: {
    title: "latlh.",
    intro: "Quj, jan, nagh je Dalutbe'chugh, latlh mIwmey tetlh.",
    politics: "qum vu'",
    politicsText: "jIH qum QInmey.",
    jpol: "jPol",
    jpolText: "60 yu' qum ghojmoH.",
    modes: "mIw",
    discordBots: "Discord bots",
    elections: "Doulantese wIv",
    electionsText: "Discord ghom wIv.",
  },
  art: {
    title: "nagh.",
    intro: "jIta'bogh nagh tetlh.",
    digital: "De' nagh",
    flags: "joqwI' chenmoH",
    more: "tugh latlh",
  },
  contact: {
    title: "Qum.",
    intro: "bIjatlh DaneH'a'? Qum.",
    find: "nuqDaq jIH",
    server: "Qum yej",
    send: "QIn ngeH",
    name: "pong",
    email: "QIn",
    message: "QIn",
    openDraft: "QIn ghItlh yIpoS",
  },
  randomCountry: {
    eyebrow: "yu' Sep",
    title: "Daq yIwIv.",
    intro: "Sepmey, yotmey, ngo' Sepmey je.",
    yourPlace: "lIj Daq",
    randomize: "yIwIv",
    pool: "tetlh naQ",
    entries: "mI'",
    find: "yISam",
    search: "nej...",
    empty: "Daq pagh.",
  },
  politics: {
    title: "qum compass je",
    subtitle: "jIH qum QInmey je.",
    results: "qum test QInmey",
    compass: "2D 'och",
    sapply: "3D compass",
    dozen: "12 ngoQ",
    orbs: "meq",
    eight: "4 'och",
    nine: "9 'och",
    scales: "8 ghItlh",
    left: "poS",
    right: "nIH",
    alt: "latlh ngoQ",
    unavailable: "nagh wej yIlan",
  },
  footer: { contact: "Qum", text: "QumlaH", email: "QIn" },
  about: {
    title: "jIH ghu'.",
    who: "jIH nuq?",
    intro: "nuqneH. jIHvaD ghot porgh juH 'oH webvam'e'. jIH, jIta' je yIlegh.",
    first: "jIH'e' vImaq.",
    interests: "jIH muSHa'ghach",
    interestsText: "jIcode, web vIchenmoH, Quj vIQuj, vIDabbogh movie vIlegh.",
    movies: "movie tv je",
    tvText:
      "The IT Crowd, Family Guy, Peacemaker, Big Bang Theory je vIparHa'.",
    music: "QoQ",
    coding: "code mIwmey",
    currently: "DaH",
    favoriteFlags: "jIH muSHa' joqwI'",
    randomFacts: "ngoQmey",
    where: "nuqDaq jIH",
    final: "program, joqwI', Quj, QoQ, movie pagh latlh vIjatlhnISchugh, Qum.",
  },
});

export function useI18n() {
  function setLanguage(code) {
    if (!messages[code]) return;
    language.value = code;
    window.localStorage.setItem("language", code);
  }

  function t(key) {
    const parts = key.split(".");
    const fromActive = parts.reduce(
      (value, part) => value?.[part],
      messages[language.value],
    );
    if (fromActive != null) return fromActive;
    return parts.reduce((value, part) => value?.[part], messages.eng) ?? key;
  }

  function languageLabel(item) {
    return language.value === "emj" ? toEmoji(item.label) : item.label;
  }

  function languageGroupLabel(group) {
    return language.value === "emj" ? toEmoji(group.label) : group.label;
  }

  return {
    language,
    languageGroups,
    languages,
    setLanguage,
    t,
    languageLabel,
    languageGroupLabel,
  };
}
