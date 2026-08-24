export function createGame() {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const W = canvas.width;
  const H = canvas.height;

  const lanes = 4;
  const roadLeft = 72;
  const roadRight = 408;
  const laneWidth = (roadRight - roadLeft) / lanes;

  let raf = 0;

  const state = {
    running: false,
    paused: false,
    lastTime: 0,
    roadOffset: 0,
    spawnTimer: 0,
    spawnEvery: 1.05,
    elapsed: 0,
    trafficWave: 0,
    waveRemaining: 0,
    waveAnnouncement: 0,
    speed: 180,
    maxSpeed: 520,
    distance: 0,
    overtakes: 0,
    score: 0,
    bestSpeed: 0,
    difficulty: 0,
    player: {
      lane: 1,
      x: 0,
      targetX: 0,
      y: 585,
      width: 42,
      height: 72,
      tilt: 0,
    },
    traffic: [],
    particles: [],
    scenery: [],
  };

  function laneX(lane) {
    return roadLeft + laneWidth * lane + laneWidth / 2;
  }

  function reset() {
    state.running = true;
    state.paused = false;
    state.lastTime = performance.now();
    state.roadOffset = 0;
    state.spawnTimer = 0.2;
    state.spawnEvery = 1.05;
    state.elapsed = 0;
    state.trafficWave = 0;
    state.waveRemaining = 0;
    state.waveAnnouncement = 0;
    state.speed = 180;
    state.distance = 0;
    state.overtakes = 0;
    state.score = 0;
    state.bestSpeed = 0;
    state.difficulty = 0;
    state.traffic = [];
    state.particles = [];
    state.scenery = [];
    state.player.lane = 1;
    state.player.x = laneX(1);
    state.player.targetX = state.player.x;
    state.player.tilt = 0;

    for (let i = 0; i < 10; i++) {
      state.scenery.push({
        y: Math.random() * H,
        side: Math.random() < 0.5 ? "left" : "right",
        type: Math.random() < 0.55 ? "tree" : "sign",
      });
    }
  }

  function start(mode) {
    reset();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
  }

  function changeLane(dir) {
    if (!state.running || state.paused) return;
    const old = state.player.lane;
    state.player.lane = Math.max(0, Math.min(lanes - 1, old + dir));
    if (old !== state.player.lane) {
      state.player.targetX = laneX(state.player.lane);
      state.player.tilt = dir * 0.18;
      window.audio.click();
    }
  }

  function spawnTraffic() {
    const occupied = new Set();
    for (const car of state.traffic) {
      if (car.y < 220) occupied.add(car.lane);
    }

    const choices = Array.from({ length: lanes }, (_, i) => i).filter(
      (l) => !occupied.has(l),
    );
    if (!choices.length) return;

    const lane = choices[Math.floor(Math.random() * choices.length)];
    const colors = ["#ef4545", "#ffd84a", "#6ce3ff", "#b875ff", "#f4f4e8"];
    state.traffic.push({
      lane,
      x: laneX(lane),
      y: -100,
      width: 42,
      height: 72,
      speed: 60 + Math.random() * 90,
      color: colors[Math.floor(Math.random() * colors.length)],
      passed: false,
    });
  }

  function addCrashParticles(x, y) {
    for (let i = 0; i < 30; i++) {
      state.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 260,
        vy: (Math.random() - 0.7) * 300,
        life: 0.5 + Math.random() * 0.7,
        size: 3 + Math.floor(Math.random() * 5),
      });
    }
  }

  function rectHit(a, b) {
    return (
      Math.abs(a.x - b.x) < (a.width + b.width) * 0.39 &&
      Math.abs(a.y - b.y) < (a.height + b.height) * 0.38
    );
  }

  function crash(title = "you crashed") {
    if (!state.running) return;
    state.running = false;
    addCrashParticles(state.player.x, state.player.y);
    window.ui.gameOver({
      title,
      score: state.score,
      distance: state.distance,
      overtakes: state.overtakes,
      bestSpeed: state.bestSpeed,
    });
  }

  function update(dt) {
    state.elapsed += dt;
    state.waveRemaining = Math.max(0, state.waveRemaining - dt);
    state.waveAnnouncement = Math.max(0, state.waveAnnouncement - dt);

    const nextWave = Math.floor(state.elapsed / 60);
    if (nextWave > state.trafficWave) {
      state.trafficWave = nextWave;
      state.waveRemaining = 25;
      state.waveAnnouncement = 3.5;
    }

    state.difficulty = Math.min(1, state.distance / 5000);

    state.speed = Math.min(state.maxSpeed, state.speed + 13 * dt);
    state.bestSpeed = Math.max(state.bestSpeed, state.speed);

    state.distance += state.speed * dt * 0.075;
    state.score = Math.floor(
      state.distance * 10 + state.overtakes * 125 + state.bestSpeed * 0.35,
    );

    state.roadOffset = (state.roadOffset + state.speed * dt) % 64;

    const waveTraffic = state.waveRemaining > 0;
    state.spawnEvery = Math.max(
      0.34,
      1.05 -
        state.difficulty * 0.25 -
        state.trafficWave * 0.08 -
        (waveTraffic ? 0.22 : 0),
    );
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      spawnTraffic();
      if (waveTraffic) spawnTraffic();
      state.spawnTimer = state.spawnEvery * (0.75 + Math.random() * 0.55);
    }

    state.player.x +=
      (state.player.targetX - state.player.x) * Math.min(1, dt * 15);
    state.player.tilt *= Math.max(0, 1 - dt * 7);

    for (const car of state.traffic) {
      car.y += (state.speed - car.speed) * dt;

      if (!car.passed && car.y > state.player.y + 45) {
        car.passed = true;
        state.overtakes++;
      }

      if (rectHit(state.player, car)) {
        crash("traffic says hello");
        return;
      }
    }

    state.traffic = state.traffic.filter((car) => car.y < H + 120);

    for (const s of state.scenery) {
      s.y += state.speed * dt;
      if (s.y > H + 40) {
        s.y = -Math.random() * 100;
        s.side = Math.random() < 0.5 ? "left" : "right";
      }
    }

    for (const p of state.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 500 * dt;
      p.life -= dt;
    }
    state.particles = state.particles.filter((p) => p.life > 0);

    window.ui.updateHud(state);
  }

  function drawPixelCar(x, y, color, player = false) {
    const w = 42,
      h = 72;
    ctx.save();
    ctx.translate(x, y);
    if (player) ctx.rotate(state.player.tilt);

    ctx.fillStyle = "#0b0c10";
    ctx.fillRect(-w / 2 + 4, -h / 2 + 4, w - 8, h - 2);

    ctx.fillStyle = color;
    ctx.fillRect(-w / 2 + 8, -h / 2, w - 16, h);
    ctx.fillRect(-w / 2 + 3, -h / 2 + 17, w - 6, 34);

    ctx.fillStyle = "#9de7ff";
    ctx.fillRect(-w / 2 + 10, -h / 2 + 8, w - 20, 16);

    ctx.fillStyle = "#202733";
    ctx.fillRect(-w / 2 + 11, -h / 2 + 11, w - 22, 9);

    ctx.fillStyle = "#f4f4e8";
    ctx.fillRect(-w / 2 + 4, -h / 2 + 54, 7, 9);
    ctx.fillRect(w / 2 - 11, -h / 2 + 54, 7, 9);

    ctx.fillStyle = "#111";
    ctx.fillRect(-w / 2, -h / 2 + 15, 5, 17);
    ctx.fillRect(w / 2 - 5, -h / 2 + 15, 5, 17);
    ctx.fillRect(-w / 2, h / 2 - 31, 5, 17);
    ctx.fillRect(w / 2 - 5, h / 2 - 31, 5, 17);

    if (player) {
      ctx.fillStyle = "#ffd84a";
      ctx.fillRect(-4, -h / 2 + 2, 8, 6);
      ctx.fillRect(-4, h / 2 - 8, 8, 6);
    }
    ctx.restore();
  }

  function drawBackground() {
    ctx.fillStyle = "#42b9ff";
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "#d9f5ff";
    for (const x of [42, 290, 400]) {
      const y = 80 + (x % 3) * 20;
      ctx.fillRect(x, y, 55, 9);
      ctx.fillRect(x + 12, y - 9, 35, 9);
    }

    ctx.fillStyle = "#4caf50";
    ctx.fillRect(0, 190, roadLeft, H - 190);
    ctx.fillRect(roadRight, 190, W - roadRight, H - 190);

    ctx.fillStyle = "#17191e";
    ctx.fillRect(roadLeft, 0, roadRight - roadLeft, H);

    ctx.fillStyle = "#f4f4e8";
    ctx.fillRect(roadLeft - 5, 0, 5, H);
    ctx.fillRect(roadRight, 0, 5, H);

    ctx.fillStyle = "#f4f4e8";
    for (let lane = 1; lane < lanes; lane++) {
      const x = roadLeft + laneWidth * lane - 2;
      for (let y = -64 + state.roadOffset; y < H; y += 64) {
        ctx.fillRect(x, y, 4, 32);
      }
    }

    for (const s of state.scenery) {
      const x =
        s.side === "left" ? 24 + ((s.y * 13) % 24) : 456 - ((s.y * 11) % 24);

      if (s.type === "tree") {
        ctx.fillStyle = "#754b2a";
        ctx.fillRect(x - 3, s.y, 6, 18);
        ctx.fillStyle = "#176b39";
        ctx.fillRect(x - 11, s.y - 13, 22, 16);
        ctx.fillRect(x - 6, s.y - 22, 12, 9);
      } else {
        ctx.fillStyle = "#ddd";
        ctx.fillRect(x - 2, s.y, 4, 24);
        ctx.fillStyle = "#ffda44";
        ctx.fillRect(x - 10, s.y - 10, 20, 13);
      }
    }
  }

  function draw() {
    drawBackground();

    for (const car of state.traffic) {
      drawPixelCar(car.x, car.y, car.color);
    }

    drawPixelCar(state.player.x, state.player.y, "#3c77ff", true);

    for (const p of state.particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.life > 0.4 ? "#ffd84a" : "#ff4d4d";
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1;

    if (state.waveAnnouncement > 0) {
      const alpha = Math.min(
        1,
        state.waveAnnouncement / 0.35,
        (3.5 - state.waveAnnouncement) / 0.5,
      );
      ctx.fillStyle = `rgba(0, 0, 0, ${0.72 * alpha})`;
      ctx.fillRect(42, 285, W - 84, 118);
      ctx.fillStyle = `rgba(255, 216, 74, ${alpha})`;
      ctx.textAlign = "center";
      ctx.font = "34px 'Press Start 2P'";
      ctx.fillText("TRAFIK!", W / 2, 340);
      ctx.fillStyle = `rgba(244, 244, 232, ${alpha})`;
      ctx.font = "9px 'Press Start 2P'";
      ctx.fillText(`wave ${state.trafficWave}`, W / 2, 372);
    }

    if (state.paused && state.running) {
      ctx.fillStyle = "rgba(0,0,0,.62)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#f4f4e8";
      ctx.textAlign = "center";
      ctx.font = "18px 'Press Start 2P'";
      ctx.fillText("paused", W / 2, H / 2);
      ctx.font = "8px 'Press Start 2P'";
      ctx.fillText("press p to resume", W / 2, H / 2 + 30);
    }
  }

  function loop(time) {
    if (!state.running) {
      draw();
      return;
    }

    const dt = Math.min(0.033, (time - state.lastTime) / 1000);
    state.lastTime = time;

    if (!state.paused) update(dt);
    draw();

    raf = requestAnimationFrame(loop);
  }

  function onKeyDown(e) {
    if (
      ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(e.key)
    )
      e.preventDefault();

    if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") changeLane(-1);
    if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") changeLane(1);
    if (e.key.toLowerCase() === "p")
      state.running && state.paused !== undefined && window.game.togglePause();
  }

  let touchStart = null;
  const swipeThreshold = 35;

  function onTouchStart(e) {
    if (e.touches.length !== 1) {
      touchStart = null;
      return;
    }

    const touch = e.touches[0];
    touchStart = { x: touch.clientX, y: touch.clientY };
  }

  function onTouchEnd(e) {
    if (!touchStart || e.changedTouches.length !== 1) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    touchStart = null;

    if (
      Math.abs(deltaX) < swipeThreshold ||
      Math.abs(deltaX) <= Math.abs(deltaY)
    )
      return;

    changeLane(deltaX > 0 ? 1 : -1);
  }

  function onTouchCancel() {
    touchStart = null;
  }

  window.addEventListener("keydown", onKeyDown);
  canvas.addEventListener("touchstart", onTouchStart, { passive: true });
  canvas.addEventListener("touchend", onTouchEnd, { passive: true });
  canvas.addEventListener("touchcancel", onTouchCancel, { passive: true });

  const api = {
    start,
    changeLane,
    togglePause() {
      if (!state.running) return;
      state.paused = !state.paused;
      state.lastTime = performance.now();
    },
    getState() {
      return { ...state, player: { ...state.player } };
    },
    destroy() {
      state.running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchend", onTouchEnd);
      canvas.removeEventListener("touchcancel", onTouchCancel);
    },
  };

  window.game = api;
  window.renderGamePreview = () => {
    reset();
    state.running = false;
    draw();
  };

  return api;
}
