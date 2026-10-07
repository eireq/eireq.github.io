<template>
  <main class="elections-page">
    <header class="elections-heading">
      <p class="eyebrow">{{ t("elections.eyebrow") }}</p>
      <h1>{{ t("elections.title") }}</h1>
      <p class="intro">{{ t("elections.intro") }}</p>
    </header>

    <section class="elections-results">
      <table class="elections-table">
        <thead>
          <tr>
            <th>{{ t("elections.party") }}</th>
            <th>{{ t("elections.votes") }}</th>
            <th>{{ t("elections.share") }}</th>
            <th>{{ t("elections.seats") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.party">
            <td>{{ row.party }}</td>
            <td>{{ row.votes }}</td>
            <td>{{ row.share }}</td>
            <td>{{ row.seats }}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td><strong>Total</strong></td>
            <td><strong>44</strong></td>
            <td><strong>100%</strong></td>
            <td><strong>11</strong></td>
          </tr>
        </tfoot>
      </table>
    </section>
    <p class="review">{{ t("elections.review") }}</p>
  </main>
</template>

<script setup>
import { useI18n } from "../i18n.js";

const { t } = useI18n();

const rows = [
  { party: "ACT", votes: 11, share: "25.0%", seats: 3 },
  { party: "LAB", votes: 10, share: "22.7%", seats: 2 },
  { party: "UNI", votes: 5, share: "11.4%", seats: 1 },
  { party: "DTL", votes: 9, share: "20.5%", seats: 2 },
  { party: "FLF", votes: 3, share: "6.8%", seats: 1 },
  { party: "NFD", votes: 6, share: "13.6%", seats: 2 },
  { party: "CoK", votes: 0, share: "0.0%", seats: 0 },
];
</script>

<style scoped>
.elections-page {
  display: block;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 70px 30px 90px;
}

.elections-heading {
  margin-bottom: 42px;
}

.eyebrow {
  margin: 0 0 10px;
  color: #888;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

h1 {
  margin: 0;
  color: #04d361;
  font-size: clamp(40px, 7vw, 68px);
  line-height: 1;
  letter-spacing: -3px;
}

.intro,
.review {
  max-width: 640px;
  margin: 18px 0 0;
  color: #9ba1a9;
  line-height: 1.55;
}

.elections-results {
  display: flex;
  justify-content: center;
}

.elections-table {
  width: 100%;
  max-width: 800px;
  border-collapse: collapse;
  background: #202024;
  border: 1px solid #29292e;
}

.elections-table th,
.elections-table td {
  padding: 16px;
  text-align: left;
  border: 1px solid #29292e;
  color: #fff;
}

.elections-table th {
  background: #29292e;
  font-weight: 600;
  color: #04d361;
}

.elections-table tbody tr:hover {
  background: #252529;
}

.elections-table tfoot tr {
  background: #29292e;
  font-weight: 600;
}

.review {
  margin-top: 28px;
  font-size: 14px;
}

@media (max-width: 800px) {
  .elections-page {
    padding: 55px 25px 70px;
  }

  .elections-table th,
  .elections-table td {
    padding: 12px 8px;
    font-size: 14px;
  }
}
</style>
