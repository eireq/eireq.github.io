<template>
  <div class="jworld-app">
    <div v-if="!session" class="jworld-join">
      <form class="jworld-join-card" @submit.prevent="submitAuth">
        <h1>jWorld</h1>
        <p>
          Private Earth sim. Create an account with the invite code, then sign
          in from any device.
        </p>
        <div class="jworld-auth-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            :class="{ 'is-active': authMode === 'login' }"
            :aria-selected="authMode === 'login'"
            @click="authMode = 'login'"
          >
            Sign in
          </button>
          <button
            type="button"
            role="tab"
            :class="{ 'is-active': authMode === 'register' }"
            :aria-selected="authMode === 'register'"
            @click="authMode = 'register'"
          >
            Register
          </button>
        </div>
        <label v-if="authMode === 'register'">
          Invite code
          <input
            v-model="inviteCode"
            type="password"
            autocomplete="off"
            required
          />
        </label>
        <label>
          Display name
          <input
            v-model="displayName"
            type="text"
            maxlength="40"
            autocomplete="username"
            required
          />
        </label>
        <label>
          Password
          <input
            v-model="password"
            type="password"
            minlength="6"
            autocomplete="current-password"
            required
          />
        </label>
        <button class="jw-btn" type="submit" :disabled="joining">
          {{
            joining
              ? "Please wait…"
              : authMode === "login"
                ? "Sign in"
                : "Create account"
          }}
        </button>
        <p v-if="joinError" class="jw-error">{{ joinError }}</p>
        <p v-if="!configured" class="jw-error">
          Supabase is not configured. Set VITE_SUPABASE_URL and
          VITE_SUPABASE_ANON_KEY.
        </p>
      </form>
    </div>

    <div v-else class="jworld-shell">
      <aside class="jworld-sidebar">
        <header>
          <h1>{{ worldName }}</h1>
          <p>
            Playing as {{ session.displayName
            }}{{ session.isAdmin ? " · admin" : "" }}
          </p>
        </header>
        <div
          v-if="session && session.hasPassword === false"
          class="jworld-password-banner"
        >
          <p>Set a password so you can sign in on other devices.</p>
          <input
            v-model="newPassword"
            type="password"
            minlength="6"
            placeholder="New password (6+)"
            autocomplete="new-password"
          />
          <button
            class="jw-btn"
            type="button"
            :disabled="passwordSaving"
            @click="savePassword"
          >
            {{ passwordSaving ? "Saving…" : "Save password" }}
          </button>
          <p v-if="passwordError" class="jw-error">{{ passwordError }}</p>
        </div>
        <div class="jworld-sidebar-actions">
          <button class="jw-btn" type="button" @click="startCreate">
            Create country
          </button>
          <button class="jw-btn jw-btn--ghost" type="button" @click="leave">
            Sign out
          </button>
        </div>
        <ul class="jworld-country-list">
          <li v-if="!countries.length && !loadError">
            <button type="button" disabled>No countries yet</button>
          </li>
          <li v-for="c in countries" :key="c.id">
            <button
              type="button"
              :class="{ 'is-active': selectedId === c.id }"
              @click="selectCountry(c)"
            >
              {{ c.official_name }}
              <span class="meta">
                {{ c.owner_display_name
                }}{{
                  c.owner_member_id === session.memberId
                    ? " · you"
                    : session.isAdmin
                      ? " · admin edit"
                      : ""
                }}
              </span>
            </button>
          </li>
        </ul>
        <p v-if="loadError" class="jw-error" style="padding: 0 16px 12px">
          {{ loadError }}
        </p>
      </aside>

      <div class="jworld-map-wrap">
        <div ref="mapEl" class="jworld-map" />
        <div class="jworld-map-banner">
          <span v-if="banner" class="jworld-toast">{{ banner }}</span>
          <button
            v-if="selected && canEdit(selected)"
            class="jw-btn jw-btn--ghost"
            type="button"
            @click="editBorders(selected)"
          >
            Edit borders
          </button>
          <button
            v-if="selected && canEdit(selected)"
            class="jw-btn jw-btn--ghost"
            type="button"
            @click="addTerritory(selected)"
          >
            Add territory
          </button>
          <div v-if="selected" class="jw-wiki-spotlight">
            <span class="jw-wiki-arrow jw-wiki-arrow--1" aria-hidden="true"></span>
            <span class="jw-wiki-arrow jw-wiki-arrow--2" aria-hidden="true"></span>
            <span class="jw-wiki-arrow jw-wiki-arrow--3" aria-hidden="true"></span>
            <span class="jw-wiki-arrow jw-wiki-arrow--4" aria-hidden="true"></span>
            <span class="jw-wiki-arrow jw-wiki-arrow--5" aria-hidden="true"></span>
            <button
              class="jw-btn jw-btn--wiki"
              type="button"
              @click="openWiki(selected)"
            >
              Open wiki
            </button>
          </div>
          <button
            v-if="(draftGeometry || editingCountryId) && !addingTerritory"
            class="jw-btn"
            type="button"
            @click="openSavePanel"
          >
            {{ editingCountryId ? "Save borders" : "Name & save" }}
          </button>
        </div>

        <div v-if="showSavePanel" class="jworld-create-panel">
          <h2>{{ editingCountryId ? "Update country" : "New country" }}</h2>
          <p v-if="!editingCountryId" class="jworld-toast" style="margin-bottom: 10px">
            Draw a polygon with the map tools first, then fill this in.
          </p>
          <CountryForm
            :country="formCountry"
            :saving="saving"
            :pending-flag-file="pendingFlag"
            :submit-label="editingCountryId ? 'Save changes' : 'Create country'"
            @flag-change="pendingFlag = $event"
            @submit="saveCountry"
            @cancel="closeSavePanel"
          />
          <p v-if="saveError" class="jw-error">{{ saveError }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import "../jworld/jworld.css";
import CountryForm from "../jworld/CountryForm.vue";
import { createJworldMap, mergeGeometries } from "../jworld/map.js";
import {
  countryToPayload,
  emptyCountryPayload,
} from "../jworld/countryFields.js";
import {
  clearSession,
  loadSession,
  saveSession,
} from "../jworld/session.js";
import {
  createCountry,
  isJworldConfigured,
  joinWorld,
  listCountries,
  loadWorldMeta,
  loginWorld,
  setWorldPassword,
  updateCountry,
  uploadFlag,
} from "../jworld/supabase.js";

const router = useRouter();
const configured = isJworldConfigured();
const session = ref(loadSession());
const authMode = ref("login");
const inviteCode = ref("");
const displayName = ref("");
const password = ref("");
const joining = ref(false);
const joinError = ref("");
const newPassword = ref("");
const passwordSaving = ref(false);
const passwordError = ref("");
const worldName = ref("jWorld");
const countries = ref([]);
const loadError = ref("");
const mapEl = ref(null);
const selectedId = ref(null);
const banner = ref("Click a country or create one with the polygon tool.");
const draftGeometry = ref(null);
const editingCountryId = ref(null);
const addingTerritory = ref(false);
const showSavePanel = ref(false);
const saving = ref(false);
const saveError = ref("");
const pendingFlag = ref(null);
const formSeed = ref(emptyCountryPayload());

let mapApi = null;
let activeDrawer = null;

const selected = computed(
  () => countries.value.find((c) => c.id === selectedId.value) || null,
);

const formCountry = computed(() => {
  if (editingCountryId.value) {
    const existing = countries.value.find((c) => c.id === editingCountryId.value);
    return existing || formSeed.value;
  }
  return formSeed.value;
});

function isMine(country) {
  return session.value && country?.owner_member_id === session.value.memberId;
}

function canEdit(country) {
  return Boolean(session.value?.isAdmin || isMine(country));
}

function applySession(data) {
  saveSession(data);
  session.value = data;
}

async function submitAuth() {
  joining.value = true;
  joinError.value = "";
  const result =
    authMode.value === "login"
      ? await loginWorld(displayName.value, password.value)
      : await joinWorld(inviteCode.value, displayName.value, password.value);
  joining.value = false;
  if (result.error) {
    joinError.value = result.error;
    return;
  }
  applySession(result.data);
  password.value = "";
  await nextTick();
  await bootMap();
}

async function savePassword() {
  if (!session.value) return;
  passwordSaving.value = true;
  passwordError.value = "";
  const { data, error } = await setWorldPassword(
    session.value.token,
    newPassword.value,
  );
  passwordSaving.value = false;
  if (error) {
    passwordError.value = error;
    return;
  }
  applySession(data);
  newPassword.value = "";
}

function leave() {
  clearSession();
  session.value = null;
  addingTerritory.value = false;
  editingCountryId.value = null;
  teardownMap();
}

let bootToken = 0;

async function refreshCountries() {
  const { data, error } = await listCountries(session.value?.token);
  if (error) {
    loadError.value = error;
    return;
  }
  loadError.value = "";
  countries.value = data;
  const stats = mapApi?.setCountries(
    data,
    session.value?.memberId,
    session.value?.isAdmin,
  );
  if (stats && stats.total > 0 && stats.rendered === 0) {
    banner.value = `Loaded ${stats.total} countries but none had drawable borders. Re-save borders on each.`;
  } else if (stats && stats.skipped > 0) {
    banner.value = `Showing ${stats.rendered}/${stats.total} countries (${stats.skipped} missing borders).`;
  }
}

async function bootMap() {
  const myBoot = ++bootToken;
  const meta = await loadWorldMeta();
  if (meta.data?.name) worldName.value = meta.data.name;

  await nextTick();
  if (!mapEl.value || myBoot !== bootToken) return;

  teardownMap();
  if (myBoot !== bootToken) return;

  mapApi = createJworldMap(mapEl.value, {
    onCountryClick: (country) => {
      selectedId.value = country.id;
      banner.value = `${country.official_name} · ${country.owner_display_name}`;
    },
    onDrawCreated: (geometry) => {
      if (addingTerritory.value && editingCountryId.value) {
        commitAddedTerritory(geometry);
        return;
      }
      draftGeometry.value = geometry;
      if (!editingCountryId.value) {
        formSeed.value = emptyCountryPayload();
        showSavePanel.value = true;
        banner.value = "Polygon drawn — name your country and save.";
      } else {
        banner.value = "Borders updated — click Save borders.";
        showSavePanel.value = true;
      }
    },
    onDrawEdited: (geometry) => {
      addingTerritory.value = false;
      draftGeometry.value = geometry;
      banner.value = "Borders edited — save when ready.";
      showSavePanel.value = true;
    },
  });
  mapApi.enableDrawing();
  await refreshCountries();
  if (myBoot !== bootToken) return;
  mapApi.invalidateSize();
  setTimeout(() => {
    if (myBoot === bootToken) mapApi?.invalidateSize();
  }, 200);
}

function teardownMap() {
  if (activeDrawer) {
    try {
      activeDrawer.disable();
    } catch {
      /* ignore */
    }
    activeDrawer = null;
  }
  mapApi?.destroy();
  mapApi = null;
}

function startCreate() {
  editingCountryId.value = null;
  addingTerritory.value = false;
  draftGeometry.value = null;
  pendingFlag.value = null;
  formSeed.value = emptyCountryPayload();
  showSavePanel.value = false;
  banner.value = "Click points to draw a polygon. Double-click / finish to close it.";
  activeDrawer = mapApi?.beginNewCountry() || null;
}

function editBorders(country) {
  if (!canEdit(country)) return;
  editingCountryId.value = country.id;
  addingTerritory.value = false;
  draftGeometry.value = country.geometry;
  pendingFlag.value = null;
  showSavePanel.value = false;
  banner.value =
    "Drag the corner points to reshape the border, then click Save borders.";
  mapApi?.loadCountryIntoDraw(country);
  mapApi?.focusCountry(country);
}

function addTerritory(country) {
  if (!canEdit(country)) return;
  editingCountryId.value = country.id;
  addingTerritory.value = true;
  draftGeometry.value = null;
  pendingFlag.value = null;
  showSavePanel.value = false;
  banner.value =
    "Draw the extra territory (e.g. an island or enclave), then finish the shape to save it.";
  activeDrawer = mapApi?.beginAddTerritory() || null;
}

async function commitAddedTerritory(newPolygon) {
  const country = countries.value.find((c) => c.id === editingCountryId.value);
  if (!session.value || !country) {
    addingTerritory.value = false;
    return;
  }

  saving.value = true;
  saveError.value = "";
  banner.value = "Saving new territory…";

  try {
    const merged = mergeGeometries(country.geometry, newPolygon);
    if (!merged) throw new Error("Could not merge territory geometry.");

    const payload = countryToPayload(country);
    const { error } = await updateCountry(
      session.value.token,
      country.id,
      payload,
      merged,
    );
    if (error) throw new Error(error);

    addingTerritory.value = false;
    editingCountryId.value = null;
    draftGeometry.value = null;
    showSavePanel.value = false;
    mapApi?.clearDraw();
    banner.value = `Added territory to ${country.official_name}.`;
    await refreshCountries();
    mapApi?.focusCountry({ ...country, geometry: merged });
  } catch (err) {
    banner.value = err.message || "Failed to add territory.";
    saveError.value = err.message || "Failed to add territory.";
  } finally {
    saving.value = false;
  }
}

function openWiki(country) {
  router.push({ name: "jworld-country", params: { id: country.id } });
}

function selectCountry(country) {
  selectedId.value = country.id;
  banner.value = `${country.official_name} · ${country.owner_display_name}`;
  mapApi?.focusCountry(country);
}

function openSavePanel() {
  showSavePanel.value = true;
}

function closeSavePanel() {
  showSavePanel.value = false;
  saveError.value = "";
  if (!editingCountryId.value) {
    draftGeometry.value = null;
    mapApi?.clearDraw();
  }
}

async function saveCountry(payload) {
  if (!session.value) return;
  saving.value = true;
  saveError.value = "";

  try {
    const geometry =
      mapApi?.getDrawGeometry() || draftGeometry.value || formCountry.value?.geometry;

    if (!editingCountryId.value && !geometry) {
      saveError.value = "Draw a polygon on the map before saving.";
      saving.value = false;
      return;
    }

    let flagPath = payload.flag_path || null;
    const targetId = editingCountryId.value;

    if (editingCountryId.value) {
      if (pendingFlag.value) {
        const up = await uploadFlag(
          session.value.memberId,
          editingCountryId.value,
          pendingFlag.value,
        );
        if (up.error) throw new Error(up.error);
        flagPath = up.path;
      }

      const { error } = await updateCountry(
        session.value.token,
        editingCountryId.value,
        { ...payload, flag_path: flagPath },
        geometry || null,
      );
      if (error) throw new Error(error);
    } else {
      const { data, error } = await createCountry(
        session.value.token,
        payload.official_name,
        geometry,
        { ...payload, flag_path: null },
      );
      if (error) throw new Error(error);

      if (pendingFlag.value && data?.id) {
        const up = await uploadFlag(
          session.value.memberId,
          data.id,
          pendingFlag.value,
        );
        if (!up.error && up.path) {
          await updateCountry(session.value.token, data.id, {
            ...payload,
            flag_path: up.path,
          });
        }
      }
      selectedId.value = data?.id || selectedId.value;
    }

    pendingFlag.value = null;
    draftGeometry.value = null;
    editingCountryId.value = null;
    showSavePanel.value = false;
    mapApi?.clearDraw();
    banner.value = targetId ? "Borders / country saved." : "Country created.";
    await refreshCountries();
  } catch (err) {
    saveError.value = err.message || "Save failed.";
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  if (session.value) await bootMap();
});

onBeforeUnmount(() => {
  teardownMap();
});
</script>
