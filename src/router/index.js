import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import GamesView from "../views/GamesView.vue";
import AboutMeView from "../views/AboutMeView.vue";
import GameRacingView from "../views/GameRacingView.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
      meta: { title: "eire" },
    },
    {
      path: "/me",
      name: "about-me",
      component: AboutMeView,
      meta: { title: "about me - eire" },
    },
    {
      path: "/games",
      name: "games",
      component: GamesView,
      meta: { title: "games - eire" },
    },
    {
      path: "/games/racing",
      name: "game-racing",
      component: GameRacingView,
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
  ],
  scrollBehavior() {
    return { top: 0 };
  },
});

router.afterEach((to) => {
  document.title = to.meta.title || "eire";
});

export default router;
