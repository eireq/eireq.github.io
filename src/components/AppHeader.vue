<template>
  <nav>
    <router-link class="logo" to="/">eire</router-link>

    <button
      class="menu-toggle"
      type="button"
      :aria-expanded="menuOpen ? 'true' : 'false'"
      aria-controls="site-nav-links"
      @click="menuOpen = !menuOpen"
    >
      {{ menuOpen ? t("nav.close") : t("nav.menu") }}
    </button>

    <div
      id="site-nav-links"
      class="nav-links"
      :class="{ 'nav-links--open': menuOpen }"
    >
      <router-link to="/me" @click="closeMenu">{{ t("nav.about") }}</router-link>
      <router-link to="/games" @click="closeMenu">{{ t("nav.games") }}</router-link>
      <router-link to="/tools" @click="closeMenu">{{ t("nav.tools") }}</router-link>
      <router-link to="/art" @click="closeMenu">{{ t("nav.art") }}</router-link>
      <router-link to="/misc" @click="closeMenu">{{ t("nav.misc") }}</router-link>
      <router-link to="/contact" @click="closeMenu">{{
        t("nav.contact")
      }}</router-link>
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
import { ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "../i18n.js";

const {
  language,
  languageGroups,
  setLanguage,
  t,
  languageLabel,
  languageGroupLabel,
} = useI18n();

const route = useRoute();
const menuOpen = ref(false);

watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false;
  },
);

function closeMenu() {
  menuOpen.value = false;
}
</script>

<style scoped>
nav {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
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

.menu-toggle {
  display: none;
  margin-left: auto;
  padding: 8px 12px;
  border: 1px solid #333;
  background: #000;
  color: #fff;
  font: inherit;
  cursor: pointer;
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
  width: 130px;
  min-width: 0;
  max-width: 130px;
  overflow: hidden;
  color: #aaa;
  background: #000;
  border: 1px solid #333;
  padding: 6px 8px;
  border-radius: 4px;
  text-overflow: ellipsis;
  white-space: normal;
}

.language option {
  white-space: normal;
  overflow-wrap: anywhere;
}

@media (max-width: 900px) {
  nav {
    flex-wrap: wrap;
    padding: 14px 16px;
    gap: 12px;
  }

  .menu-toggle {
    display: inline-flex;
  }

  .nav-links {
    display: none;
    order: 3;
    width: 100%;
    flex-direction: column;
    align-items: stretch;
    gap: 0;
    border-top: 1px solid #222;
  }

  .nav-links--open {
    display: flex;
  }

  .nav-links a {
    padding: 14px 0;
    border-bottom: 1px solid #1a1a1a;
  }

  .socials {
    width: 100%;
    order: 4;
    flex-wrap: wrap;
    justify-content: flex-start;
  }

  .language {
    width: 100%;
    max-width: none;
  }
}
</style>
