import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { GAME_CONFIG } from "./games/racing/config.js";
import { createDb } from "./games/racing/supabase.js";
import "./assets/main.css";

window.GAME_CONFIG = GAME_CONFIG;
createDb();

createApp(App).use(router).mount("#app");
