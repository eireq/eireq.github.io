<template>
  <div class="lane-runner">
    <main>
      <section id="menu" class="screen active">
        <div class="cabinet">
          <div class="scanlines"></div>
          <p class="eyebrow">8-bit arcade driving</p>
          <h1>lane runner</h1>
          <p class="tagline">change lanes. dodge traffic. don't explode.</p>

          <div class="menu-buttons">
            <button id="startBtn" class="primary">start</button>
            <button id="scoresBtn">leaderboard</button>
            <button id="nameBtn">set name</button>
          </div>

          <div class="mode-row">
            <span>mode</span>
            <button id="normalModeBtn" class="mode active">normal</button>
            <button id="bombModeBtn" class="mode">speed bomb</button>
          </div>

          <p class="hint">arrow keys / wasd to change lanes</p>
          <p id="savedName" class="saved-name"></p>
          <p class="hint"><router-link to="/games">← games</router-link></p>
        </div>
      </section>

      <section id="game" class="screen">
        <canvas id="gameCanvas" width="480" height="720" aria-label="lane runner game"></canvas>

        <div class="hud">
          <div><span>score</span><strong id="scoreHud">0</strong></div>
          <div><span>speed</span><strong id="speedHud">0</strong></div>
          <div><span>distance</span><strong id="distanceHud">0 m</strong></div>
          <div><span>overtakes</span><strong id="overtakeHud">0</strong></div>
        </div>

        <div id="bombHud" class="bomb-hud hidden">
          <span>engine stability</span>
          <div class="bomb-bar"><i id="bombBar"></i></div>
        </div>

        <div id="pauseHint" class="pause-hint">p = pause</div>
      </section>

      <section id="gameOver" class="screen overlay-screen">
        <div class="panel">
          <p class="eyebrow">run over</p>
          <h2 id="gameOverTitle">you crashed</h2>
          <div class="results">
            <div><span>score</span><strong id="finalScore">0</strong></div>
            <div><span>distance</span><strong id="finalDistance">0 m</strong></div>
            <div><span>overtakes</span><strong id="finalOvertakes">0</strong></div>
            <div><span>best speed</span><strong id="finalSpeed">0</strong></div>
          </div>
          <div id="namePrompt" class="name-prompt hidden">
            <label for="nameInput">enter your name</label>
            <input id="nameInput" maxlength="16" autocomplete="nickname" placeholder="a guy">
            <button id="saveScoreBtn" class="primary">save score</button>
          </div>
          <div class="menu-buttons">
            <button id="retryBtn" class="primary">retry</button>
            <button id="menuBtn">menu</button>
            <button id="gameOverScoresBtn">leaderboard</button>
          </div>
        </div>
      </section>

      <section id="leaderboard" class="screen overlay-screen">
        <div class="panel leaderboard-panel">
          <div class="leaderboard-head">
            <div>
              <p class="eyebrow">top 50</p>
              <h2>leaderboard</h2>
            </div>
            <button id="closeScoresBtn">x</button>
          </div>

          <div class="tabs">
            <button id="globalTab" class="active">global</button>
            <button id="weeklyTab">weekly</button>
          </div>

          <div id="leaderboardStatus" class="status">loading...</div>
          <ol id="scoreList"></ol>
        </div>
      </section>

      <section id="nameModal" class="screen overlay-screen">
        <div class="panel small-panel">
          <p class="eyebrow">player setup</p>
          <h2>what should we call you?</h2>
          <input id="menuNameInput" maxlength="16" autocomplete="nickname" placeholder="a guy">
          <button id="menuNameSaveBtn" class="primary">save</button>
          <button id="nameCancelBtn">cancel</button>
        </div>
      </section>
    </main>

    <audio id="menuMusic" loop preload="none"></audio>
    <audio id="gameMusic" loop preload="none"></audio>
    <audio id="clickSound" preload="auto"></audio>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { initRacing } from '@/games/racing/init.js'
import '@/games/racing/style.css'

let destroy = () => {}

onMounted(() => {
  document.body.classList.add('lane-runner-page')
  destroy = initRacing()
})

onUnmounted(() => {
  destroy()
  document.body.classList.remove('lane-runner-page')
})
</script>
