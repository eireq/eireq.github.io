// browsers block autoplay until the player clicks something, so failed plays are expected
function play(id) {
  const el = document.getElementById(id);
  if (!el?.src) return;
  el.play().catch(() => {});
}

function stop(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.pause();
  el.currentTime = 0;
}

export function createAudio() {
  const config = window.GAME_CONFIG;
  if (config.menuMusic) document.getElementById("menuMusic").src = config.menuMusic;
  if (config.gameMusic) document.getElementById("gameMusic").src = config.gameMusic;
  if (config.clickSound) document.getElementById("clickSound").src = config.clickSound;

  const audio = {
    click() {
      const el = document.getElementById("clickSound");
      if (el?.src) el.currentTime = 0;
      play("clickSound");
    },
    menu: () => play("menuMusic"),
    stopMenu: () => stop("menuMusic"),
    game: () => play("gameMusic"),
    stopGame: () => stop("gameMusic"),
  };

  window.audio = audio;
  return audio;
}
