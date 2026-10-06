/**
 * Best-effort DevTools detection for the flag quiz.
 * Not unbeatable — just enough to spoil casual Element/Vue inspection cheating.
 */

export function createDevtoolsGuard(onDetect) {
  let armed = false;
  let tripped = false;
  let timer = null;
  let removeConsoleTrap = () => {};

  const trip = () => {
    if (!armed || tripped) return;
    tripped = true;
    onDetect?.();
  };

  const sizeLooksOpen = () => {
    const widthGap = Math.abs(window.outerWidth - window.innerWidth);
    const heightGap = Math.abs(window.outerHeight - window.innerHeight);
    return widthGap > 160 || heightGap > 160;
  };

  const installConsoleTrap = () => {
    const probe = new Image();
    let accessed = false;
    Object.defineProperty(probe, "id", {
      get() {
        accessed = true;
        trip();
        return "nice-try";
      },
    });

    const beat = window.setInterval(() => {
      if (!armed || tripped) return;
      accessed = false;
      // Opening the console often reifies this getter in Chromium.
      // eslint-disable-next-line no-console
      console.log("%c", probe);
      // eslint-disable-next-line no-console
      console.clear();
      if (accessed) trip();
    }, 1200);

    removeConsoleTrap = () => window.clearInterval(beat);
  };

  const tick = () => {
    if (!armed || tripped) return;
    if (sizeLooksOpen()) {
      trip();
      return;
    }

    const started = performance.now();
    // Pauses much longer when a debugger is attached / DevTools breaks on debugger.
    // eslint-disable-next-line no-debugger
    debugger;
    if (performance.now() - started > 120) trip();
  };

  return {
    arm() {
      armed = true;
      tripped = false;
      removeConsoleTrap();
      installConsoleTrap();
      if (timer) window.clearInterval(timer);
      timer = window.setInterval(tick, 900);
      tick();
    },
    disarm() {
      armed = false;
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
      removeConsoleTrap();
    },
    get tripped() {
      return tripped;
    },
  };
}
