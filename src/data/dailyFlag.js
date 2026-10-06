import {
  filterFlagsByMode,
  isCorrectFlagAnswer,
  seededIndex,
  shortName,
  utcDateKey,
} from "./flags.js";

const STREAK_KEY = "eireDailyFlag";

export function pickDailyFlag(flags, dateKey = utcDateKey()) {
  const pool = filterFlagsByMode(flags, "countries");
  if (!pool.length) return null;
  return pool[seededIndex(`daily-flag:${dateKey}`, pool.length)];
}

export function loadDailyProgress(dateKey = utcDateKey()) {
  try {
    const raw = window.localStorage.getItem(STREAK_KEY);
    if (!raw) {
      return { dateKey, solved: false, failed: false, guesses: [], streak: 0, lastWin: null };
    }
    const data = JSON.parse(raw);
    const sameDay = data.dateKey === dateKey;
    return {
      dateKey: sameDay ? dateKey : dateKey,
      solved: Boolean(data.solved) && sameDay,
      failed: Boolean(data.failed) && sameDay,
      guesses: sameDay ? data.guesses || [] : [],
      streak: Number(data.streak) || 0,
      lastWin: data.lastWin || null,
      answer: sameDay ? data.answer || null : null,
    };
  } catch {
    return { dateKey, solved: false, failed: false, guesses: [], streak: 0, lastWin: null };
  }
}

export function saveDailyProgress(progress) {
  window.localStorage.setItem(STREAK_KEY, JSON.stringify(progress));
}

export function recordDailyGuess({
  dateKey,
  guess,
  correct,
  answerName,
  maxGuesses = 6,
}) {
  const current = loadDailyProgress(dateKey);
  if (current.solved || current.failed) return current;

  const guesses = [...current.guesses, guess];
  let streak = Number(current.streak) || 0;
  let lastWin = current.lastWin || null;
  let solved = false;
  let failed = false;

  if (correct) {
    solved = true;
    const yesterday = new Date(`${dateKey}T12:00:00Z`);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yesterdayKey = utcDateKey(yesterday);
    streak = lastWin === yesterdayKey ? streak + 1 : 1;
    lastWin = dateKey;
  } else if (guesses.length >= maxGuesses) {
    failed = true;
  }

  const next = {
    dateKey,
    guesses,
    solved,
    failed,
    streak: solved ? streak : current.streak || 0,
    lastWin: solved ? lastWin : current.lastWin || null,
    answer: solved || failed ? answerName : null,
  };

  saveDailyProgress(next);
  return next;
}

export function dailyShareText({ dateKey, guesses, solved, flag, answer }) {
  const lines = guesses
    .map((guess) => {
      if (flag) return isCorrectFlagAnswer(guess, flag) ? "🟩" : "⬛";
      return guess === answer || shortName({ name: guess }) === answer
        ? "🟩"
        : "⬛";
    })
    .join("");
  return `eire daily flag ${dateKey}\n${solved ? "solved" : "missed"} in ${guesses.length}/6\n${lines}\nhttps://eireq.github.io/games/daily`;
}
