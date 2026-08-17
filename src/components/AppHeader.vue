<template>
  <nav>
    <router-link class="logo" to="/">eire</router-link>

    <div class="nav-links">
      <router-link to="/me">about me</router-link>
      <router-link to="/rc">random country</router-link>
      <router-link to="/modes">modes.</router-link>
      <router-link to="/games">games</router-link>
    </div>

    <div class="socials">
      <a href="https://github.com/eireq" target="_blank" rel="noreferrer">github</a>
      <a href="https://discord.gg/zwvvbqBFPV" target="_blank" rel="noreferrer">discord</a>
      <a href="https://www.youtube.com/@%E3%81%84%E4%B8%A8" target="_blank" rel="noreferrer">youtube</a>

      <select class="language" aria-label="language">
        <option>en</option>
        <option>sk</option>
      </select>
    </div>
  </nav>
</template>

<style scoped>
nav {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 30px;
  background: #000;
  border-bottom: 1px solid #222;
}

.logo {
  color: #fff;
  text-decoration: none;
  font-weight: bold;
  font-size: 20px;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 24px;
}

.nav-links a {
  color: #aaa;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.2s;
}

.nav-links a:hover,
.nav-links a.router-link-active {
  color: #fff;
}

.socials {
  display: flex;
  align-items: center;
  gap: 12px;
}

.socials a {
  color: #aaa;
  text-decoration: none;
  font-size: 14px;
}

.socials a:hover {
  color: #fff;
}

.language {
  color: #aaa;
  background: #000;
  border: 1px solid #333;
  padding: 6px 8px;
  border-radius: 4px;
}

@media (max-width: 800px) {
  nav {
    flex-wrap: wrap;
    gap: 15px;
  }

  .nav-links {
    order: 3;
    width: 100%;
    overflow-x: auto;
    padding-bottom: 5px;
  }

  .socials {
    margin-left: auto;
  }
}
</style>
