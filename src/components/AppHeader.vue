<template>
  <nav>
    <a class="logo" href="/">eire</a>

    <div class="nav-links">
      <router-link to="/me">{{ t("nav.about") }}</router-link>
      <router-link to="/rc">{{ t("nav.randomCountry") }}</router-link>
      <router-link to="/modes">{{ t("nav.modes") }}</router-link>
      <router-link to="/games">{{ t("nav.games") }}</router-link>
      <router-link to="/art">{{ t("nav.art") }}</router-link>
      <router-link to="/misc">{{ t("nav.misc") }}</router-link>
      <router-link to="/contact">{{ t("nav.contact") }}</router-link>
    </div>

    <div class="socials">
      <a href="https://github.com/eireq" target="_blank" rel="noreferrer"
        >{{ t("nav.github") }}
      </a>
      <a href="https://dsc.gg/pissedoff" target="_blank" rel="noreferrer">{{
        t("nav.discord")
      }}</a>
      <a
        href="https://www.youtube.com/@%E3%81%84%E4%B8%A8"
        target="_blank"
        rel="noreferrer"
        >{{ t("nav.youtube") }}</a
      >

      <select
        class="language"
        :value="language"
        :aria-label="t('nav.language')"
        @change="setLanguage($event.target.value)"
      >
        <optgroup
          v-for="group in languageGroups"
          :key="group.label"
          :label="languageGroupLabel(group)"
        >
          <option
            v-for="item in group.languages"
            :key="item.code"
            :value="item.code"
          >
            {{ languageLabel(item) }} ({{ item.code }})
          </option>
        </optgroup>
      </select>
    </div>
  </nav>
</template>

<script setup>
import { useI18n } from "../i18n.js";

const {
  language,
  languageGroups,
  setLanguage,
  t,
  languageLabel,
  languageGroupLabel,
} = useI18n();
</script>

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
