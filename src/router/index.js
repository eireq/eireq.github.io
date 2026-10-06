import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "home",
      component: () => import("../views/HomeView.vue"),
      meta: { title: "eire" },
    },
    {
      path: "/me",
      name: "about-me",
      component: () => import("../views/AboutMeView.vue"),
      meta: { title: "about me - eire" },
    },
    {
      path: "/games",
      name: "games",
      component: () => import("../views/GamesView.vue"),
      meta: { title: "games - eire" },
    },
    {
      path: "/tools",
      name: "tools",
      component: () => import("../views/ToolsView.vue"),
      meta: { title: "tools - eire" },
    },
    {
      path: "/art",
      name: "art",
      component: () => import("../views/ArtView.vue"),
      meta: { title: "art - eire" },
    },
    {
      path: "/misc",
      name: "misc",
      component: () => import("../views/MiscView.vue"),
      meta: { title: "misc - eire" },
    },
    {
      path: "/contact",
      name: "contact",
      component: () => import("../views/ContactView.vue"),
      meta: { title: "contact - eire" },
    },
    {
      path: "/rc",
      name: "random-country",
      component: () => import("../views/RandomCountryView.vue"),
      meta: { title: "random country - eire" },
    },
    {
      path: "/flagdb",
      name: "flag-database",
      component: () => import("../views/FlagDatabaseView.vue"),
      meta: { title: "flag database - eire" },
    },
    {
      path: "/flagdb/detail/:flagId",
      name: "flag-detail",
      component: () => import("../views/FlagDetailView.vue"),
      meta: { title: "flag details - eire" },
    },
    {
      path: "/compare",
      name: "compare-flags",
      component: () => import("../views/CompareFlagsView.vue"),
      meta: { title: "compare flags - eire" },
    },
    {
      path: "/politics",
      name: "politics",
      component: () => import("../views/PoliticalPreferencesView.vue"),
      meta: { title: "political preferences - eire" },
    },
    {
      path: "/jpol",
      name: "jpol",
      component: () => import("../views/JPolView.vue"),
      meta: { title: "jPol - eire" },
    },
    {
      path: "/elections",
      name: "elections",
      component: () => import("../views/DoulanteseElectionsView.vue"),
      meta: { title: "doulantese elections - eire" },
    },
    {
      path: "/kht",
      name: "kht",
      component: () => import("../views/KhtView.vue"),
      meta: { title: "KHT tournament - eire" },
    },
    {
      path: "/games/racing",
      name: "game-racing",
      component: () => import("../views/GameRacingView.vue"),
      meta: {
        title: "eiracing :: lane runner",
        hideChrome: true,
      },
    },
    {
      path: "/games/flagquiz",
      name: "game-flagquiz",
      component: () => import("../views/FlagQuizView.vue"),
      meta: {
        title: "eire's flag quiz",
        hideChrome: true,
      },
    },
    {
      path: "/games/daily",
      name: "game-daily-flag",
      component: () => import("../views/DailyFlagView.vue"),
      meta: {
        title: "daily flag - eire",
      },
    },
    {
      path: "/modes",
      name: "modes",
      beforeEnter() {
        window.location.replace("https://eireq.github.io/modes");
        return false;
      },
      component: () => import("../views/HomeView.vue"),
      meta: { title: "modes - eire" },
    },
  ],
  scrollBehavior() {
    return { top: 0 };
  },
});

router.afterEach((to) => {
  document.title = to.meta.title || "eire";
});

export default router;
