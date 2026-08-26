import { ref } from "vue";

export const languages = [
  { code: "eng", label: "English" },
  { code: "deu", label: "Deutsch" },
];

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
    home: { about: "about me ->" },
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
    home: { about: "über mich ->" },
    footer: { contact: "kontakt", text: "du kannst mich per", email: "E-Mail" },
    about: {
      title: "über mich.", who: "wer bin ich?", intro: "hallo zusammen, dies ist meine persönliche Website. hier findest du Informationen über mich, meine Projekte und andere Dinge. melde dich gerne, wenn du zusammenarbeiten oder einfach Hallo sagen möchtest.", first: "zuerst möchte ich mich vorstellen.", names: "du kannst mich eire, eireball, eireq, irelandball oder nennen, wie du möchtest.", origin: "ich möchte klarstellen, dass ich nicht irisch bin, sondern aus der Slowakei komme.", pronouns: "meine Pronomen sind meistens er/ihm, aber Pronomen sind mir nicht besonders wichtig.", interests: "meine Interessen", interestsText: "in meiner Freizeit programmiere ich gerne und erstelle Websites, spiele Videospiele, schaue Filme und verschwende allgemein Zeit im Internet.", flagsText: "ich interessiere mich außerdem als Hobby-Vexillologe sehr für Flaggen, besonders für ihr Design, ihre Geschichte, Symbolik und manchmal fragwürdige Entscheidungen.", movies: "filme & tv", moviesText: "bei Filmen mag ich amerikanische Actionkomödien am meisten. dazu gehören Die nackte Kanone und Police Squad!, Rush Hour, Hot Shots! sowie Jim-Carrey-Filme wie Ace Ventura, Die Maske und Liar Liar.", tvText: "bei Serien mag ich The IT Crowd, Family Guy, Two and a Half Men, Peacemaker, The Big Bang Theory und viele weitere.", music: "musik", musicText: "ich mache auch gerne Musik, bin darin aber nicht besonders gut. meistens erstelle ich zufällige Sachen in FL Studio :)", musicLikes: "bei Musik mag ich eigentlich alles, besonders Dubioza Kolektiv, Young Fathers, Gorillaz, Fontaines D.C. und viele weitere.", jazz: "zu Jazz habe ich gemischte Gefühle.", coding: "programmierung & projekte", codingText: "in meiner Freizeit programmiere ich hauptsächlich nutzlose Websites und Webspiele, aber ich erstelle auch gerne Discord-Bots.", projectsText: "im Laufe der Zeit habe ich viele zufällige Projekte erstellt, meistens Websites, kleine Spiele, Discord-Bots und andere Dinge, die lustig oder interessant schienen.", projectsInclude: "zu meinen Projekten gehören", randomCountry: "zufälliges Land", modes: "modi", racing: "racing", flagQuiz: "flaggenquiz", moreProjects: "mehr Projekte findest du auf meinem", currently: "aktuell", currentlyText: "aktuell arbeite ich an dieser Website und am Arcade-Spiel.", planning: "ich plane außerdem, die genannten Projekte zu erstellen. obwohl es bei mir gut möglich ist, dass ich zwischendurch etwas völlig anderes anfange.", favoriteFlags: "lieblingsflaggen", favoriteFlagsText: "meine Lieblingsflaggen sind Irland, die Slowakei, Armenien und Saint-Pierre und Miquelon. diese Liste ändert sich, sobald ich eine weitere unnötig gute Flagge entdecke.", randomFacts: "zufällige Fakten", facts: ["ich habe einmal ein Nummernschild von einem Auto gestohlen", "ich möchte ein Hyperpolyglott werden!", "wusstest du, dass Schnabeltiere keine Zitzen haben, sondern Milch durch ihre Haut ausschwitzen?", "ich mag die Farbe Gelb sehr", "was soll hier stehen?", "ich sollte diesen Abschnitt wirklich nicht machen", "warum liest du das noch? geh weg, ich habe nichts mehr zu sagen.", "entschuldigung für meine Unhöflichkeit"], where: "wo du mich findest", contactText: "du kannst mich per", contactMore: "du findest mich auch auf", username: "mein Benutzername auf den meisten Plattformen ist", final: "wenn du über Programmierung, Flaggen, Spiele, Musik, Filme oder irgendetwas anderes sprechen möchtest, kannst du dich gerne melden.",
    },
  },
};

export function useI18n() {
  function setLanguage(code) {
    if (!messages[code]) return;
    language.value = code;
    window.localStorage.setItem("language", code);
  }

  function t(key) {
    return key.split(".").reduce((value, part) => value?.[part], messages[language.value]) ?? key;
  }

  return { language, languages, setLanguage, t };
}
