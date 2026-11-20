import test from "node:test";
import assert from "node:assert/strict";
import {
  caveHits,
  caveWalls,
  createCave,
  createRoof,
  stepCave,
  stepRoof,
} from "./logic.js";

function flyCave(seconds, steer) {
  const state = createCave();
  const frames = Math.round(seconds * 60);
  for (let i = 0; i < frames && state.alive; i += 1) {
    stepCave(state, { hold: steer(state) }, 1 / 60);
  }
  return state;
}

function centerHold(state) {
  const wall = caveWalls(state.distance + 70);
  return state.y > (wall.top + wall.bottom) / 2;
}

function frames(step, state, input, seconds) {
  for (let time = 0; time < seconds; time += 1 / 60) step(state, input, 1 / 60);
}

test("holding climbs and letting go drops", () => {
  const up = createCave();
  const start = up.y;
  frames(stepCave, up, { hold: true }, 0.45);
  assert.ok(up.y < start - 40);

  const down = createCave();
  frames(stepCave, down, { hold: false }, 0.45);
  assert.ok(down.y > start + 40);
});

test("the cave starts wide and closes in", () => {
  assert.ok(caveWalls(0).gap > 280);
  assert.ok(caveWalls(6000).gap < caveWalls(0).gap);
  for (const distance of [0, 400, 2000, 8000, 20000]) {
    const wall = caveWalls(distance);
    assert.ok(wall.gap >= 112);
    assert.ok(wall.top >= 30);
    assert.ok(wall.bottom <= 692);
    assert.ok(wall.bottom > wall.top);
  }
});

test("a full hold climbs for over a second before the ceiling", () => {
  const state = createCave();
  frames(stepCave, state, { hold: true }, 1.15);
  assert.equal(state.alive, true);
  assert.ok(state.y < caveWalls(0).top + 80);
  frames(stepCave, state, { hold: true }, 1.4);
  assert.equal(state.alive, false);
  assert.equal(state.reason, "rock");
});

test("flying into the rock ends the run", () => {
  const held = flyCave(3, () => true);
  assert.equal(held.alive, false);
  assert.equal(held.reason, "rock");

  const dropped = flyCave(3, () => false);
  assert.equal(dropped.alive, false);
  assert.equal(dropped.reason, "rock");
});

test("a flyer who aims for the middle survives the opening", () => {
  const state = flyCave(12, centerHold);
  assert.equal(state.alive, true);
  assert.ok(state.score > 1800);
  assert.equal(caveHits(state.y, state.distance), false);
});

test("roof layout is the same for the same seed", () => {
  const a = createRoof(7);
  const b = createRoof(7);
  assert.deepEqual(
    a.platforms.map(({ x, w, y }) => [x, w, y]),
    b.platforms.map(({ x, w, y }) => [x, w, y]),
  );
});

test("standing still on a roof is not a thing, but running the first roof is safe", () => {
  const state = createRoof(1);
  for (let i = 0; i < 60; i += 1) stepRoof(state, { pressed: false }, 1 / 60);
  assert.equal(state.alive, true);
  assert.equal(state.grounded, true);
  assert.ok(state.score > 100);
});

test("one press jumps, and the runner lands back on the opening roof", () => {
  const state = createRoof(1);
  stepRoof(state, { pressed: true }, 1 / 60);
  assert.equal(state.jumps, 1);
  assert.equal(state.grounded, false);
  for (let i = 0; i < 90 && !state.grounded && state.alive; i += 1) {
    stepRoof(state, { pressed: false }, 1 / 60);
  }
  assert.equal(state.alive, true);
  assert.equal(state.grounded, true);
  assert.equal(state.jumps, 1);
});

test("a second press in the air does not jump again", () => {
  const state = createRoof(1);
  stepRoof(state, { pressed: true }, 1 / 30);
  assert.equal(state.jumps, 1);
  assert.equal(state.grounded, false);
  stepRoof(state, { pressed: true }, 1 / 60);
  assert.equal(state.jumps, 1);
});

test("refusing to jump ends the run", () => {
  const state = createRoof(1);
  for (let i = 0; i < 360 && state.alive; i += 1) {
    stepRoof(state, { pressed: false }, 1 / 60);
  }
  assert.equal(state.alive, false);
  assert.ok(state.reason === "gap" || state.reason === "wall");
});

test("a wide gap drops the runner", () => {
  const state = createRoof(1);
  const first = state.platforms[0];
  state.platforms = [
    first,
    { x: first.x + first.w + 420, w: 200, y: 560 },
  ];
  for (let i = 0; i < 300 && state.alive; i += 1) {
    stepRoof(state, { pressed: false }, 1 / 60);
  }
  assert.equal(state.alive, false);
  assert.equal(state.reason, "gap");
});

function roofBot(state, memory) {
  const here = state.platforms.find(
    (platform) => state.x >= platform.x && state.x <= platform.x + platform.w,
  );
  if (!here) return false;
  const lead = here.x + here.w - state.x;
  if (lead > 52) memory.armed = true;
  if (!memory.armed || lead > 38 || lead < 8) return false;
  if (!(state.grounded || state.coyote > 0)) return false;
  memory.armed = false;
  return true;
}

test("jumping near each lip clears a long stretch of roofs", () => {
  for (const seed of [1, 2, 3, 4, 5, 6]) {
    const state = createRoof(seed);
    const memory = { armed: true };
    for (let i = 0; i < 20 * 60 && state.alive; i += 1) {
      const pressed = roofBot(state, memory);
      stepRoof(state, { pressed }, 1 / 60);
    }
    assert.equal(state.alive, true, `seed ${seed} died at ${Math.floor(state.distance)} (${state.reason})`);
    assert.ok(state.jumps > 8, `seed ${seed} only jumped ${state.jumps} times`);
    assert.ok(state.score > 4000, `seed ${seed} score ${state.score}`);
  }
});

test("running into a higher roof ends on the lip", () => {
  const state = createRoof(1);
  state.platforms[1] = {
    x: state.platforms[0].x + state.platforms[0].w + 40,
    w: 200,
    y: state.platforms[0].y - 80,
  };
  for (let i = 0; i < 300 && state.alive; i += 1) {
    stepRoof(state, { pressed: false }, 1 / 60);
  }
  assert.equal(state.alive, false);
  assert.equal(state.reason, "wall");
});
