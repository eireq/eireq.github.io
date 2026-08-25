<template>
  <main>
    <h1>art.</h1>

    <p class="intro">
      a collection of art i've made. mostly digital experiments, flag designs,
      and things i thought would be funny to draw.
    </p>

    <section class="art">
      <a class="art-piece" href="#">
        <h2>digital art</h2>
        <p>drawings, experiments, and other digital creations.</p>
      </a>

      <a class="art-piece" href="#">
        <h2>flag designs</h2>
        <p>fictional flags and designs inspired by vexillology.</p>
      </a>

      <a class="art-piece" href="#">
        <h2>more coming soon</h2>
        <p>i'll add more of my art here when i make something worth showing.</p>
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

.art {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
}

.art-piece {
  display: block;
  padding: 28px;
  border: 1px solid #222;
  color: #fff;
  text-decoration: none;
  transition: 0.2s;
  min-height: 180px;
}

.art-piece:hover {
  border-color: #fff;
  transform: translateY(-3px);
}

.art-piece h2 {
  margin: 0 0 12px;
  font-size: 24px;
}

.art-piece p {
  margin: 0;
  color: #888;
  font-size: 16px;
  line-height: 1.6;
}

@media (max-width: 800px) {
  .art {
    grid-template-columns: 1fr;
  }

  main {
    padding: 60px 25px;
  }
}
</style>
