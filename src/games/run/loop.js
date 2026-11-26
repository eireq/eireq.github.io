import { drawRun } from "./draw.js";
import { caveScoreGame, createCave, createRoof, stepCave, stepRoof } from "./logic.js";

export function createRunLoop(canvas, kind, hooks = {}) {
  const ctx = canvas.getContext("2d");
  let state = null;
  let raf = 0;
  let last = 0;
  let hold = false;
  let pressed = false;
  let running = false;
  let paused = false;
  let waiting = false;

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  function frame(now) {
    if (!running || !state) return;
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;

    if (waiting && (paused || !hold)) {
      state.hold = hold;
      state.waiting = true;
      drawRun(ctx, state, { paused });
      hooks.onFrame?.(state);
      raf = requestAnimationFrame(frame);
      return;
    }
    waiting = false;

    if (!paused && state.alive) {
      const step = kind === "roof" ? stepRoof : stepCave;
      step(state, { hold, pressed }, dt);
      pressed = false;
      state.hold = hold;
      state.waiting = false;
      if (!state.alive) {
        drawRun(ctx, state, { paused: false });
        hooks.onFrame?.(state);
        stop();
        hooks.onEnd?.({
          game: kind === "roof" ? "roof" : caveScoreGame(state.mode),
          mode: state.mode,
          score: state.score,
          distance: state.score,
          jumps: state.jumps,
          time: state.elapsed,
          reason: state.reason,
        });
        return;
      }
    }

    state.hold = hold;
    state.waiting = false;
    drawRun(ctx, state, { paused });
    hooks.onFrame?.(state);
    raf = requestAnimationFrame(frame);
  }

  return {
    start(mode) {
      const seed = (Math.random() * 1e9) >>> 0;
      state = kind === "roof" ? createRoof(seed) : createCave(mode, seed);
      state.hold = false;
      state.waiting = kind === "cave";
      running = true;
      paused = false;
      waiting = kind === "cave";
      hold = false;
      pressed = false;
      last = performance.now();
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(frame);
    },
    togglePause() {
      if (!running || !state?.alive) return paused;
      paused = !paused;
      last = performance.now();
      return paused;
    },
    setHold(value) {
      hold = Boolean(value);
    },
    tap() {
      pressed = true;
    },
    abandon() {
      stop();
    },
    destroy() {
      stop();
      state = null;
    },
  };
}
