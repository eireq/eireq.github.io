export function createUI() {
  const screens = {
    menu: document.getElementById("menu"),
    game: document.getElementById("game"),
    gameOver: document.getElementById("gameOver"),
    leaderboard: document.getElementById("leaderboard"),
    nameModal: document.getElementById("nameModal"),
  };

  let pendingResult = null;
  let leaderboardPeriod = "global";

  const $ = (id) => document.getElementById(id);

  function show(name) {
    Object.values(screens).forEach((s) => s.classList.remove("active"));
    screens[name].classList.add("active");
  }

  function playerName() {
    return (localStorage.getItem("laneRunnerName") || "").trim() || "a guy";
  }

  function refreshName() {
    $("savedName").textContent = `player: ${playerName()}`;
  }

  function startGame() {
    window.audio.click();
    window.audio.stopMenu();
    window.audio.game();
    show("game");
    window.game.start();
  }

  function saveName(value) {
    const name = value.trim().slice(0, 16);
    localStorage.setItem("laneRunnerName", name || "a guy");
    refreshName();
  }

  async function openLeaderboard(period = leaderboardPeriod) {
    leaderboardPeriod = period;
    show("leaderboard");
    $("globalTab").classList.toggle("active", period === "global");
    $("weeklyTab").classList.toggle("active", period === "weekly");
    $("leaderboardStatus").textContent = "loading...";
    $("scoreList").innerHTML = "";

    const result = await window.db.getScores(period);

    if (!result.ok) {
      $("leaderboardStatus").textContent = window.db.ready()
        ? `database error: ${result.error}`
        : "supabase is not configured yet. add your keys in js/config.js.";
      return;
    }

    $("leaderboardStatus").textContent = result.rows.length
      ? `${period} top 50`
      : "no scores yet. civilization awaits.";
    $("scoreList").innerHTML = result.rows
      .map((row) => {
        const name = escapeHtml(row.name || "a guy");
        const score = Number(row.score || 0).toLocaleString();
        return `<li><span class="score-name">${name}</span><span class="score-number">${score}</span></li>`;
      })
      .join("");
  }

  function escapeHtml(text) {
    return text.replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;",
        })[c],
    );
  }

  function gameOver(result) {
    pendingResult = result;
    window.audio.stopGame();

    $("gameOverTitle").textContent = result.title;
    $("finalScore").textContent = Math.floor(result.score).toLocaleString();
    $("finalDistance").textContent = `${Math.floor(result.distance)} m`;
    $("finalOvertakes").textContent = result.overtakes;
    $("finalSpeed").textContent = Math.floor(result.bestSpeed);

    const hasName = Boolean(localStorage.getItem("laneRunnerName"));
    $("namePrompt").classList.toggle("hidden", hasName);

    if (hasName) {
      submitPendingScore();
    }

    if (!hasName) {
      $("nameInput").value = "";
      $("nameInput").focus();
    }

    show("gameOver");
  }

  function savePendingScore() {
    if (!pendingResult) return;

    const input = $("nameInput");
    saveName(input.value);
    $("namePrompt").classList.add("hidden");
    submitPendingScore();
  }

  async function submitPendingScore() {
    if (!pendingResult) return;
    const result = pendingResult;

    const response = await window.db.submitScore({
      ...result,
      name: playerName(),
    });

    if (!response.ok && window.db.ready()) {
      console.warn("score submission failed:", response.error);
    }

    pendingResult = null;
  }

  function updateHud(state) {
    $("scoreHud").textContent = Math.floor(state.score).toLocaleString();
    $("speedHud").textContent = `${Math.floor(state.speed)} km/h`;
    $("distanceHud").textContent = `${Math.floor(state.distance)} m`;
    $("overtakeHud").textContent = state.overtakes;
  }

  $("startBtn").onclick = startGame;
  $("retryBtn").onclick = () => {
    window.audio.click();
    window.audio.game();
    show("game");
    window.game.start();
  };

  $("menuBtn").onclick = () => {
    window.audio.click();
    window.audio.stopGame();
    show("menu");
    refreshName();
    window.audio.menu();
  };

  $("scoresBtn").onclick = () => {
    window.audio.click();
    openLeaderboard("global");
  };

  $("gameOverScoresBtn").onclick = () => {
    window.audio.click();
    openLeaderboard("global");
  };

  $("closeScoresBtn").onclick = () => {
    window.audio.click();
    show("menu");
    window.audio.menu();
  };

  $("globalTab").onclick = () => openLeaderboard("global");
  $("weeklyTab").onclick = () => openLeaderboard("weekly");

  $("nameBtn").onclick = () => {
    window.audio.click();
    $("menuNameInput").value = localStorage.getItem("laneRunnerName") || "";
    show("nameModal");
    $("menuNameInput").focus();
  };

  $("menuNameSaveBtn").onclick = () => {
    window.audio.click();
    saveName($("menuNameInput").value);
    show("menu");
  };

  $("nameCancelBtn").onclick = () => {
    window.audio.click();
    show("menu");
  };

  $("saveScoreBtn").onclick = savePendingScore;

  $("nameInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") savePendingScore();
  });

  $("menuNameInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      saveName($("menuNameInput").value);
      show("menu");
    }
  });

  refreshName();
  window.audio.menu();

  const ui = {
    show,
    gameOver,
    updateHud,
    playerName,
  };

  window.ui = ui;
  return ui;
}
