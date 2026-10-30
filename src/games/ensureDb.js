import { GAME_CONFIG } from "./racing/config.js";
import { createDb } from "./racing/supabase.js";

export function ensureGameDb() {
  if (!window.GAME_CONFIG) {
    window.GAME_CONFIG = GAME_CONFIG;
  }

  if (!window.db) {
    createDb();
  }

  return window.db;
}
