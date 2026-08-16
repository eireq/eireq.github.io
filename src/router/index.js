import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import GamesView from '../views/GamesView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { title: 'eire' }
    },
    {
      path: '/games',
      name: 'games',
      component: GamesView,
      meta: { title: 'games - eire' }
    },
    {
      path: '/games/racing',
      name: 'game-racing',
      component: () => import('../views/GameRacingView.vue'),
      meta: {
        title: 'eiracing :: lane runner',
        hideChrome: true
      }
    },
    {
      path: '/games/flagquiz',
      name: 'game-flagquiz',
      component: () => import('../views/FlagquizView.vue'),
      meta: {
        title: "eire's flag quiz",
        hideChrome: true
      }
    }
  ],
  scrollBehavior() {
    return { top: 0 }
  }
})

router.afterEach((to) => {
  document.title = to.meta.title || 'eire'
})

export default router
