import { seededIndex, utcDateKey } from "./flags.js";
import { PI_DECIMALS } from "./piDigits.js";

const KEY = "eireDailyPi";

export const ATTEMPTS = 3;

export function batchSize(mastered, length = PI_DECIMALS.length) {
  if (mastered >= length) return 0;
  let size = 3;
  if (mastered >= 12) size = 4;
  if (mastered >= 32) size = 5;
  if (mastered >= 60) size = 6;
  if (mastered >= 100) size = 7;
  if (mastered >= 150) size = 8;
  return Math.min(size, length - mastered);
}

/** Growing slices of today's new digits, so the quiz builds up. */
export function prefixCuts(length) {
  if (length <= 3) return [length];
  const cuts = [3];
  let cursor = 3;
  while (cursor < length) {
    const remain = length - cursor;
    cursor += remain <= 4 ? remain : 3;
    cuts.push(cursor);
  }
  return cuts;
}

export function shiftDateKey(dateKey, days) {
  const date = new Date(`${dateKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function lessonPlan(mastered, dateKey, digits = PI_DECIMALS) {
  const known = digits.slice(0, mastered);
  const count = batchSize(mastered, digits.length);
  const fresh = digits.slice(mastered, mastered + count);
  const steps = [];

  if (count > 0) {
    let previous = 0;
    for (const cut of prefixCuts(fresh.length)) {
      const answer = fresh.slice(0, cut);
      steps.push({
        type: "learn",
        answer,
        added: answer.length - previous,
        from: mastered + 1,
        to: mastered + answer.length,
      });
      previous = answer.length;
    }
  }

  if (known.length >= 5) {
    pushUnique(steps, recallStep(known, `${dateKey}:${mastered}`));
  }

  if (count === 0 && known.length >= 5) {
    pushUnique(steps, recallStep(known, `${dateKey}:${mastered}:b`));
  }

  const all = known + fresh;
  if (all.length > 0) {
    const tailLen = Math.min(all.length, Math.max(10, fresh.length + 5));
    const tail = all.slice(-tailLen);
    pushUnique(steps, {
      type: all.length === tailLen ? "all" : "tail",
      answer: tail,
      added: 0,
      from: all.length - tailLen + 1,
      to: all.length,
    });
  }

  return { known, fresh, steps };
}

function pushUnique(steps, step) {
  if (steps.some((item) => item.answer === step.answer)) return;
  steps.push(step);
}

function recallStep(known, seed) {
  const len = Math.min(8, known.length);
  const olderLimit = Math.max(0, known.length - 12 - len);
  const limit = known.length - len;
  const span = olderLimit > 0 ? olderLimit : limit;
  const start = seededIndex(`pi-recall:${seed}`, span + 1);
  return {
    type: "recall",
    answer: known.slice(start, start + len),
    added: 0,
    from: start + 1,
    to: start + len,
  };
}

export function gradeAnswer(raw, answer) {
  const digits = String(raw ?? "").replace(/\D/g, "");
  const marks = answer.split("").map((digit, index) => {
    if (digits[index] == null) return "empty";
    return digits[index] === digit ? "ok" : "bad";
  });
  return {
    digits,
    marks,
    correct: digits === answer,
  };
}

export function emptyPiProgress(dateKey) {
  return {
    mastered: 0,
    streak: 0,
    lastWin: null,
    dateKey,
    status: "study",
    step: 0,
    misses: 0,
    gained: 0,
    log: [],
  };
}

function clampMastered(value) {
  const number = Math.floor(Number(value) || 0);
  if (number < 0) return 0;
  if (number > PI_DECIMALS.length) return PI_DECIMALS.length;
  return number;
}

export function normalizePiProgress(data, dateKey) {
  const freshDay = !data || data.dateKey !== dateKey;
  const mastered = clampMastered(data?.mastered);
  const plan = lessonPlan(mastered, dateKey);
  let status = ["study", "quiz", "done", "failed"].includes(data?.status)
    ? data.status
    : "study";
  let step = Number.isInteger(data?.step) ? data.step : 0;
  let misses = Number.isInteger(data?.misses) ? data.misses : 0;

  if (freshDay) {
    status = "study";
    step = 0;
    misses = 0;
  }

  if (status === "study" || status === "quiz") {
    if (step < 0 || step >= plan.steps.length) {
      status = "study";
      step = 0;
      misses = 0;
    }
    misses = Math.max(0, Math.min(ATTEMPTS - 1, misses));
  }

  const log =
    Array.isArray(data?.log) && !freshDay
      ? data.log.filter((item) => Number.isInteger(item))
      : [];

  return {
    mastered,
    streak: Math.max(0, Number(data?.streak) || 0),
    lastWin: typeof data?.lastWin === "string" ? data.lastWin : null,
    dateKey,
    status,
    step,
    misses,
    gained: freshDay ? 0 : Math.max(0, Number(data?.gained) || 0),
    log,
  };
}

export function savePiProgress(progress) {
  window.localStorage.setItem(KEY, JSON.stringify(progress));
  return progress;
}

export function loadPiProgress(dateKey = utcDateKey()) {
  let saved = null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) saved = JSON.parse(raw);
  } catch {
    saved = null;
  }
  return normalizePiProgress(saved, dateKey);
}

export function visibleStreak(progress, today) {
  if (!progress.lastWin) return 0;
  if (
    progress.lastWin === today ||
    progress.lastWin === shiftDateKey(today, -1)
  ) {
    return progress.streak;
  }
  return 0;
}

export function beginPiQuiz(progress) {
  if (progress.status !== "study") return progress;
  return savePiProgress({ ...progress, status: "quiz", misses: 0 });
}

export function submitPiAnswer(progress, dateKey, raw) {
  if (progress.status !== "quiz" || progress.dateKey !== dateKey) return progress;
  const plan = lessonPlan(progress.mastered, dateKey);
  const step = plan.steps[progress.step];
  if (!step) return progress;

  const grade = gradeAnswer(raw, step.answer);
  if (!grade.correct) {
    const misses = progress.misses + 1;
    if (misses >= ATTEMPTS) {
      return savePiProgress({
        ...progress,
        misses,
        status: "failed",
        streak: 0,
        lastWin: null,
        log: [...progress.log, misses],
      });
    }
    return savePiProgress({ ...progress, misses });
  }

  const log = [...progress.log, progress.misses];
  const nextStep = progress.step + 1;
  if (nextStep >= plan.steps.length) {
    const streak =
      progress.lastWin === shiftDateKey(dateKey, -1) ? progress.streak + 1 : 1;
    return savePiProgress({
      ...progress,
      mastered: Math.min(
        PI_DECIMALS.length,
        progress.mastered + plan.fresh.length,
      ),
      gained: plan.fresh.length,
      streak,
      lastWin: dateKey,
      status: "done",
      step: nextStep,
      misses: 0,
      log,
    });
  }

  const upcoming = plan.steps[nextStep];
  return savePiProgress({
    ...progress,
    step: nextStep,
    misses: 0,
    log,
    status: upcoming.type === "learn" ? "study" : "quiz",
  });
}

export function sharePiText({ dateKey, mastered, streak, solved, log }) {
  const squares = (log || [])
    .map((misses, index) => {
      const failedHere = !solved && index === log.length - 1;
      if (failedHere) return "⬛";
      return misses === 0 ? "🟩" : "🟨";
    })
    .join("");
  const lines = [
    `eire daily pi ${dateKey}`,
    solved
      ? `${mastered} digits · streak ${streak}`
      : `missed · ${mastered} digits`,
  ];
  if (squares) lines.push(squares);
  lines.push("https://eireq.github.io/tools/pi");
  return lines.join("\n");
}

export function msUntilUtcMidnight(now = new Date()) {
  const next = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
  );
  return Math.max(0, next - now.getTime());
}
