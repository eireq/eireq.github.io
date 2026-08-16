<template>
  <main>
    <h1>games.</h1>

    <p class="intro">
      a collection of games i've made. mostly small projects, experiments,
      and things i thought would be funny to make.
    </p>

    <section class="games">
      <router-link class="game" to="/games/racing">
        <h2>racing</h2>
        <p>
          lane changing game. with leaderboards!!
        </p>
      </router-link>

      <router-link class="game" to="/games/flagquiz">
        <h2>flag quiz</h2>
        <p>
          identify flags from around the world. how many can you get right?
        </p>
      </router-link>

      <a class="game" href="#">
        <h2>another game</h2>
        <p>
          describe what the game is about here.
        </p>
      </a>

      <a class="game" href="#">
        <h2>another game</h2>
        <p>
          describe the game here.
        </p>
      </a>
    </section>
  </main>
</template>

<style scoped>
main {
  flex: 1;
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  padding: 80px 30px;
}

h1 {
  font-size: clamp(50px, 8vw, 80px);
  line-height: 0.95;
  margin: 0 0 20px;
  letter-spacing: -4px;
}

.intro {
  color: #888;
  font-size: 18px;
  line-height: 1.6;
  margin-bottom: 55px;
  max-width: 650px;
}

.games {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
}

.game {
  display: block;
  padding: 28px;
  border: 1px solid #222;
  color: #fff;
  text-decoration: none;
  transition: 0.2s;
  min-height: 180px;
}

.game:hover {
  border-color: #fff;
  transform: translateY(-3px);
}

.game h2 {
  margin: 0 0 12px;
  font-size: 24px;
}

.game p {
  margin: 0;
  color: #888;
  font-size: 16px;
  line-height: 1.6;
}

@media (max-width: 800px) {
  .games {
    grid-template-columns: 1fr;
  }

  main {
    padding: 60px 25px;
  }
}
</style>
