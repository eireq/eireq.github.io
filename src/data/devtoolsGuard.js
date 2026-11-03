// catches people opening devtools during a flag quiz to peek at the answer.
// anyone determined can get around it, it's just there to ruin the easy cheat.
// the window size is measured when the quiz starts, so tabs and toolbars
// don't count as devtools.
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
    // docked devtools adds a big pane, small resizes are just noise
    const widthGrew = widthGap - baselineWidthGap > 140;
    const heightGrew = heightGap - baselineHeightGap > 140;
    const phone = window.matchMedia("(pointer: coarse)").matches;
    if (phone && !widthGrew) return false;
    return widthGrew || heightGrew;
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
      // chromium reads this getter when the console is open
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
    // with devtools open this line actually stops, so the gap gets long
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
