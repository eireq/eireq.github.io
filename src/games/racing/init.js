import { ensureGameDb } from "../ensureDb.js";
import { createAudio } from "./audio.js";
import { createGame } from "./game.js";
import { createUI } from "./ui.js";

export function initRacing() {
  ensureGameDb();
  createAudio();
  createGame();
  const ui = createUI();

  return () => {
    ui?.destroy?.();
    window.audio?.stopMenu?.();
    window.audio?.stopGame?.();
    window.game?.destroy?.();
    window.game = null;
    window.ui = null;
    window.audio = null;
  };
}
