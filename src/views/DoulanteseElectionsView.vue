<template>
  <main class="elections-page">
    <header class="elections-heading">
      <h1>Doulantese Elections</h1>
    </header>

    <section class="elections-results">
      <table class="elections-table">
        <thead>
          <tr>
            <th>Party Name</th>
            <th>Votes Cast</th>
            <th>Vote Share</th>
            <th>Congressional Seats</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>ACT</td>
            <td>11 votes</td>
            <td>25.0%</td>
            <td>3 seats</td>
          </tr>
          <tr>
            <td>LAB</td>
            <td>10 votes</td>
            <td>22.7%</td>
            <td>2 seats</td>
          </tr>
          <tr>
            <td>UNI</td>
            <td>5 votes</td>
            <td>11.4%</td>
            <td>1 seat</td>
          </tr>
          <tr>
            <td>DTL</td>
            <td>9 votes</td>
            <td>20.5%</td>
            <td>2 seats</td>
          </tr>
          <tr>
            <td>FLF</td>
            <td>3 votes</td>
            <td>6.8%</td>
            <td>1 seat</td>
          </tr>
          <tr>
            <td>NFD</td>
            <td>6 votes</td>
            <td>13.6%</td>
            <td>2 seats</td>
          </tr>
          <tr>
            <td>CoK</td>
            <td>0 votes</td>
            <td>0.0%</td>
            <td>0 seats</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td><strong>Total</strong></td>
            <td><strong>44 votes</strong></td>
            <td><strong>100%</strong></td>
            <td><strong>11 seats</strong></td>
          </tr>
        </tfoot>
      </table>
    </section>
  </main>
</template>

<script setup></script>

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

h1 {
  margin: 0;
  color: #04d361;
  font-size: clamp(40px, 7vw, 68px);
  line-height: 1;
  letter-spacing: -3px;
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
