import { GAME_CONFIG } from "./config.js";
import { createAudio } from "./audio.js";
import { createDb } from "./supabase.js";
import { createGame } from "./game.js";
import { createUI } from "./ui.js";

export function initRacing() {
  window.GAME_CONFIG = GAME_CONFIG;
  createAudio();
  createDb();
  createGame();
  createUI();

  return () => {
    window.audio?.stopMenu?.();
    window.audio?.stopGame?.();
    window.game?.destroy?.();
    window.game = null;
    window.ui = null;
    window.audio = null;
  };
}
