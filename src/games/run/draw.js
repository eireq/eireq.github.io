import { CAVE, ROOF, RUN_H, RUN_W, caveWalls } from "./logic.js";

export function drawRun(ctx, state, { paused = false } = {}) {
  ctx.imageSmoothingEnabled = false;
  if (state.kind === "roof") drawRoof(ctx, state);
  else drawCave(ctx, state);
  if (paused) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.fillRect(0, 0, RUN_W, RUN_H);
  }
}

function drawCave(ctx, state) {
  ctx.fillStyle = "#1b1230";
  ctx.fillRect(0, 0, RUN_W, RUN_H);

  ctx.fillStyle = "#0c0812";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  for (let x = 0; x <= RUN_W; x += 4) {
    const wall = caveWalls(state.distance + (x - CAVE.playerX), state);
    ctx.lineTo(x, wall.top);
  }
  ctx.lineTo(RUN_W, 0);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(0, RUN_H);
  for (let x = 0; x <= RUN_W; x += 4) {
    const wall = caveWalls(state.distance + (x - CAVE.playerX), state);
    ctx.lineTo(x, wall.bottom);
  }
  ctx.lineTo(RUN_W, RUN_H);
  ctx.closePath();
  ctx.fill();

  ctx.lineWidth = 5;
  ctx.strokeStyle = "#e07a3a";
  strokeCave(ctx, state, "top");
  strokeCave(ctx, state, "bottom");
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#ffd84a";
  strokeCave(ctx, state, "top");
  strokeCave(ctx, state, "bottom");

  drawShip(ctx, CAVE.playerX, state.y, state.hold, state.elapsed);
}

function strokeCave(ctx, state, edge) {
  ctx.beginPath();
  for (let x = 0; x <= RUN_W; x += 4) {
    const wall = caveWalls(state.distance + (x - CAVE.playerX), state);
    const y = edge === "top" ? wall.top : wall.bottom;
    if (x === 0) ctx.moveTo(0, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function drawShip(ctx, x, y, hold, elapsed) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  if (hold) {
    const flicker = Math.round(Math.sin(elapsed * 42) * 3);
    ctx.fillStyle = "#ff4d4d";
    ctx.beginPath();
    ctx.moveTo(-8, -4);
    ctx.lineTo(-20 - flicker, 0);
    ctx.lineTo(-8, 4);
    ctx.fill();
    ctx.fillStyle = "#ffd84a";
    ctx.beginPath();
    ctx.moveTo(-8, -2);
    ctx.lineTo(-14 - flicker, 0);
    ctx.lineTo(-8, 2);
    ctx.fill();
  }
  ctx.fillStyle = "#f4f4e8";
  ctx.beginPath();
  ctx.moveTo(12, 0);
  ctx.lineTo(-10, -9);
  ctx.lineTo(-5, 0);
  ctx.lineTo(-10, 9);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#ff4d4d";
  ctx.fillRect(-2, -3, 5, 6);
  ctx.restore();
}

function drawRoof(ctx, state) {
  const sky = ctx.createLinearGradient(0, 0, 0, RUN_H);
  sky.addColorStop(0, "#1b2348");
  sky.addColorStop(0.45, "#6a3b62");
  sky.addColorStop(1, "#e08a55");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, RUN_W, RUN_H);

  ctx.fillStyle = "#f6f1e4";
  ctx.beginPath();
  ctx.arc(392, 86, 22, 0, Math.PI * 2);
  ctx.fill();

  const camera = state.x - ROOF.playerX;
  for (const platform of state.platforms) {
    drawBuilding(ctx, platform, camera);
  }
  drawRunner(ctx, ROOF.playerX, state.y, state);
}

function drawBuilding(ctx, platform, camera) {
  const x = Math.round(platform.x - camera);
  const y = Math.round(platform.y);
  const w = Math.round(platform.w);
  if (x > RUN_W + 20 || x + w < -20) return;

  ctx.fillStyle = "#241820";
  ctx.fillRect(x, y, w, RUN_H - y);
  ctx.fillStyle = "#f4f4e8";
  ctx.fillRect(x, y, w, 6);
  ctx.fillStyle = "#3a2a32";
  ctx.fillRect(x, y + 6, 4, RUN_H - y);

  ctx.fillStyle = "#ffd84a";
  const seed = Math.floor(platform.x / 10);
  for (let row = y + 18; row < Math.min(RUN_H - 16, y + 280); row += 20) {
    for (let col = x + 10; col < x + w - 12; col += 16) {
      const lit = ((seed + col * 3 + row * 5) & 7) > 2;
      if (!lit) continue;
      ctx.globalAlpha = 0.9;
      ctx.fillRect(col, row, 7, 9);
      ctx.globalAlpha = 1;
    }
  }
}

function drawRunner(ctx, x, y, state) {
  const left = Math.round(x - 8);
  const foot = Math.round(y);
  const stride = state.grounded ? Math.round(Math.sin(state.distance * 0.09) * 4) : 0;

  ctx.fillStyle = "#1a1214";
  ctx.fillRect(left + 4, foot - 48, 12, 14);
  ctx.fillRect(left + 2, foot - 34, 14, 18);
  ctx.fillRect(left + 2, foot - 16, 6, 16 + stride);
  ctx.fillRect(left + 9, foot - 16, 6, 16 - stride);

  ctx.fillStyle = "#f4f4e8";
  ctx.fillRect(left + 5, foot - 46, 10, 11);
  ctx.fillStyle = "#ffd84a";
  ctx.fillRect(left + 3, foot - 32, 12, 14);
  ctx.fillStyle = "#1a1214";
  ctx.fillRect(left + 6, foot - 43, 2, 2);
  ctx.fillRect(left + 11, foot - 43, 2, 2);
}
