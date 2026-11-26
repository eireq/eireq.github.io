export const WORD = "onion";
export const CYCLE = WORD.length + 1;
export const ROUND_MS = 30_000;

export function createRun() {
  return {
    index: 0,
    tape: [],
    startedAt: null,
    elapsed: 0,
    finished: false,
  };
}

export function targetChar(index) {
  const at = index % CYCLE;
  return at === WORD.length ? " " : WORD[at];
}

export function tick(run, now = Date.now()) {
  if (run.startedAt == null || run.finished) return run;
  const elapsed = now - run.startedAt;
  if (elapsed >= ROUND_MS) {
    run.elapsed = ROUND_MS;
    run.finished = true;
    return run;
  }
  run.elapsed = Math.max(0, elapsed);
  return run;
}

export function press(run, key, now = Date.now()) {
  if (run.finished) return run;
  if (run.startedAt != null) {
    tick(run, now);
    if (run.finished) return run;
  }

  if (key === "Backspace") {
    const last = run.tape.pop();
    if (last?.ok) run.index -= 1;
    return run;
  }

  if (typeof key !== "string" || key.length !== 1 || key.charCodeAt(0) < 32) return run;

  if (run.startedAt == null) run.startedAt = now;
  const expected = targetChar(run.index);
  if (key === expected) {
    run.tape.push({ char: key, ok: true, expected });
    run.index += 1;
  } else {
    run.tape.push({ char: key, ok: false, expected });
  }
  return run;
}

export function wpmFor(correct, elapsedMs) {
  const minutes = Math.max(1, elapsedMs) / 60000;
  const wpm = Math.round(correct / 5 / minutes);
  return Math.max(0, Math.min(400, wpm));
}

export function slipGroups(tape) {
  const groups = [];
  tape.forEach((cell, index) => {
    if (cell.ok) return;
    const last = groups[groups.length - 1];
    if (last && last.end === index) {
      last.typed += cell.char;
      last.expected += cell.expected;
      last.end = index + 1;
      return;
    }
    groups.push({
      start: index,
      end: index + 1,
      typed: cell.char,
      expected: cell.expected,
    });
  });

  return groups.map((group) => ({
    ...group,
    typedLabel: labelChars(group.typed),
    expectedLabel: labelChars(group.expected),
  }));
}

function labelChars(text) {
  return [...text].map((char) => (char === " " ? "␣" : char)).join("");
}

export function summarize(run) {
  const correct = run.tape.filter((cell) => cell.ok).length;
  const mistakes = run.tape.length - correct;
  return {
    wpm: wpmFor(correct, ROUND_MS),
    correct,
    onions: Math.floor(correct / CYCLE),
    mistakes,
    board: mistakes === 0 ? "onion" : "mistake",
    tape: run.tape.map((cell) => ({ ...cell })),
    slips: slipGroups(run.tape),
  };
}

// the play line keeps a little of what you already typed, then the onion still ahead
export function windowCells(run, behind = 80, ahead = 42) {
  const start = Math.max(0, run.tape.length - behind);
  const cells = run.tape.slice(start).map((cell) => ({
    char: cell.char,
    kind: cell.ok ? "done" : "bad",
  }));
  const caret = cells.length;
  for (let i = 0; i < ahead; i += 1) {
    cells.push({ char: targetChar(run.index + i), kind: "next" });
  }
  return { cells, caret };
}
