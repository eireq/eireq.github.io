<template>
  <main class="random-country">
    <section class="random-country__hero" aria-labelledby="random-country-title">
      <p class="eyebrow">random country</p>
      <h1 id="random-country-title">pick a place.</h1>
      <p class="intro">
        countries, territories, and historical states. the map is bigger than
        you think.
      </p>

      <div class="random-picker">
        <p class="random-picker__label">your random place</p>
        <output class="random-picker__result" aria-live="polite">
          {{ selectedCountry }}
        </output>
        <button class="random-picker__button" type="button" @click="pickRandom">
          randomize
        </button>
      </div>
    </section>

    <section class="country-list" aria-labelledby="country-list-title">
      <div class="country-list__header">
        <div>
          <p class="eyebrow">the full pool</p>
          <h2 id="country-list-title">{{ countries.length }} entries</h2>
        </div>
        <label class="country-list__search">
          <span>find an entry</span>
          <input
            v-model="searchTerm"
            type="search"
            placeholder="search..."
            autocomplete="off"
          />
        </label>
      </div>

      <p v-if="!filteredCountries.length" class="country-list__empty">
        no places found.
      </p>
      <ol v-else class="country-list__items">
        <li v-for="country in filteredCountries" :key="country">
          {{ country }}
        </li>
      </ol>
    </section>
  </main>
</template>

<script setup>
import { computed, ref } from "vue";

const countries = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola",
  "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria",
  "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus",
  "Belgium", "Belize", "Benin", "Bhutan", "Bolivia",
  "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria",
  "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon",
  "Canada", "Central African Republic", "Chad", "Chile", "China",
  "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba",
  "Cyprus", "Czechia", "DR Congo", "Denmark", "Djibouti", "Dominica",
  "Dominican Republic", "Ecuador", "Egypt", "El Salvador",
  "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia",
  "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany",
  "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau",
  "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India",
  "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy",
  "Ivory Coast", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya",
  "Kiribati", "North Korea", "South Korea", "Kosovo", "Kuwait",
  "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia",
  "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar",
  "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands",
  "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco",
  "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia",
  "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger",
  "Nigeria", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau",
  "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru",
  "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia",
  "Rwanda", "Saint Kitts and Nevis", "Saint Lucia",
  "Saint Vincent and the Grenadines", "Samoa", "San Marino",
  "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles",
  "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands",
  "Somalia", "South Africa", "South Sudan", "Spain", "Sri Lanka", "Sudan",
  "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan",
  "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga",
  "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
  "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom",
  "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City",
  "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe", "Greenland",
  "Faroe Islands", "Puerto Rico", "Guam", "Hong Kong", "Macau", "Bermuda",
  "Gibraltar", "Aruba", "Curacao", "Sint Maarten", "Bonaire", "Saba",
  "Sint Eustatius", "French Guiana", "Martinique", "Guadeloupe", "Reunion",
  "Mayotte", "New Caledonia", "French Polynesia", "Wallis and Futuna",
  "Saint Pierre and Miquelon", "Falkland Islands",
  "South Georgia and the South Sandwich Islands", "Cayman Islands",
  "British Virgin Islands", "US Virgin Islands", "Anguilla", "Montserrat",
  "Turks and Caicos Islands", "Pitcairn Islands", "Tokelau", "Norfolk Island",
  "Christmas Island", "Cocos (Keeling) Islands", "Western Sahara", "Isle of Man",
  "Jersey", "Guernsey", "Svalbard", "Jan Mayen", "Northern Mariana Islands",
  "American Samoa", "Cook Islands", "Niue", "Aland Islands", "Ceuta", "Melilla",
  "Akrotiri", "Dhekelia", "Saint Helena", "Ascension Island", "Tristan da Cunha",
  "Bouvet Island", "Heard Island", "McDonald Islands", "Prussia", "Yugoslavia",
  "Czechoslovakia", "Soviet Union", "East Germany", "West Germany", "Austria-Hungary",
  "Ottoman Empire", "Byzantine Empire", "Holy Roman Empire", "Gran Colombia",
  "Kingdom of Hawaii", "Republic of Texas", "Kingdom of Sardinia",
  "Kingdom of Two Sicilies", "Kingdom of Italy", "Kingdom of Greece", "Qing Empire",
  "Mughal Empire", "Assyria", "Babylonia", "Akkadian Empire", "Sumer",
  "Hittite Empire", "Achaemenid Empire", "Sassanian Empire", "Parthian Empire",
  "Seleucid Empire", "Macedonian Empire", "Roman Republic", "Western Roman Empire",
  "Eastern Roman Empire", "Carthage", "Rhodesia", "South Vietnam", "North Vietnam",
  "Newfoundland Dominion", "Orange Free State", "Transvaal", "Tibet", "Sikkim",
  "Manchukuo", "Hejaz", "Nejd", "United Arab Republic", "Confederate States",
  "Republic of Formosa", "Kingdom of Jerusalem", "Kingdom of Navarra", "Hanover",
  "Burgundy", "Novgorod Republic", "Republic of Ragusa", "Free City of Danzig",
  "Free City of Krakow", "Zulu Kingdom", "Ashanti Empire", "Benin Kingdom",
  "Mali Empire", "Songhai Empire", "Kanem-Bornu", "Kievan Rus", "Golden Horde",
  "Ilkhanate", "Timurid Empire", "Khwarazm", "Delhi Sultanate", "Maratha Empire",
  "Mysore Kingdom", "Joseon", "Goryeo", "Ryukyu Kingdom", "Kingdom of Kongo",
  "Kingdom of Aksum", "Ciskei", "Bophuthatswana", "Venda", "Transkei",
  "Granadine Confederation", "Federal Republic of Central America", "Republic of Texas",
  "Kingdom of Bohemia", "Great Moravia", "First Czechoslovak Republic",
  "Kingdom of Galicia and Lodomeria", "Polish-Lithuanian Commonwealth",
  "Livonian Order", "Teutonic Order", "Republic of Venice", "Genoa", "Papal States",
  "Duchy of Milan", "Kingdom of Aragon", "Crown of Castile", "Kingdom of León",
  "Kingdom of England", "Kingdom of Scotland", "Kingdom of Ireland", "Kingdom of France",
  "First French Empire", "Second French Empire", "Weimar Republic", "German Empire",
  "Inca Empire", "Aztec Empire", "Toltec Empire", "Maya Civilization", "Kingdom of Kush",
  "Numidia", "Kingdom of Lydia", "Etruria", "Nabataea", "Kingdom of Armenia",
  "Bactria", "Scythia", "Kingdom of Burgundy", "Duchy of Normandy",
];

const selectedCountry = ref(randomCountry());
const searchTerm = ref("");

const filteredCountries = computed(() => {
  const query = searchTerm.value.trim().toLowerCase();
  if (!query) return countries;

  return countries.filter((country) => country.toLowerCase().includes(query));
});

function randomCountry() {
  return countries[Math.floor(Math.random() * countries.length)];
}

function pickRandom() {
  let nextCountry = randomCountry();
  while (countries.length > 1 && nextCountry === selectedCountry.value) {
    nextCountry = randomCountry();
  }
  selectedCountry.value = nextCountry;
}
</script>

<style scoped>
.random-country {
  display: block;
  width: 100%;
  max-width: 1120px;
  margin: 0 auto;
  padding: 72px 30px 100px;
  color: #fff;
}

.random-country__hero {
  max-width: 760px;
  margin: 0 auto 82px;
  text-align: center;
}

.eyebrow {
  margin: 0 0 16px;
  color: #f5cf3d;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h1,
h2,
p {
  margin-top: 0;
}

h1 {
  margin-bottom: 22px;
  font-size: clamp(46px, 9vw, 92px);
  line-height: 0.95;
}

h2 {
  margin-bottom: 0;
  font-size: clamp(28px, 5vw, 48px);
  line-height: 1;
}

.intro {
  max-width: 540px;
  margin: 0 auto 38px;
  color: #aaa;
  font-size: 17px;
  line-height: 1.7;
}

.random-picker {
  padding: 28px;
  border: 1px solid #333;
  background: #111;
  box-shadow: 8px 8px 0 #f5cf3d;
}

.random-picker__label {
  margin-bottom: 18px;
  color: #888;
  font-size: 12px;
  text-transform: uppercase;
}

.random-picker__result {
  display: block;
  min-height: 1.1em;
  margin-bottom: 28px;
  color: #f5cf3d;
  font-size: clamp(25px, 5vw, 48px);
  line-height: 1.2;
  overflow-wrap: anywhere;
}

.random-picker__button {
  width: 100%;
  min-height: 52px;
  border: 1px solid #f5cf3d;
  background: #f5cf3d;
  color: #111;
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}

.random-picker__button:hover,
.random-picker__button:focus-visible {
  background: #fff;
}

.country-list {
  border-top: 1px solid #333;
  padding-top: 34px;
}

.country-list__header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 28px;
}

.country-list__search {
  display: grid;
  gap: 9px;
  width: min(300px, 100%);
  color: #888;
  font-size: 11px;
  text-transform: uppercase;
}

.country-list__search input {
  width: 100%;
  min-height: 44px;
  border: 1px solid #444;
  border-radius: 0;
  padding: 10px 12px;
  background: #111;
  color: #fff;
  font: inherit;
  font-size: 13px;
}

.country-list__search input:focus {
  outline: 2px solid #f5cf3d;
  outline-offset: 2px;
}

.country-list__items {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0 26px;
  margin: 0;
  padding-left: 28px;
  color: #aaa;
  line-height: 1.6;
}

.country-list__items li {
  min-width: 0;
  padding: 8px 0 8px 4px;
  border-bottom: 1px solid #1d1d1d;
  overflow-wrap: anywhere;
}

.country-list__empty {
  color: #888;
}

@media (max-width: 700px) {
  .random-country {
    padding: 48px 20px 70px;
  }

  .random-country__hero {
    margin-bottom: 58px;
  }

  .random-picker {
    padding: 22px 18px;
    box-shadow: 5px 5px 0 #f5cf3d;
  }

  .country-list__header {
    display: grid;
    align-items: start;
  }

  .country-list__search {
    width: 100%;
  }

  .country-list__items {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0 16px;
    padding-left: 24px;
    font-size: 13px;
  }
}

@media (max-width: 420px) {
  .country-list__items {
    grid-template-columns: 1fr;
  }
}
</style>
