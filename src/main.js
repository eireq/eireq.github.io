import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createDb } from './games/racing/supabase.js'
import './assets/main.css'

createDb()

createApp(App)
  .use(router)
  .mount('#app')