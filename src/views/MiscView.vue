<template>
  <main>
    <h1>misc.</h1>

    <p class="intro">
      a collection of miscellaneous projects, experiments, and other things
      that do not fit into games or art.
    </p>

    <section class="misc">
      <router-link class="misc-piece" to="/rc">
        <h2>random country</h2>
        <p>generate a random country and discover something new.</p>
      </router-link>

      <a
        class="misc-piece"
        href="https://eireq.github.io/modes"
        target="_blank"
        rel="noreferrer"
      >
        <h2>modes</h2>
        <p>another project from my collection of web experiments.</p>
      </a>

      <a
        class="misc-piece"
        href="https://github.com/eireq"
        target="_blank"
        rel="noreferrer"
      >
        <h2>discord bots</h2>
        <p>small bots and other experiments from my GitHub projects.</p>
      </a>

      <a class="misc-piece" href="#">
        <h2>other stuff</h2>
        <p>more random projects will appear here eventually.</p>
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
  flex-direction: column;
  align-items: stretch;
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

.misc {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
}

.misc-piece {
  display: block;
  padding: 28px;
  border: 1px solid #222;
  color: #fff;
  text-decoration: none;
  transition: 0.2s;
  min-height: 180px;
}

.misc-piece:hover {
  border-color: #fff;
  transform: translateY(-3px);
}

.misc-piece h2 {
  margin: 0 0 12px;
  font-size: 24px;
}

.misc-piece p {
  margin: 0;
  color: #888;
  font-size: 16px;
  line-height: 1.6;
}

@media (max-width: 800px) {
  .misc {
    grid-template-columns: 1fr;
  }

  main {
    padding: 60px 25px;
  }
}
</style>
