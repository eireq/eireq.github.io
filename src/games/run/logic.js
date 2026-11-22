export const RUN_W = 480;
export const RUN_H = 720;

export const CAVE = {
  gravity: 720,
  thrust: 1280,
  maxFall: 240,
  maxRise: -170,
  radius: 12,
  startSpeed: 200,
  accel: 0.016,
  maxSpeed: 310,
  playerX: 150,
};

export const ROOF = {
  gravity: 1900,
  jump: -640,
  height: 36,
  startSpeed: 230,
  accel: 0.02,
  maxSpeed: 320,
  coyote: 0.1,
  maxFall: 900,
  playerX: 132,
  foot: 4,
};

export const RUNS = {
  cave: {
    title: "cave flyer",
    tagline: "hold to climb. let go to drop. the rock closes in.",
    hint: "hold space, or press and hold on the screen. p pauses. esc leaves.",
    aria: "cave flyer",
    extra: "gap",
    other: { to: "/games/roof", label: "roof run" },
  },
  roof: {
    title: "roof run",
    tagline: "the roofs get shorter. jump the gaps.",
    hint: "space, click, or tap to jump. p pauses. esc leaves.",
    aria: "roof run",
    extra: "jumps",
    other: { to: "/games/cave", label: "cave flyer" },
  },
};

export function runMeta(kind) {
  return RUNS[kind] || RUNS.cave;
}

export function deathTitle(kind, reason) {
  if (kind === "roof" && reason === "wall") return "you hit the lip";
  if (kind === "roof") return "you missed the roof";
  return "you hit the rock";
}

function clampDt(dt) {
  if (!Number.isFinite(dt) || dt <= 0) return 0;
  return Math.min(dt, 0.05);
}

function slices(dt) {
  const total = clampDt(dt);
  const count = Math.max(1, Math.ceil(total / (1 / 120)));
  return { total, count, h: total / count };
}

export const CAVE_MODES = [
  { id: "normal", label: "normal" },
  { id: "slow", label: "slow" },
  { id: "random", label: "random" },
];

export function caveMode(mode) {
  return mode === "slow" || mode === "random" ? mode : "normal";
}

export function caveScoreGame(mode) {
  const safe = caveMode(mode);
  if (safe === "slow") return "cave-slow";
  if (safe === "random") return "cave-random";
  return "cave";
}

function caveGap(distance, mode) {
  const shrink = mode === "slow" ? 0.011 : 0.028;
  return Math.max(118, 500 - distance * shrink);
}

function sineCenter(distance, gap) {
  const margin = 32;
  const travel = Math.max(0, RUN_H - margin * 2 - gap);
  const sharp = Math.min(1.6, Math.max(0, (distance - 3600) / 10000));
  const wobble =
    Math.sin(distance * (0.0022 + sharp * 0.0024)) * 0.7 +
    Math.sin(distance * (0.0048 + sharp * 0.0046) + 1.2) * (0.22 + sharp * 0.18);
  const mix = 0.5 + 0.5 * Math.max(-1, Math.min(1, wobble));
  return margin + gap / 2 + mix * travel;
}

function centerAt(knots, distance) {
  if (!knots?.length) return RUN_H / 2;
  if (distance <= knots[0].d) return knots[0].center;
  let index = 0;
  while (index < knots.length - 2 && knots[index + 1].d <= distance) index += 1;
  const from = knots[index];
  const to = knots[index + 1] || from;
  const span = to.d - from.d;
  const t = span <= 0 ? 1 : Math.max(0, Math.min(1, (distance - from.d) / span));
  const smooth = t * t * (3 - 2 * t);
  return from.center + (to.center - from.center) * smooth;
}

function fillCaveKnots(state) {
  let last = state.knots[state.knots.length - 1];
  while (last.d < state.distance + 1600) {
    const span = 210 + state.rng() * 170;
    const d = last.d + span;
    const gap = caveGap(d, "random");
    const margin = 32;
    const minCenter = margin + gap / 2;
    const maxCenter = RUN_H - margin - gap / 2;
    const harsh = state.rng() < 0.35;
    const swing = Math.min(maxCenter - minCenter, (harsh ? 130 : 70) + d * 0.0025);
    let center = last.center + (state.rng() * 2 - 1) * swing;
    const maxStep = span * 0.34;
    center = last.center + Math.max(-maxStep, Math.min(maxStep, center - last.center));
    center = Math.max(minCenter, Math.min(maxCenter, center));
    state.knots.push({ d, center });
    last = state.knots[state.knots.length - 1];
  }
  while (state.knots.length > 3 && state.knots[1].d < state.distance - 500) {
    state.knots.shift();
  }
}

export function caveWalls(distance, cave) {
  const mode = caveMode(cave?.mode);
  const gap = caveGap(distance, mode);
  const margin = 32;
  const minCenter = margin + gap / 2;
  const maxCenter = RUN_H - margin - gap / 2;
  const raw = mode === "random" ? centerAt(cave?.knots, distance) : sineCenter(distance, gap);
  const center = Math.max(minCenter, Math.min(maxCenter, raw));
  return { top: center - gap / 2, bottom: center + gap / 2, gap };
}

export function caveHits(y, distance, cave) {
  const r = CAVE.radius;
  for (const ahead of [-r, 0, r]) {
    const wall = caveWalls(distance + ahead, cave);
    if (y - r < wall.top || y + r > wall.bottom) return true;
  }
  return false;
}

export function createCave(mode = "normal", seed = 1) {
  const safe = caveMode(mode);
  const state = {
    kind: "cave",
    mode: safe,
    alive: true,
    reason: "",
    distance: 0,
    score: 0,
    speed: CAVE.startSpeed,
    bestSpeed: CAVE.startSpeed,
    y: RUN_H / 2,
    vy: 0,
    elapsed: 0,
    jumps: 0,
    seed: seed >>> 0,
    rng: null,
    knots: null,
  };
  if (safe === "random") {
    state.rng = mulberry32(seed);
    state.knots = [{ d: 0, center: RUN_H / 2 }];
    fillCaveKnots(state);
  }
  const wall = caveWalls(0, state);
  state.y = (wall.top + wall.bottom) / 2;
  return state;
}

function stepCaveOnce(state, input, dt) {
  const thrust = input.hold ? CAVE.thrust : 0;
  state.vy += (CAVE.gravity - thrust) * dt;
  state.vy = Math.max(CAVE.maxRise, Math.min(CAVE.maxFall, state.vy));
  state.y += state.vy * dt;
  state.speed = Math.min(CAVE.maxSpeed, CAVE.startSpeed + state.distance * CAVE.accel);
  if (state.speed > state.bestSpeed) state.bestSpeed = state.speed;
  state.distance += state.speed * dt;
  state.elapsed += dt;
  if (state.mode === "random") fillCaveKnots(state);
  if (caveHits(state.y, state.distance, state)) {
    state.alive = false;
    state.reason = "rock";
  }
}

export function stepCave(state, input, dt) {
  if (!state.alive) return state;
  const { total, count, h } = slices(dt);
  if (total === 0) {
    state.score = Math.floor(state.distance);
    return state;
  }
  for (let i = 0; i < count; i += 1) {
    stepCaveOnce(state, input, h);
    if (!state.alive) break;
  }
  state.score = Math.floor(state.distance);
  return state;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function roofShape(distance) {
  return {
    gap: Math.min(104, 56 + distance * 0.007),
    width: Math.max(146, 280 - distance * 0.01),
    swing: Math.min(52, 28 + distance * 0.002),
  };
}

function fillRoofs(state) {
  let last = state.platforms[state.platforms.length - 1];
  while (last.x + last.w < state.x + 1200) {
    const along = Math.max(0, last.x);
    const shape = roofShape(along);
    const swing = (state.rng() * 2 - 1) * shape.swing;
    const y = Math.max(320, Math.min(560, last.y + swing));
    const next = {
      x: last.x + last.w + shape.gap,
      w: shape.width,
      y,
    };
    state.platforms.push(next);
    last = next;
  }
  const keep = state.x - 500;
  while (state.platforms.length > 6 && state.platforms[0].x + state.platforms[0].w < keep) {
    state.platforms.shift();
  }
}

export function createRoof(seed = 1) {
  const state = {
    kind: "roof",
    alive: true,
    reason: "",
    seed: seed >>> 0,
    rng: mulberry32(seed),
    x: 90,
    y: 500,
    vy: 0,
    grounded: true,
    coyote: ROOF.coyote,
    jumps: 0,
    distance: 0,
    score: 0,
    speed: ROOF.startSpeed,
    bestSpeed: ROOF.startSpeed,
    elapsed: 0,
    platforms: [{ x: -80, w: 1200, y: 500 }],
  };
  fillRoofs(state);
  return state;
}

function support(state) {
  let best = null;
  for (const platform of state.platforms) {
    if (state.x < platform.x + ROOF.foot || state.x > platform.x + platform.w - ROOF.foot) {
      continue;
    }
    if (state.y >= platform.y - 0.5 && state.y <= platform.y + 22) {
      if (!best || platform.y < best.y) best = platform;
    }
  }
  return best;
}

function hitsRoofFace(state, prevX, prevY) {
  for (const platform of state.platforms) {
    if (prevX >= platform.x || state.x < platform.x) continue;
    if (prevY <= platform.y + 2) continue;
    if (state.y - ROOF.height < RUN_H) return true;
  }
  return false;
}

function stepRoofOnce(state, input, dt) {
  const prevX = state.x;
  const prevY = state.y;
  state.speed = Math.min(ROOF.maxSpeed, ROOF.startSpeed + state.distance * ROOF.accel);
  if (state.speed > state.bestSpeed) state.bestSpeed = state.speed;

  if (state.grounded) {
    state.vy = 0;
    state.coyote = ROOF.coyote;
  } else {
    state.vy = Math.min(ROOF.maxFall, state.vy + ROOF.gravity * dt);
    state.coyote = Math.max(0, state.coyote - dt);
  }

  if (input.pressed && (state.grounded || state.coyote > 0)) {
    state.vy = ROOF.jump;
    state.grounded = false;
    state.coyote = 0;
    state.jumps += 1;
  }

  state.x += state.speed * dt;
  state.y += state.vy * dt;
  state.distance += state.speed * dt;
  state.elapsed += dt;

  if (hitsRoofFace(state, prevX, prevY)) {
    state.alive = false;
    state.reason = "wall";
    state.y = prevY;
    return;
  }

  const pad = support(state);
  if (pad && state.vy >= 0 && prevY <= pad.y + 1) {
    state.y = pad.y;
    state.vy = 0;
    state.grounded = true;
    state.coyote = ROOF.coyote;
  } else if (state.grounded) {
    state.grounded = false;
  }

  if (state.y > RUN_H + 60) {
    state.alive = false;
    state.reason = "gap";
  }

  fillRoofs(state);
}

export function stepRoof(state, input, dt) {
  if (!state.alive) return state;
  const { total, count, h } = slices(dt);
  if (total === 0) {
    state.score = Math.floor(state.distance);
    return state;
  }
  for (let i = 0; i < count; i += 1) {
    stepRoofOnce(state, { pressed: i === 0 && Boolean(input.pressed) }, h);
    if (!state.alive) break;
  }
  state.score = Math.floor(state.distance);
  return state;
}

export function platformUnder(state) {
  return support(state);
}
