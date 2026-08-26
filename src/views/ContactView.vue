<template>
  <main>
    <h1>{{ t("contact.title") }}</h1>

    <section class="contact-layout">
      <div class="contact-info">
        <p class="intro">
          {{ t("contact.intro") }}
        </p>

        <h2>{{ t("contact.find") }}</h2>

        <ul>
          <li>
            <a href="mailto:eireball@proton.me">email</a>
          </li>
          <li>
            <a href="https://discord.com/users/1177928523005038613" target="_blank" rel="noreferrer"
              >discord</a
            >
          </li>
          <li>
            <a href="https://dsc.gg/pissedoff" target="_blank" rel="noreferrer"
              >{{ t("contact.server") }}</a
            >
          </li>
          <li>
            <a href="https://github.com/eireq" target="_blank" rel="noreferrer"
              >github</a
            >
          </li>
          <li>
            <a
              href="https://www.youtube.com/@%E3%81%84%E4%B8%A8"
              target="_blank"
              rel="noreferrer"
              >youtube</a
            >
          </li>
        </ul>

        <p>{{ t("contact.username") }} <strong>eireq</strong>.</p>
      </div>

      <form class="contact-form" @submit.prevent="sendMessage">
        <h2>{{ t("contact.send") }}</h2>

        <label for="name">{{ t("contact.name") }}</label>
        <input id="name" v-model="name" type="text" required />

        <label for="email">{{ t("contact.email") }}</label>
        <input id="email" v-model="email" type="email" required />

        <label for="message">{{ t("contact.message") }}</label>
        <textarea id="message" v-model="message" rows="7" required></textarea>

        <button type="submit">{{ t("contact.openDraft") }}</button>

        <p v-if="formStatus" class="form-status" role="status">
          {{ formStatus }}
        </p>
      </form>
    </section>
  </main>
</template>

<script setup>
import { ref } from "vue";
import { useI18n } from "../i18n.js";

const name = ref("");
const email = ref("");
const message = ref("");
const formStatus = ref("");
const { t } = useI18n();

function sendMessage() {
  const subject = `Website contact from ${name.value}`;
  const body = `Name: ${name.value}\nEmail: ${email.value}\n\n${message.value}`;
  const mailto = `mailto:eireball@proton.me?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  window.location.href = mailto;
  formStatus.value = t("contact.status");
}
</script>

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
  margin: 0 0 55px;
  letter-spacing: -4px;
}

.contact-layout {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
  gap: 70px;
}

.intro,
.contact-info p,
.contact-info li {
  color: #ccc;
  font-size: 18px;
  line-height: 1.75;
}

.intro {
  margin: 0 0 35px;
}

h2 {
  font-size: 26px;
  margin: 0 0 20px;
  letter-spacing: -1px;
}

ul {
  padding-left: 25px;
  margin: 0 0 30px;
}

.contact-info a {
  color: #fff;
}

.contact-info p {
  margin: 0;
}

.contact-form {
  display: flex;
  flex-direction: column;
  padding: 28px;
  border: 1px solid #222;
}

.contact-form label {
  margin: 0 0 8px;
  color: #aaa;
  font-size: 14px;
}

.contact-form input,
.contact-form textarea {
  width: 100%;
  margin: 0 0 20px;
  padding: 12px;
  border: 1px solid #333;
  border-radius: 0;
  background: #000;
  color: #fff;
  font: inherit;
}

.contact-form input:focus,
.contact-form textarea:focus {
  outline: 1px solid #fff;
  border-color: #fff;
}

.contact-form textarea {
  resize: vertical;
}

.contact-form button {
  align-self: flex-start;
  padding: 12px 20px;
  border: 1px solid #fff;
  background: transparent;
  color: #fff;
  font: inherit;
  font-size: 15px;
  cursor: pointer;
  transition: 0.2s;
}

.contact-form button:hover {
  background: #000;
  color: #fff;
}

.form-status {
  margin: 18px 0 0;
  color: #aaa;
  font-size: 14px;
}

@media (max-width: 800px) {
  main {
    padding: 60px 25px;
  }

  .contact-layout {
    grid-template-columns: 1fr;
    gap: 45px;
  }
}
</style>
