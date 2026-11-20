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

export function caveWalls(distance) {
  const gap = Math.max(118, 500 - distance * 0.028);
  const margin = 32;
  const travel = Math.max(0, RUN_H - margin * 2 - gap);
  const sharp = Math.min(1.6, Math.max(0, (distance - 3600) / 10000));
  const wobble =
    Math.sin(distance * (0.0022 + sharp * 0.0024)) * 0.7 +
    Math.sin(distance * (0.0048 + sharp * 0.0046) + 1.2) * (0.22 + sharp * 0.18);
  const mix = 0.5 + 0.5 * Math.max(-1, Math.min(1, wobble));
  const top = margin + mix * travel;
  return { top, bottom: top + gap, gap };
}

export function caveHits(y, distance) {
  const r = CAVE.radius;
  for (const ahead of [-r, 0, r]) {
    const wall = caveWalls(distance + ahead);
    if (y - r < wall.top || y + r > wall.bottom) return true;
  }
  return false;
}

export function createCave() {
  const wall = caveWalls(0);
  return {
    kind: "cave",
    alive: true,
    reason: "",
    distance: 0,
    score: 0,
    speed: CAVE.startSpeed,
    bestSpeed: CAVE.startSpeed,
    y: (wall.top + wall.bottom) / 2,
    vy: 0,
    elapsed: 0,
    jumps: 0,
  };
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
  if (caveHits(state.y, state.distance)) {
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
