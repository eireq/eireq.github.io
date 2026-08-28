import { ref } from "vue";

export const languageGroups = [
  {
    label: "real languages",
    languages: [
      { code: "eng", label: "english" },
      { code: "deu", label: "deutsch" },
      { code: "rus", label: "PYCCKNÑ" },
      { code: "kgn", label: "klingon" },
    ],
  },
  {
    label: "stereotypes",
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
    label: "crazy stuff and my inventions",
    languages: [
      { code: "jjj", label: "Jenglish (english but every consonant is J)" },
      { code: "ipa", label: "international phonetic alphabet" },
      { code: "emj", label: "emojis" },
      { code: "tkp", label: "toki pona but every word is translated back to english so its just a simpler type of english" },
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
    },
    home: { about: "about me ->", contact: "contact ->" },
    games: {
      title: "games.", intro: "a collection of games i've made. mostly small projects, experiments, and things i thought would be funny to make.", racing: "racing", racingText: "lane changing game. with leaderboards!!", flagQuiz: "flag quiz", flagQuizText: "identify flags from around the world. how many can you get right?", another: "another game", anotherText: "describe what the game is about here.", anotherTextTwo: "describe the game here.",
    },
    misc: {
      title: "misc.", intro: "a collection of miscellaneous projects, experiments, and other things that do not fit into games or art.", randomCountry: "random country", randomCountryText: "generate a random country and discover something new.", politics: "political preferences", politicsText: "my ideological charts and political test results.", elections: "Doulantese elections", electionsText: "results from the Discord union assembly.", modes: "modes", modesText: "another project from my collection of web experiments.", discordBots: "discord bots", discordBotsText: "small bots and other experiments from my GitHub projects.", other: "other stuff", otherText: "more random projects will appear here eventually.",
    },
    art: {
      title: "art.", intro: "a collection of art i've made. mostly digital experiments, flag designs, and things i thought would be funny to draw.", digital: "digital art", digitalText: "drawings, experiments, and other digital creations.", flags: "flag designs", flagsText: "fictional flags and designs inspired by vexillology.", more: "more coming soon", moreText: "i'll add more of my art here when i make something worth showing.",
    },
    contact: {
      title: "contact.", intro: "want to talk about programming, flags, games, music, movies, or anything else? send me a message.", find: "find me", server: "discord server", username: "my username on most platforms is", send: "send a message", name: "name", email: "email", message: "message", openDraft: "open email draft", status: "your email app should open with the message ready to send.",
    },
    randomCountry: {
      eyebrow: "random country", title: "pick a place.", intro: "countries, territories, and historical states. the map is bigger than you think.", yourPlace: "your random place", randomize: "randomize", pool: "the full pool", entries: "entries", find: "find an entry", search: "search...", empty: "no places found.",
    },
    politics: {
      title: "political compass & values", subtitle: "a collection of my ideological charts and political test results.", results: "political test results", compass: "traditional 2D axes", sapply: "3D compass grid", dozen: "12 core values", orbs: "spherical model", eight: "4 independent axes", nine: "9 detailed axes", scales: "8 characteristics & tags", left: "left-wing spectrum", right: "right-wing spectrum", alt: "alternative values spectrum", unavailable: "image not uploaded yet",
    },
    elections: {
      eyebrow: "Discord union assembly", title: "Doulantese elections.", intro: "preference results as recorded from the election ballot.", results: "election results", choice: "choice", review: "last reviewed: 2026/08/28 13:30 Central European Summer Time",
    },
    footer: { contact: "contact", text: "you can contact me via", email: "email" },
    about: {
      title: "about me.",
      who: "who am i?",
      intro: "so hi everyone, this is my personal website. here you can find some information about me, my projects, and other stuff. feel free to reach out to me if you want to collaborate or just say hi.",
      first: "first i'd like to introduce myself.",
      names: "you can call me eire, eireball, eireq, irelandball, or whatever you want.",
      origin: "i would like to clarify that i am not actually irish, i am from slovakia.",
      pronouns: "my pronouns are mostly he/him, but i do not really care about pronouns, so you can use whatever you want.",
      interests: "my interests",
      interestsText: "in my free time i like to code and make websites, play video games, watch movies, and generally waste time on the internet.",
      flagsText: "i am also a hobby-vexillophile, which means that i have a strong interest in flags. i am especially interested in their designs, history, symbolism, and sometimes questionable decisions.",
      movies: "movies & tv",
      moviesText: "from movies i like american action comedies the most. examples include the naked gun and police squad!, rush hour, hot shots!, and jim carrey movies like ace ventura, the mask, liar liar, and many more.",
      tvText: "from tv shows i like the it crowd, family guy, two and a half men, peacemaker, big bang theory, and many more.",
      music: "music",
      musicText: "i also like to make some music, but i am not very good at it. i mostly make some random stuff in fl studio :)",
      musicLikes: "from music i like basically everything, mostly dubioza kolektiv, young fathers, gorillaz, fontaines d.c., and many more.",
      jazz: "i have mixed opinions about jazz.",
      coding: "coding & projects",
      codingText: "i mostly code useless websites and website games in my free time, but i also like to make some discord bots.",
      projectsText: "i have made quite a lot of random projects over time, mostly websites, small games, discord bots, and other things that i thought would be funny or interesting to make.",
      projectsInclude: "my projects include",
      randomCountry: "random country",
      modes: "modes",
      racing: "racing",
      flagQuiz: "flag quiz",
      moreProjects: "you can find more of my projects on my",
      currently: "currently",
      currentlyText: "currently, i am working on this website and also on the arcade game.",
      planning: "i am also planning to make the projects mentioned above, although knowing me, there is a reasonable chance that i will start something completely different halfway through.",
      favoriteFlags: "favorite flags",
      favoriteFlagsText: "my favorite flags are ireland, slovakia, armenia, and saint pierre and miquelon, although this list changes whenever i discover another unnecessarily good flag.",
      randomFacts: "random facts",
      facts: ["i stole a license plate from a car once", "i plan to become a hyperpolyglot!", "did you know platypuses do not have teats, so they sweat milk out of their skin for their babies to drink?", "i really like the color yellow", "what to put here?", "i really shouldn't make this section", "why are you still reading this? go away, i have nothing else to say.", "sorry for being rude"],
      where: "where you can find me",
      contactText: "you can contact me via",
      contactMore: "you can also find me on",
      username: "my username on most platforms is",
      final: "if you want to talk about programming, flags, games, music, movies, or literally anything else, feel free to contact me.",
    },
  },
  deu: {
    nav: {
      about: "über mich",
      randomCountry: "zufälliges Land",
      modes: "modi.",
      games: "spiele",
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
    },
    home: { about: "über mich ->", contact: "kontakt ->" },
    games: {
      title: "spiele.", intro: "eine Sammlung von Spielen, die ich erstellt habe. meistens kleine Projekte, Experimente und Dinge, die lustig schienen.", racing: "racing", racingText: "spiel zum Spurwechseln, mit Bestenlisten!!", flagQuiz: "flaggenquiz", flagQuizText: "erkenne Flaggen aus aller Welt. wie viele schaffst du richtig?", another: "weiteres Spiel", anotherText: "beschreibe hier, worum es in dem Spiel geht.", anotherTextTwo: "beschreibe hier das Spiel.",
    },
    misc: {
      title: "sonstiges.", intro: "eine Sammlung verschiedener Projekte, Experimente und anderer Dinge, die nicht zu Spielen oder Kunst passen.", randomCountry: "zufälliges Land", randomCountryText: "generiere ein zufälliges Land und entdecke etwas Neues.", politics: "politische Präferenzen", politicsText: "meine ideologischen Diagramme und Ergebnisse politischer Tests.", modes: "modi", modesText: "ein weiteres Projekt aus meiner Sammlung von Web-Experimenten.", discordBots: "Discord-Bots", discordBotsText: "kleine Bots und andere Experimente aus meinen GitHub-Projekten.", other: "andere Sachen", otherText: "hier werden irgendwann weitere zufällige Projekte erscheinen.",
    },
    art: {
      title: "kunst.", intro: "eine Sammlung meiner Kunst. hauptsächlich digitale Experimente, Flaggendesigns und Dinge, die lustig zu zeichnen schienen.", digital: "digitale Kunst", digitalText: "Zeichnungen, Experimente und andere digitale Kreationen.", flags: "Flaggendesigns", flagsText: "Fiktive Flaggen und von Vexillologie inspirierte Designs.", more: "mehr kommt bald", moreText: "ich füge hier weitere Kunst hinzu, sobald ich etwas Vorzeigbares mache.",
    },
    contact: {
      title: "kontakt.", intro: "du möchtest über Programmierung, Flaggen, Spiele, Musik, Filme oder etwas anderes sprechen? schreib mir.", find: "hier findest du mich", server: "Discord-Server", username: "mein Benutzername auf den meisten Plattformen ist", send: "Nachricht senden", name: "Name", email: "E-Mail", message: "Nachricht", openDraft: "E-Mail-Entwurf öffnen", status: "deine E-Mail-App sollte sich mit der fertigen Nachricht öffnen.",
    },
    randomCountry: {
      eyebrow: "zufälliges Land", title: "wähle einen Ort.", intro: "Länder, Gebiete und historische Staaten. die Weltkarte ist größer, als du denkst.", yourPlace: "dein zufälliger Ort", randomize: "zufällig auswählen", pool: "die vollständige Auswahl", entries: "Einträge", find: "Eintrag finden", search: "suchen...", empty: "keine Orte gefunden.",
    },
    politics: {
      title: "politischer Kompass & Werte", subtitle: "eine Sammlung meiner ideologischen Diagramme und Ergebnisse politischer Tests.", results: "Ergebnisse politischer Tests", compass: "traditionelle 2D-Achsen", sapply: "3D-Kompassraster", dozen: "12 Grundwerte", orbs: "sphärisches Modell", eight: "4 unabhängige Achsen", nine: "9 detaillierte Achsen", scales: "8 Eigenschaften & Tags", left: "linkes Spektrum", right: "rechtes Spektrum", alt: "alternatives Wertespektrum", unavailable: "Bild noch nicht hochgeladen",
    },
    footer: { contact: "kontakt", text: "du kannst mich per", email: "E-Mail" },
    about: {
      title: "über mich.", who: "wer bin ich?", intro: "hallo zusammen, dies ist meine persönliche Website. hier findest du Informationen über mich, meine Projekte und andere Dinge. melde dich gerne, wenn du zusammenarbeiten oder einfach Hallo sagen möchtest.", first: "zuerst möchte ich mich vorstellen.", names: "du kannst mich eire, eireball, eireq, irelandball oder nennen, wie du möchtest.", origin: "ich möchte klarstellen, dass ich nicht irisch bin, sondern aus der Slowakei komme.", pronouns: "meine Pronomen sind meistens er/ihm, aber Pronomen sind mir nicht besonders wichtig.", interests: "meine Interessen", interestsText: "in meiner Freizeit programmiere ich gerne und erstelle Websites, spiele Videospiele, schaue Filme und verschwende allgemein Zeit im Internet.", flagsText: "ich interessiere mich außerdem als Hobby-Vexillologe sehr für Flaggen, besonders für ihr Design, ihre Geschichte, Symbolik und manchmal fragwürdige Entscheidungen.", movies: "filme & tv", moviesText: "bei Filmen mag ich amerikanische Actionkomödien am meisten. dazu gehören Die nackte Kanone und Police Squad!, Rush Hour, Hot Shots! sowie Jim-Carrey-Filme wie Ace Ventura, Die Maske und Liar Liar.", tvText: "bei Serien mag ich The IT Crowd, Family Guy, Two and a Half Men, Peacemaker, The Big Bang Theory und viele weitere.", music: "musik", musicText: "ich mache auch gerne Musik, bin darin aber nicht besonders gut. meistens erstelle ich zufällige Sachen in FL Studio :)", musicLikes: "bei Musik mag ich eigentlich alles, besonders Dubioza Kolektiv, Young Fathers, Gorillaz, Fontaines D.C. und viele weitere.", jazz: "zu Jazz habe ich gemischte Gefühle.", coding: "programmierung & projekte", codingText: "in meiner Freizeit programmiere ich hauptsächlich nutzlose Websites und Webspiele, aber ich erstelle auch gerne Discord-Bots.", projectsText: "im Laufe der Zeit habe ich viele zufällige Projekte erstellt, meistens Websites, kleine Spiele, Discord-Bots und andere Dinge, die lustig oder interessant schienen.", projectsInclude: "zu meinen Projekten gehören", randomCountry: "zufälliges Land", modes: "modi", racing: "racing", flagQuiz: "flaggenquiz", moreProjects: "mehr Projekte findest du auf meinem", currently: "aktuell", currentlyText: "aktuell arbeite ich an dieser Website und am Arcade-Spiel.", planning: "ich plane außerdem, die genannten Projekte zu erstellen. obwohl es bei mir gut möglich ist, dass ich zwischendurch etwas völlig anderes anfange.", favoriteFlags: "lieblingsflaggen", favoriteFlagsText: "meine Lieblingsflaggen sind Irland, die Slowakei, Armenien und Saint-Pierre und Miquelon. diese Liste ändert sich, sobald ich eine weitere unnötig gute Flagge entdecke.", randomFacts: "zufällige Fakten", facts: ["ich habe einmal ein Nummernschild von einem Auto gestohlen", "ich möchte ein Hyperpolyglott werden!", "wusstest du, dass Schnabeltiere keine Zitzen haben, sondern Milch durch ihre Haut ausschwitzen?", "ich mag die Farbe Gelb sehr", "was soll hier stehen?", "ich sollte diesen Abschnitt wirklich nicht machen", "warum liest du das noch? geh weg, ich habe nichts mehr zu sagen.", "entschuldigung für meine Unhöflichkeit"], where: "wo du mich findest", contactText: "du kannst mich per", contactMore: "du findest mich auch auf", username: "mein Benutzername auf den meisten Plattformen ist", final: "wenn du über Programmierung, Flaggen, Spiele, Musik, Filme oder irgendetwas anderes sprechen möchtest, kannst du dich gerne melden.",
    },
  },
};

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
};

function cloneAndTransform(value, transformer) {
  if (typeof value === "string") return transformer(value);
  if (Array.isArray(value)) return value.map((item) => cloneAndTransform(item, transformer));
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cloneAndTransform(item, transformer)]));
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
  nav: { about: "обо мне", randomCountry: "случайная страна", modes: "режимы.", games: "игры", art: "искусство", misc: "разное", contact: "контакты", discord: "сервер Discord", language: "язык", available: "реальные языки", comingSoon: "скоро", moreLanguages: "другие языки" },
  home: { about: "обо мне ->", contact: "контакты ->" },
  games: { title: "игры.", intro: "коллекция игр, которые я создал. в основном небольшие проекты, эксперименты и забавные идеи.", racing: "гонки", racingText: "игра со сменой полос. с таблицей лидеров!!", flagQuiz: "викторина о флагах", flagQuizText: "узнай флаги со всего мира. сколько ответов будет правильными?", another: "ещё одна игра", anotherText: "здесь будет описание игры.", anotherTextTwo: "здесь будет описание игры." },
  misc: { title: "разное.", intro: "коллекция разных проектов, экспериментов и других вещей, которые не относятся к играм или искусству.", randomCountry: "случайная страна", randomCountryText: "получи случайную страну и узнай что-нибудь новое.", politics: "политические предпочтения", politicsText: "мои идеологические диаграммы и результаты политических тестов.", modes: "режимы", modesText: "ещё один проект из моей коллекции веб-экспериментов.", discordBots: "боты Discord", discordBotsText: "небольшие боты и эксперименты из моих проектов на GitHub.", other: "другое", otherText: "здесь со временем появятся новые случайные проекты." },
  art: { title: "искусство.", intro: "коллекция созданных мной работ. в основном цифровые эксперименты, дизайны флагов и забавные рисунки.", digital: "цифровое искусство", digitalText: "рисунки, эксперименты и другие цифровые работы.", flags: "дизайны флагов", flagsText: "вымышленные флаги и дизайны, вдохновлённые вексиллологией.", more: "скоро будет больше", moreText: "я добавлю сюда новые работы, когда создам что-нибудь достойное показа." },
  contact: { title: "контакты.", intro: "хочешь поговорить о программировании, флагах, играх, музыке, фильмах или чём-нибудь ещё? напиши мне.", find: "где меня найти", server: "сервер Discord", username: "моё имя пользователя на большинстве платформ", send: "отправить сообщение", name: "имя", email: "электронная почта", message: "сообщение", openDraft: "открыть черновик письма", status: "почтовое приложение должно открыть готовое сообщение." },
  randomCountry: { eyebrow: "случайная страна", title: "выбери место.", intro: "страны, территории и исторические государства. карта больше, чем кажется.", yourPlace: "твоё случайное место", randomize: "выбрать случайно", pool: "полный список", entries: "записей", find: "найти запись", search: "поиск...", empty: "места не найдены." },
  politics: { title: "политический компас и ценности", subtitle: "коллекция моих идеологических диаграмм и результатов политических тестов.", results: "результаты политических тестов", compass: "традиционные 2D-оси", sapply: "3D-сетка компаса", dozen: "12 основных ценностей", orbs: "сферическая модель", eight: "4 независимые оси", nine: "9 подробных осей", scales: "8 характеристик и тегов", left: "левый политический спектр", right: "правый политический спектр", alt: "альтернативный спектр ценностей", unavailable: "изображение ещё не загружено" },
  footer: { contact: "контакты", text: "со мной можно связаться по адресу", email: "электронной почте" },
  about: { title: "обо мне.", who: "кто я?", intro: "привет всем, это мой личный сайт. здесь можно найти информацию обо мне, моих проектах и других вещах. пишите мне, если хотите посотрудничать или просто поздороваться.", first: "сначала я хочу представиться.", names: "можете называть меня eire, eireball, eireq, irelandball или как угодно.", origin: "хочу уточнить, что я не ирландец, а родом из Словакии.", pronouns: "обычно я использую местоимения он/его, но мне это не особенно важно.", interests: "мои интересы", interestsText: "в свободное время я программирую, создаю сайты, играю в видеоигры, смотрю фильмы и вообще трачу время в интернете.", flagsText: "я также увлекаюсь вексиллологией, то есть флагами, их дизайном, историей, символикой и иногда сомнительными решениями.", movies: "кино и телевидение", moviesText: "больше всего я люблю американские комедийные боевики: Голый пистолет, Полицейский отряд!, Час пик, Без чувств и фильмы Джима Керри.", tvText: "из сериалов мне нравятся Компьютерщики, Гриффины, Два с половиной человека, Миротворец, Теория большого взрыва и многие другие.", music: "музыка", musicText: "я также иногда сочиняю музыку, хотя делаю это не очень хорошо. обычно создаю что-нибудь случайное в FL Studio :)", musicLikes: "в музыке я люблю почти всё, особенно Dubioza Kolektiv, Young Fathers, Gorillaz и Fontaines D.C.", jazz: "к джазу у меня смешанное отношение.", coding: "кодинг и проекты", codingText: "в основном я создаю бесполезные сайты и игры для сайтов, но также люблю делать ботов Discord.", projectsText: "со временем я создал много случайных проектов: сайты, небольшие игры, ботов Discord и другие забавные или интересные вещи.", projectsInclude: "среди моих проектов", randomCountry: "случайная страна", modes: "режимы", racing: "гонки", flagQuiz: "викторина о флагах", moreProjects: "больше проектов можно найти на моём", currently: "сейчас", currentlyText: "сейчас я работаю над этим сайтом и аркадной игрой.", planning: "я также планирую сделать упомянутые проекты, хотя, зная себя, могу начать что-нибудь совершенно другое.", favoriteFlags: "любимые флаги", favoriteFlagsText: "мои любимые флаги: Ирландия, Словакия, Армения и Сен-Пьер и Микелон.", randomFacts: "случайные факты", facts: ["однажды я украл номерной знак с машины", "я планирую стать гиперполиглотом!", "у утконосов нет сосков: они выделяют молоко через кожу", "я очень люблю жёлтый цвет", "что сюда написать?", "мне не стоило создавать этот раздел", "почему ты всё ещё это читаешь? уходи.", "извините за грубость"], where: "где меня найти", contactText: "со мной можно связаться по", contactMore: "также я есть в", username: "моё имя пользователя на большинстве платформ", final: "если хотите поговорить о программировании, флагах, играх, музыке, фильмах или чём угодно, пишите мне." },
});

// Klingon terminology is approximate, but the complete site remains navigable in this mode.
messages.kgn = mergeMessages(messages.eng, {
  nav: { about: "jIH ghu'", randomCountry: "yu' Sep", modes: "mIw.", games: "Quj", art: "nagh", misc: "latlh", contact: "Qum", discord: "Discord Qum", language: "Hol", available: "Holmey", comingSoon: "tugh", moreLanguages: "latlh Holmey" },
  home: { about: "jIH ghu' ->", contact: "Qum ->" },
  games: { title: "Quj.", intro: "jIchenmoHbogh Qujmey tetlh. machbogh mIw, ngugh mIwvam je.", racing: "qet", racingText: "chaw' ghom Quj. mIwvaD pat!!", flagQuiz: "joqwI' ghojmoH", flagQuizText: "qo' Hoch joqwI' yIqel. 'ar bIyaj?" },
  misc: { title: "latlh.", intro: "Quj pagh nagh je Dalutbe'chugh, latlh mIwmey tetlh.", randomCountry: "yu' Sep", randomCountryText: "yu' Sep yISam.", politics: "qum vu'", politicsText: "jIH qum QInmey.", modes: "mIw", discordBots: "Discord bots" },
  art: { title: "nagh.", intro: "jIta'bogh nagh tetlh.", digital: "De' nagh", flags: "joqwI' chenmoH", more: "tugh latlh" },
  contact: { title: "Qum.", intro: "bIjatlh DaneH'a'? Qum.", find: "nuqDaq jIH", server: "Qum yej", send: "QIn ngeH", name: "pong", email: "QIn", message: "QIn", openDraft: "QIn ghItlh yIpoS" },
  randomCountry: { eyebrow: "yu' Sep", title: "Daq yIwIv.", intro: "Sepmey, yotmey, ngo' Sepmey je.", yourPlace: "lIj Daq", randomize: "yIwIv", pool: "tetlh naQ", entries: "mI'", find: "yISam", search: "nej...", empty: "Daq pagh." },
  politics: { title: "qum compass je", subtitle: "jIH qum QInmey je.", results: "qum test QInmey", compass: "2D 'och", sapply: "3D compass", dozen: "12 ngoQ", orbs: "meq", eight: "4 'och", nine: "9 'och", scales: "8 ghItlh", left: "poS", right: "nIH", alt: "latlh ngoQ", unavailable: "nagh wej yIlan" },
  footer: { contact: "Qum", text: "QumlaH", email: "QIn" },
  about: { title: "jIH ghu'.", who: "jIH nuq?", intro: "nuqneH. jIHvaD ghot porgh juH 'oH webvam'e'. jIH, jIta' je yIlegh.", first: "jIH'e' vImaq.", interests: "jIH muSHa'ghach", interestsText: "jIcode, web vIchenmoH, Quj vIQuj, vIDabbogh movie vIlegh.", movies: "movie tv je", tvText: "The IT Crowd, Family Guy, Peacemaker, Big Bang Theory je vIparHa'.", music: "QoQ", coding: "code mIwmey", currently: "DaH", favoriteFlags: "jIH muSHa' joqwI'", randomFacts: "ngoQmey", where: "nuqDaq jIH", final: "program, joqwI', Quj, QoQ, movie pagh latlh vIjatlhnISchugh, Qum." },
});

export function useI18n() {
  function setLanguage(code) {
    if (!messages[code]) return;
    language.value = code;
    window.localStorage.setItem("language", code);
  }

  function t(key) {
    return key.split(".").reduce((value, part) => value?.[part], messages[language.value]) ?? key;
  }

  return { language, languageGroups, languages, setLanguage, t };
}
