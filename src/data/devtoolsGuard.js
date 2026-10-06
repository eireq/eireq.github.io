/**
 * Best-effort DevTools detection for the flag quiz.
 * Not unbeatable — just enough to spoil casual Element/Vue inspection cheating.
 *
 * Size checks use a baseline from when the quiz starts so normal browser chrome
 * (tabs, toolbar, bookmarks) does not count as DevTools.
 */

export function createDevtoolsGuard(onDetect) {
  let armed = false;
  let tripped = false;
  let timer = null;
  let removeConsoleTrap = () => {};
  let baselineWidthGap = 0;
  let baselineHeightGap = 0;

  const trip = () => {
    if (!armed || tripped) return;
    tripped = true;
    onDetect?.();
  };

  const measureGaps = () => {
    const widthGap = Math.max(0, window.outerWidth - window.innerWidth);
    const heightGap = Math.max(0, window.outerHeight - window.innerHeight);
    return { widthGap, heightGap };
  };

  const sizeGrewLikeDevtools = () => {
    const { widthGap, heightGap } = measureGaps();
    // Docked DevTools usually adds a large pane; ignore small resize noise.
    return (
      widthGap - baselineWidthGap > 140 || heightGap - baselineHeightGap > 140
    );
  };

  const installConsoleTrap = () => {
    const probe = new Image();
    Object.defineProperty(probe, "id", {
      get() {
        trip();
        return "nice-try";
      },
    });

    const beat = window.setInterval(() => {
      if (!armed || tripped) return;
      // Opening the console often reifies this getter in Chromium.
      // eslint-disable-next-line no-console
      console.log("%c", probe);
      // eslint-disable-next-line no-console
      console.clear();
    }, 1600);

    removeConsoleTrap = () => window.clearInterval(beat);
  };

  const tick = () => {
    if (!armed || tripped) return;
    if (sizeGrewLikeDevtools()) {
      trip();
      return;
    }

    const started = performance.now();
    // Pauses much longer when a debugger is attached / DevTools breaks on debugger.
    // eslint-disable-next-line no-debugger
    debugger;
    if (performance.now() - started > 200) trip();
  };

  return {
    arm() {
      const gaps = measureGaps();
      baselineWidthGap = gaps.widthGap;
      baselineHeightGap = gaps.heightGap;
      armed = true;
      tripped = false;
      removeConsoleTrap();
      installConsoleTrap();
      if (timer) window.clearInterval(timer);
      // Delay first tick so arming itself never races a layout frame.
      timer = window.setInterval(tick, 1000);
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
