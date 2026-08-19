<template>
  <main>
    <div v-if="!started && !finished" class="setup">
      <h1>flag quiz.</h1>

      <p class="intro">
        how well do you know the world's flags?
        probably not very well. but let's find out.
      </p>

      <div class="form">
        <label for="name">name</label>

        <input
          id="name"
          v-model="playerName"
          type="text"
          maxlength="30"
          placeholder="a guy"
          @keyup.enter="startQuiz"
        >

        <label for="amount">number of flags</label>

        <select id="amount" v-model.number="flagCount">
          <option :value="5">5 flags</option>
          <option :value="10">10 flags</option>
          <option :value="20">20 flags</option>
          <option :value="30">30 flags</option>
          <option :value="50">50 flags</option>
          <option :value="100">100 flags</option>
        </select>

        <button @click="startQuiz">
          start quiz →
        </button>
      </div>
    </div>

    <div v-else-if="started && !finished" class="quiz">
      <div class="progress">
        {{ currentIndex + 1 }} / {{ questions.length }}
      </div>

      <div class="flag-container">
        <img
          :src="currentQuestion.flag"
          :alt="'flag of ' + currentQuestion.name"
          class="flag"
        >
      </div>

      <div class="answer">
        <input
          ref="answerInput"
          v-model="answer"
          type="text"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          placeholder="country name..."
          @keyup.enter="submitAnswer"
        >

        <button @click="submitAnswer">
          enter
        </button>
      </div>

      <p class="score">
        score: {{ score }}
      </p>
    </div>

    <div v-else class="results">
      <h1>quiz complete.</h1>

      <p class="final-score">
        {{ score }} / {{ questions.length }}
      </p>

      <p class="percentage">
        {{ percentage }}%
      </p>

      <p class="result-text">
        {{ resultMessage }}
      </p>

      <div class="leaderboard">
        <h2>leaderboard</h2>

        <p v-if="leaderboardLoading" class="leaderboard-placeholder">
            loading leaderboard...
        </p>

        <p v-else-if="leaderboardError" class="leaderboard-placeholder">
            {{ leaderboardError }}
        </p>

        <div v-else-if="leaderboard.length" class="leaderboard-list">
            <div
            v-for="(entry, index) in leaderboard"
            :key="entry.id"
            class="leaderboard-row"
            :class="{ current: entry.id === submittedScoreId }"
            >
            <span class="rank">
                #{{ index + 1 }}
            </span>

            <span class="leaderboard-name">
                {{ entry.name }}
            </span>

            <span class="leaderboard-score">
                {{ entry.score }}/{{ entry.total }}
            </span>
            </div>
        </div>

        <p v-else class="leaderboard-placeholder">
            no scores yet.
         </p>

        <p v-if="playerPosition" class="your-position">
            your position: <strong>#{{ playerPosition }}</strong>
         </p>
        </div>

      <button class="restart" @click="resetQuiz">
        play again →
      </button>
    </div>
  </main>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue'

const playerName = ref('a guy')
const flagCount = ref(10)

const started = ref(false)
const finished = ref(false)

const questions = ref([])
const currentIndex = ref(0)
const answer = ref('')
const score = ref(0)

const answerInput = ref(null)
const leaderboard = ref([])
const playerPosition = ref(null)
const leaderboardLoading = ref(false)
const leaderboardError = ref('')
const scoreSubmitted = ref(false)
const submittedScoreId = ref(null)

const currentQuestion = computed(() => {
  return questions.value[currentIndex.value]
})

const percentage = computed(() => {
  if (!questions.value.length) return 0

  return Math.round(
    (score.value / questions.value.length) * 100
  )
})

const resultMessage = computed(() => {
  if (percentage.value === 100) {
    return 'perfect score. suspicious.'
  }

  if (percentage.value >= 80) {
    return 'pretty good. you may continue existing.'
  }

  if (percentage.value >= 50) {
    return 'not terrible. the flags remain unconvinced.'
  }

  return 'the flags have defeated you.'
})

const countries = [
  { name: 'Afghanistan', code: 'af' },
  { name: 'Albania', code: 'al' },
  { name: 'Algeria', code: 'dz' },
  { name: 'Andorra', code: 'ad' },
  { name: 'Angola', code: 'ao' },
  { name: 'Antigua and Barbuda', code: 'ag' },
  { name: 'Argentina', code: 'ar' },
  { name: 'Armenia', code: 'am' },
  { name: 'Australia', code: 'au' },
  { name: 'Austria', code: 'at' },
  { name: 'Azerbaijan', code: 'az' },
  { name: 'Bahamas', code: 'bs' },
  { name: 'Bahrain', code: 'bh' },
  { name: 'Bangladesh', code: 'bd' },
  { name: 'Barbados', code: 'bb' },
  { name: 'Belarus', code: 'by' },
  { name: 'Belgium', code: 'be' },
  { name: 'Belize', code: 'bz' },
  { name: 'Benin', code: 'bj' },
  { name: 'Bhutan', code: 'bt' },
  { name: 'Bolivia', code: 'bo' },
  { name: 'Bosnia and Herzegovina', code: 'ba' },
  { name: 'Botswana', code: 'bw' },
  { name: 'Brazil', code: 'br' },
  { name: 'Brunei', code: 'bn' },
  { name: 'Bulgaria', code: 'bg' },
  { name: 'Burkina Faso', code: 'bf' },
  { name: 'Burundi', code: 'bi' },
  { name: 'Cambodia', code: 'kh' },
  { name: 'Cameroon', code: 'cm' },
  { name: 'Canada', code: 'ca' },
  { name: 'Cape Verde', code: 'cv' },
  { name: 'Central African Republic', code: 'cf' },
  { name: 'Chad', code: 'td' },
  { name: 'Chile', code: 'cl' },
  { name: 'China', code: 'cn' },
  { name: 'Colombia', code: 'co' },
  { name: 'Comoros', code: 'km' },
  { name: 'Costa Rica', code: 'cr' },
  { name: 'Croatia', code: 'hr' },
  { name: 'Cuba', code: 'cu' },
  { name: 'Cyprus', code: 'cy' },
  { name: 'Czechia', code: 'cz' },
  { name: 'Denmark', code: 'dk' },
  { name: 'Djibouti', code: 'dj' },
  { name: 'Dominica', code: 'dm' },
  { name: 'Dominican Republic', code: 'do' },
  { name: 'Ecuador', code: 'ec' },
  { name: 'Egypt', code: 'eg' },
  { name: 'El Salvador', code: 'sv' },
  { name: 'Equatorial Guinea', code: 'gq' },
  { name: 'Eritrea', code: 'er' },
  { name: 'Estonia', code: 'ee' },
  { name: 'Eswatini', code: 'sz' },
  { name: 'Ethiopia', code: 'et' },
  { name: 'Fiji', code: 'fj' },
  { name: 'Finland', code: 'fi' },
  { name: 'France', code: 'fr' },
  { name: 'Gabon', code: 'ga' },
  { name: 'Gambia', code: 'gm' },
  { name: 'Georgia', code: 'ge' },
  { name: 'Germany', code: 'de' },
  { name: 'Ghana', code: 'gh' },
  { name: 'Greece', code: 'gr' },
  { name: 'Grenada', code: 'gd' },
  { name: 'Guatemala', code: 'gt' },
  { name: 'Guinea', code: 'gn' },
  { name: 'Guyana', code: 'gy' },
  { name: 'Haiti', code: 'ht' },
  { name: 'Honduras', code: 'hn' },
  { name: 'Hungary', code: 'hu' },
  { name: 'Iceland', code: 'is' },
  { name: 'India', code: 'in' },
  { name: 'Indonesia', code: 'id' },
  { name: 'Iran', code: 'ir' },
  { name: 'Iraq', code: 'iq' },
  { name: 'Ireland', code: 'ie' },
  { name: 'Israel', code: 'il' },
  { name: 'Italy', code: 'it' },
  { name: 'Jamaica', code: 'jm' },
  { name: 'Japan', code: 'jp' },
  { name: 'Jordan', code: 'jo' },
  { name: 'Kazakhstan', code: 'kz' },
  { name: 'Kenya', code: 'ke' },
  { name: 'Kiribati', code: 'ki' },
  { name: 'Kuwait', code: 'kw' },
  { name: 'Kyrgyzstan', code: 'kg' },
  { name: 'Laos', code: 'la' },
  { name: 'Latvia', code: 'lv' },
  { name: 'Lebanon', code: 'lb' },
  { name: 'Lesotho', code: 'ls' },
  { name: 'Liberia', code: 'lr' },
  { name: 'Libya', code: 'ly' },
  { name: 'Liechtenstein', code: 'li' },
  { name: 'Lithuania', code: 'lt' },
  { name: 'Luxembourg', code: 'lu' },
  { name: 'Madagascar', code: 'mg' },
  { name: 'Malawi', code: 'mw' },
  { name: 'Malaysia', code: 'my' },
  { name: 'Maldives', code: 'mv' },
  { name: 'Mali', code: 'ml' },
  { name: 'Malta', code: 'mt' },
  { name: 'Marshall Islands', code: 'mh' },
  { name: 'Mauritania', code: 'mr' },
  { name: 'Mauritius', code: 'mu' },
  { name: 'Mexico', code: 'mx' },
  { name: 'Micronesia', code: 'fm' },
  { name: 'Moldova', code: 'md' },
  { name: 'Monaco', code: 'mc' },
  { name: 'Mongolia', code: 'mn' },
  { name: 'Montenegro', code: 'me' },
  { name: 'Morocco', code: 'ma' },
  { name: 'Mozambique', code: 'mz' },
  { name: 'Myanmar', code: 'mm' },
  { name: 'Namibia', code: 'na' },
  { name: 'Nauru', code: 'nr' },
  { name: 'Nepal', code: 'np' },
  { name: 'Netherlands', code: 'nl' },
  { name: 'New Zealand', code: 'nz' },
  { name: 'Nicaragua', code: 'ni' },
  { name: 'Niger', code: 'ne' },
  { name: 'Nigeria', code: 'ng' },
  { name: 'North Korea', code: 'kp' },
  { name: 'North Macedonia', code: 'mk' },
  { name: 'Norway', code: 'no' },
  { name: 'Oman', code: 'om' },
  { name: 'Pakistan', code: 'pk' },
  { name: 'Palau', code: 'pw' },
  { name: 'Palestine', code: 'ps' },
  { name: 'Panama', code: 'pa' },
  { name: 'Papua New Guinea', code: 'pg' },
  { name: 'Paraguay', code: 'py' },
  { name: 'Peru', code: 'pe' },
  { name: 'Philippines', code: 'ph' },
  { name: 'Poland', code: 'pl' },
  { name: 'Portugal', code: 'pt' },
  { name: 'Qatar', code: 'qa' },
  { name: 'Romania', code: 'ro' },
  { name: 'Russia', code: 'ru' },
  { name: 'Rwanda', code: 'rw' },
  { name: 'Saint Kitts and Nevis', code: 'kn' },
  { name: 'Saint Lucia', code: 'lc' },
  { name: 'Saint Vincent and the Grenadines', code: 'vc' },
  { name: 'Samoa', code: 'ws' },
  { name: 'San Marino', code: 'sm' },
  { name: 'Sao Tome and Principe', code: 'st' },
  { name: 'Saudi Arabia', code: 'sa' },
  { name: 'Senegal', code: 'sn' },
  { name: 'Serbia', code: 'rs' },
  { name: 'Seychelles', code: 'sc' },
  { name: 'Sierra Leone', code: 'sl' },
  { name: 'Singapore', code: 'sg' },
  { name: 'Slovakia', code: 'sk' },
  { name: 'Slovenia', code: 'si' },
  { name: 'Solomon Islands', code: 'sb' },
  { name: 'Somalia', code: 'so' },
  { name: 'South Africa', code: 'za' },
  { name: 'South Korea', code: 'kr' },
  { name: 'South Sudan', code: 'ss' },
  { name: 'Spain', code: 'es' },
  { name: 'Sri Lanka', code: 'lk' },
  { name: 'Sudan', code: 'sd' },
  { name: 'Suriname', code: 'sr' },
  { name: 'Sweden', code: 'se' },
  { name: 'Switzerland', code: 'ch' },
  { name: 'Syria', code: 'sy' },
  { name: 'Taiwan', code: 'tw' },
  { name: 'Tajikistan', code: 'tj' },
  { name: 'Tanzania', code: 'tz' },
  { name: 'Thailand', code: 'th' },
  { name: 'Timor-Leste', code: 'tl' },
  { name: 'Togo', code: 'tg' },
  { name: 'Tonga', code: 'to' },
  { name: 'Trinidad and Tobago', code: 'tt' },
  { name: 'Tunisia', code: 'tn' },
  { name: 'Turkey', code: 'tr' },
  { name: 'Turkmenistan', code: 'tm' },
  { name: 'Tuvalu', code: 'tv' },
  { name: 'Uganda', code: 'ug' },
  { name: 'Ukraine', code: 'ua' },
  { name: 'United Arab Emirates', code: 'ae' },
  { name: 'United Kingdom', code: 'gb' },
  { name: 'United States', code: 'us' },
  { name: 'Uruguay', code: 'uy' },
  { name: 'Uzbekistan', code: 'uz' },
  { name: 'Vanuatu', code: 'vu' },
  { name: 'Vatican City', code: 'va' },
  { name: 'Venezuela', code: 've' },
  { name: 'Vietnam', code: 'vn' },
  { name: 'Yemen', code: 'ye' },
  { name: 'Zambia', code: 'zm' },
  { name: 'Zimbabwe', code: 'zw' }
]

function shuffle(array) {
  const copy = [...array]

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))

    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }

  return copy
}

function normalize(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function startQuiz() {
  if (!playerName.value.trim()) {
    playerName.value = 'a guy'
  }

  const selected = shuffle(countries).slice(0, flagCount.value)

  questions.value = selected.map(country => ({
    ...country,
    flag: `https://flagcdn.com/w640/${country.code}.png`
  }))

  currentIndex.value = 0
  score.value = 0
  answer.value = ''
  started.value = true
  finished.value = false

  nextTick(() => {
    answerInput.value?.focus()
  })
}

function submitAnswer() {
  const userAnswer = normalize(answer.value)
  const correctAnswer = normalize(currentQuestion.value.name)

  if (userAnswer === correctAnswer) {
    score.value++
  }

  answer.value = ''

  if (currentIndex.value >= questions.value.length - 1) {
    finishQuiz()
    return
  }

  currentIndex.value++

  nextTick(() => {
    answerInput.value?.focus()
  })
}

async function finishQuiz() {
  started.value = false
  finished.value = true

  await submitScoreToLeaderboard()
}

async function submitScoreToLeaderboard() {
  leaderboardLoading.value = true
  leaderboardError.value = ''
  scoreSubmitted.value = false

  try {
    if (!window.db?.ready()) {
      leaderboardError.value = 'leaderboard is currently unavailable.'
      return
    }

    const submitResult = await window.db.submitFlagQuizScore(
      {
        name: playerName.value,
        score: score.value
      },
      questions.value.length
    )

    if (!submitResult k) {
      leaderboardError.value = 'could not submit score.'
      console.warn('flag quiz score submission failed:', submitResult.error)
      return
    }

    scoreSubmitted.value = true
    submittedScoreId.value = submitResult.row?.id || null

    const leaderboardResult = await window.db.getFlagQuizLeaderboard(50)

    if (!leaderboardResult.ok) {
      leaderboardError.value = 'could not load leaderboard.'
      console.warn('flag quiz leaderboard failed:', leaderboardResult.error)
      return
    }

    leaderboard.value = leaderboardResult.rows

    const submittedId = submitResult.row?.id

    if (submittedId) {
      const index = leaderboard.value.findIndex(
        row => row.id === submittedId
      )

      if (index !== -1) {
        playerPosition.value = index + 1
      }
    }
  } catch (error) {
    leaderboardError.value = 'something went wrong with the leaderboard.'
    console.warn('flag quiz leaderboard error:', error)
  } finally {
    leaderboardLoading.value = false
  }
}

function resetQuiz() {
  started.value = false
  finished.value = false
  questions.value = []
  currentIndex.value = 0
  answer.value = ''
  score.value = 0
}
</script>

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
  max-width: 650px;
  margin-bottom: 50px;
}

.form {
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form label {
  color: #aaa;
  font-size: 14px;
  margin-top: 12px;
}

input,
select {
  width: 100%;
  padding: 13px 14px;
  background: #000;
  border: 1px solid #333;
  color: #fff;
  font-family: Arial, sans-serif;
  font-size: 16px;
  outline: none;
}

input:focus,
select:focus {
  border-color: #fff;
}

button {
  margin-top: 20px;
  padding: 13px 20px;
  background: #000;
  color: #fff;
  border: 1px solid #fff;
  font-family: Arial, sans-serif;
  font-size: 15px;
  cursor: pointer;
  transition: 0.2s;
}

button:hover {
  background: #fff;
  color: #000;
}

.quiz {
  text-align: center;
  max-width: 800px;
  margin: 0 auto;
}

.progress {
  color: #777;
  font-size: 14px;
  margin-bottom: 30px;
}

.flag-container {
  width: 100%;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 35px;
}

.flag {
  display: block;
  max-width: 100%;
  max-height: 350px;
  width: auto;
  height: auto;
  object-fit: contain;
}

.answer {
  display: flex;
  gap: 10px;
  max-width: 650px;
  margin: 0 auto;
}

.answer input {
  flex: 1;
}

.answer button {
  margin-top: 0;
  min-width: 90px;
}

.score {
  color: #777;
  font-size: 14px;
  margin-top: 25px;
}

.results {
  max-width: 700px;
  margin: 0 auto;
}

.final-score {
  font-size: 60px;
  font-weight: bold;
  margin: 50px 0 5px;
}

.percentage {
  color: #888;
  font-size: 24px;
  margin: 0 0 30px;
}

.result-text {
  color: #aaa;
  font-size: 18px;
  line-height: 1.6;
}

.leaderboard {
  margin-top: 60px;
  border-top: 1px solid #222;
  padding-top: 30px;
}

.leaderboard h2 {
  font-size: 26px;
  margin: 0 0 15px;
}

.leaderboard-placeholder {
  color: #777;
}

.restart {
  margin-top: 30px;
}

@media (max-width: 800px) {
  main {
    padding: 60px 25px;
  }

  .flag-container {
    min-height: 220px;
  }

  .flag {
    max-height: 250px;
  }

  .answer {
    flex-direction: column;
  }

  .answer button {
    width: 100%;
  }
}
</style>