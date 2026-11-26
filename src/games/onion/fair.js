// real keystrokes wander. a script dumps a word in one burst, taps for only a
// few milliseconds, or hits the same gap over and over.
const BURST_GAP = 12;
const BURST_RUN = 5;
const HOLD_LIMIT = 12;
const HOLD_MEDIAN = 12;
const EVEN_COUNT = 24;
const EVEN_STDEV = 8;
const EVEN_MEDIAN = 150;

export function createTrace() {
  return {
    intervals: [],
    holds: [],
    lastAt: null,
    voided: null,
  };
}

export function pushDown(trace, at) {
  if (trace.voided || trace.lastAt == null) {
    trace.lastAt = at;
    return trace;
  }
  const gap = at - trace.lastAt;
  trace.lastAt = at;
  if (gap < 0) return trace;
  trace.intervals.push(gap);
  trace.voided = scriptReason(trace);
  return trace;
}

export function pushHold(trace, hold) {
  if (trace.voided || !(hold >= 0)) return trace;
  trace.holds.push(hold);
  trace.voided = scriptReason(trace);
  return trace;
}

export function scriptReason(trace) {
  if (hasBurst(trace.intervals)) return "script";
  if (trace.holds.length >= HOLD_LIMIT && median(trace.holds) < HOLD_MEDIAN) return "script";
  if (
    trace.intervals.length >= EVEN_COUNT &&
    median(trace.intervals) < EVEN_MEDIAN &&
    stdev(trace.intervals) < EVEN_STDEV
  ) {
    return "script";
  }
  return null;
}

function hasBurst(gaps) {
  let run = 0;
  for (const gap of gaps) {
    if (gap < BURST_GAP) {
      run += 1;
      if (run >= BURST_RUN) return true;
    } else {
      run = 0;
    }
  }
  return false;
}

function median(values) {
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

function stdev(values) {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}
