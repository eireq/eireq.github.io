export function createAudio() {
  const audio = {
    click() {
      const el = document.getElementById("clickSound")
      if (!el?.src) return
      el.currentTime = 0
      el.play().catch(() => {})
    },

    async menu() {
      const el = document.getElementById("menuMusic")
      if (!el?.src) return
      try { await el.play() } catch {}
    },

    stopMenu() {
      const el = document.getElementById("menuMusic")
      if (!el) return
      el.pause()
      el.currentTime = 0
    },

    async game() {
      const el = document.getElementById("gameMusic")
      if (!el?.src) return
      try { await el.play() } catch {}
    },

    stopGame() {
      const el = document.getElementById("gameMusic")
      if (!el) return
      el.pause()
      el.currentTime = 0
    },

    init() {
      const c = window.GAME_CONFIG
      const menu = document.getElementById("menuMusic")
      const game = document.getElementById("gameMusic")
      const click = document.getElementById("clickSound")

      if (c.menuMusic) menu.src = c.menuMusic
      if (c.gameMusic) game.src = c.gameMusic
      if (c.clickSound) click.src = c.clickSound
    }
  }

  audio.init()
  window.audio = audio
  return audio
}
