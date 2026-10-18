<template>
  <div class="jworld-app jworld-country-page">
    <div class="jworld-country-nav">
      <router-link class="jw-btn jw-btn--ghost" :to="{ name: 'jworld' }">
        ← Map
      </router-link>
      <button
        v-if="canEdit && !editing"
        class="jw-btn"
        type="button"
        @click="editing = true"
      >
        Edit country
      </button>
      <TransferOwnership
        v-if="country && session?.isAdmin && !editing"
        :token="session.token"
        :country="country"
        :disabled="saving"
        @transferred="onOwnershipTransferred"
      />
      <button
        v-if="!session"
        class="jw-btn jw-btn--ghost"
        type="button"
        @click="$router.push({ name: 'jworld' })"
      >
        Join to edit
      </button>
    </div>

    <p v-if="loadError" class="jw-error">{{ loadError }}</p>
    <p v-else-if="!country" class="jw-error">Loading…</p>

    <template v-else>
      <div
        v-if="!editing"
        ref="previewEl"
        class="jworld-country-preview"
        aria-label="Country borders"
      />

      <div v-if="editing && canEdit" class="jworld-country-inner jworld-country-inner--stack">
        <CountryForm
          :country="country"
          :geometry="country.geometry"
          :saving="saving"
          :pending-flag-file="pendingFlag"
          :show-delete="true"
          submit-label="Save wiki"
          @flag-change="pendingFlag = $event"
          @submit="saveWiki"
          @delete="removeCountry"
          @cancel="editing = false"
        />
        <p v-if="saveError" class="jw-error">{{ saveError }}</p>
      </div>

      <div v-else class="jworld-country-inner">
        <article class="jworld-wiki">
          <h1>{{ country.official_name }}</h1>
          <p v-if="country.motto" class="motto">“{{ country.motto }}”</p>
          <p v-if="country.common_names" class="lede">
            Also known as {{ country.common_names }}
          </p>
          <p v-if="country.short_description" class="lede">
            {{ country.short_description }}
          </p>
          <p v-if="country.lore" class="lore">{{ country.lore }}</p>

          <section v-if="wikiTerritories.length">
            <h2>Territories</h2>
            <ul class="jw-territory-list">
              <li v-for="(label, index) in wikiTerritories" :key="index">
                {{ label }}
              </li>
            </ul>
          </section>

          <section v-if="hasSection(country.politics, SECTION_FIELDS.politics)">
            <h2>Politics</h2>
            <dl>
              <template
                v-for="field in SECTION_FIELDS.politics"
                :key="field.key"
              >
                <template v-if="country.politics?.[field.key]">
                  <dt>{{ field.label }}</dt>
                  <dd>{{ country.politics[field.key] }}</dd>
                </template>
              </template>
            </dl>
          </section>

          <section
            v-if="hasSection(country.government, SECTION_FIELDS.government)"
          >
            <h2>Government & Society</h2>
            <dl>
              <template
                v-for="field in SECTION_FIELDS.government"
                :key="field.key"
              >
                <template v-if="country.government?.[field.key]">
                  <dt>{{ field.label }}</dt>
                  <dd>{{ country.government[field.key] }}</dd>
                </template>
              </template>
            </dl>
          </section>

          <section
            v-if="hasSection(country.geography, SECTION_FIELDS.geography)"
          >
            <h2>Geography</h2>
            <dl>
              <template
                v-for="field in SECTION_FIELDS.geography"
                :key="field.key"
              >
                <template v-if="country.geography?.[field.key]">
                  <dt>{{ field.label }}</dt>
                  <dd>{{ country.geography[field.key] }}</dd>
                </template>
              </template>
            </dl>
          </section>

          <section v-if="hasSection(country.symbols, SECTION_FIELDS.symbols)">
            <h2>Symbols</h2>
            <dl>
              <template
                v-for="field in SECTION_FIELDS.symbols"
                :key="field.key"
              >
                <template v-if="country.symbols?.[field.key]">
                  <dt>{{ field.label }}</dt>
                  <dd>{{ country.symbols[field.key] }}</dd>
                </template>
              </template>
            </dl>
          </section>

          <p class="lede jw-ruled-by">
            Ruled by {{ country.owner_display_name }}
          </p>
        </article>

        <aside class="jworld-infobox">
          <div class="flag">
            <img
              v-if="flagUrl"
              :src="flagUrl"
              :alt="`Flag of ${country.official_name}`"
            />
            <span v-else class="jw-flag-empty">No flag yet</span>
          </div>
          <div class="title">{{ country.official_name }}</div>
          <table>
            <tbody>
              <template v-for="field in INFOBOX_FIELDS" :key="field.key">
                <tr v-if="country[field.key]">
                  <th>{{ field.label }}</th>
                  <td>{{ country[field.key] }}</td>
                </tr>
              </template>
              <tr v-if="country.religion?.summary">
                <th>Religion</th>
                <td>{{ country.religion.summary }}</td>
              </tr>
            </tbody>
          </table>
        </aside>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import "../jworld/jworld.css";
import { createCountryPreview } from "../jworld/map.js";
import { savableGeometryError } from "../jworld/geometry.js";
import CountryForm from "../jworld/CountryForm.vue";
import TransferOwnership from "../jworld/TransferOwnership.vue";
import {
  INFOBOX_FIELDS,
  SECTION_FIELDS,
} from "../jworld/countryFields.js";
import { withCalculatedArea } from "../jworld/geometryArea.js";
import { loadSession } from "../jworld/session.js";
import {
  deleteCountry,
  flagPublicUrl,
  getCountry,
  deleteReplacedFlag,
  updateCountry,
  uploadFlag,
} from "../jworld/supabase.js";
import {
  formatTerritoryLabel,
  territoryGroups,
} from "../jworld/territories.js";

const route = useRoute();
const router = useRouter();
const session = ref(loadSession());
const country = ref(null);
const loadError = ref("");
const editing = ref(false);
const saving = ref(false);
const saveError = ref("");
const pendingFlag = ref(null);
const previewEl = ref(null);
let previewMap = null;

function destroyPreview() {
  previewMap?.destroy();
  previewMap = null;
}

async function mountPreview() {
  destroyPreview();
  if (editing.value || !country.value?.geometry) return;
  await nextTick();
  if (!previewEl.value) return;
  previewMap = createCountryPreview(previewEl.value, country.value.geometry);
}

const canEdit = computed(
  () =>
    Boolean(session.value) &&
    Boolean(country.value) &&
    (session.value.isAdmin ||
      country.value.owner_member_id === session.value.memberId),
);

const flagUrl = computed(() => flagPublicUrl(country.value?.flag_path));

const wikiTerritories = computed(() => {
  const c = country.value;
  if (!c) return [];
  const groups = territoryGroups(
    c.geometry,
    c.geography?.territories,
    c.official_name,
  );
  const countryName = String(c.official_name || "");
  if (groups.length <= 1) {
    const name = String(groups[0]?.name || "").trim();
    if (!name || name.toLowerCase() === countryName.toLowerCase()) return [];
    return [formatTerritoryLabel(name, countryName)];
  }
  return groups.map((group) =>
    formatTerritoryLabel(group.name, countryName),
  );
});

function hasSection(obj, fields) {
  if (!obj) return false;
  return fields.some((f) => Boolean(obj[f.key]));
}

async function load() {
  loadError.value = "";
  session.value = loadSession();
  if (!session.value?.token) {
    loadError.value = "Join jWorld from the map page to view countries.";
    country.value = null;
    return;
  }
  const { data, error } = await getCountry(session.value.token, route.params.id);
  if (error) {
    loadError.value = error;
    country.value = null;
    return;
  }
  country.value = data;
}

async function saveWiki(payload, geometry = null) {
  if (!session.value || !country.value) return;
  saving.value = true;
  saveError.value = "";
  try {
    const previousFlag = payload.flag_path || country.value.flag_path || null;
    let flagPath = previousFlag;
    if (pendingFlag.value) {
      const up = await uploadFlag(
        session.value.token,
        country.value.id,
        pendingFlag.value,
        session.value.memberId,
      );
      if (up.error) throw new Error(up.error);
      flagPath = up.path;
    }
    const nextGeometry = geometry || country.value.geometry;
    const borderError = savableGeometryError(nextGeometry);
    if (borderError) throw new Error(borderError);
    const areaPayload = withCalculatedArea(
      { ...payload, flag_path: flagPath },
      nextGeometry,
    );
    const { data, error } = await updateCountry(
      session.value.token,
      country.value.id,
      areaPayload,
      geometry,
      country.value.updated_at || null,
    );
    if (error) throw new Error(error);
    if (previousFlag && flagPath && previousFlag !== flagPath) {
      await deleteReplacedFlag(session.value.token, country.value.id, previousFlag);
    }
    country.value = {
      ...country.value,
      ...data,
      owner_display_name: country.value.owner_display_name,
    };
    pendingFlag.value = null;
    editing.value = false;
  } catch (err) {
    saveError.value = err.message || "Save failed.";
  } finally {
    saving.value = false;
  }
}

async function removeCountry() {
  if (!session.value || !country.value) return;
  if (!confirm(`Delete ${country.value.official_name}?`)) return;
  saving.value = true;
  const { error } = await deleteCountry(session.value.token, country.value.id);
  saving.value = false;
  if (error) {
    saveError.value = error;
    return;
  }
  router.push({ name: "jworld" });
}

async function onOwnershipTransferred(result) {
  if (!country.value) return;
  country.value = {
    ...country.value,
    owner_member_id: result?.owner_member_id || country.value.owner_member_id,
    owner_display_name:
      result?.owner_display_name || country.value.owner_display_name,
  };
}

watch(
  () => route.params.id,
  () => {
    editing.value = false;
    destroyPreview();
    load();
  },
);

watch([country, editing], () => {
  if (editing.value || !country.value) destroyPreview();
  else mountPreview();
});

onMounted(load);
onBeforeUnmount(destroyPreview);
</script>
