<template>
  <main>
    <section class="hero">
      <h1>hey.<br>im eire.</h1>
      <a class="button" href="/me">about me →</a>
    </section>
  </main>
</template>

<style scoped>
main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 30px;
}

.hero {
  width: 100%;
  max-width: 900px;
}

h1 {
  font-size: clamp(55px, 10vw, 110px);
  line-height: 0.95;
  margin: 0 0 35px;
  letter-spacing: -5px;
}

.button {
  display: inline-block;
  padding: 12px 20px;
  border: 1px solid #fff;
  color: #fff;
  text-decoration: none;
  font-size: 15px;
  transition: 0.2s;
}

.button:hover {
  background: #fff;
  color: #000;
}
</style>
