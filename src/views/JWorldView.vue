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
          <button
            type="button"
            role="tab"
            :class="{ 'is-active': authMode === 'reset' }"
            :aria-selected="authMode === 'reset'"
            @click="authMode = 'reset'"
          >
            Reset
          </button>
        </div>
        <label v-if="authMode === 'register' || authMode === 'reset'">
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
            :autocomplete="authMode === 'login' ? 'current-password' : 'new-password'"
            required
          />
        </label>
        <button class="jw-btn" type="submit" :disabled="joining">
          {{
            joining
              ? "Please wait…"
              : authMode === "login"
                ? "Sign in"
                : authMode === "reset"
                  ? "Reset password"
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
          <button
            class="jw-btn jw-btn--ghost"
            type="button"
            title="Click inside a real-world outline"
            @click="snapLoading || snapActive ? cancelSnap() : startSnapCreate()"
          >
            {{
              snapLoading
                ? "Cancel loading…"
                : snapActive
                  ? "Cancel snap"
                  : "Snap to shape"
            }}
          </button>
          <p class="jw-beta-note">
            Snap saves the whole country. Click inside the outline. Coastlines are simplified, so drag the handles before saving.
          </p>
          <button class="jw-btn jw-btn--ghost" type="button" @click="leave">
            Sign out
          </button>
        </div>
        <div class="jworld-list-filters" role="group" aria-label="Filter countries">
          <button
            type="button"
            :class="{ 'is-active': listFilter === 'all' }"
            @click="listFilter = 'all'"
          >
            All
          </button>
          <button
            type="button"
            :class="{ 'is-active': listFilter === 'mine' }"
            @click="listFilter = 'mine'"
          >
            Mine
          </button>
          <button
            type="button"
            :class="{ 'is-active': listFilter === 'others' }"
            @click="listFilter = 'others'"
          >
            Others
          </button>
        </div>
        <div class="jworld-country-search">
          <input
            v-model="countrySearch"
            type="search"
            placeholder="Search countries…"
            autocomplete="off"
            aria-label="Search countries"
          />
        </div>
        <ul class="jworld-country-list">
          <li v-if="!countries.length && !loadError">
            <button type="button" disabled>No countries yet</button>
          </li>
          <li v-else-if="!filteredCountries.length">
            <button type="button" disabled>No matches</button>
          </li>
          <li v-for="c in filteredCountries" :key="c.id">
            <button
              type="button"
              :class="{ 'is-active': selectedId === c.id }"
              @click="selectCountry(c)"
            >
              <span class="jw-country-row">
                <span class="jw-country-flag" aria-hidden="true">
                  <img
                    v-if="flagUrl(c)"
                    :src="flagUrl(c)"
                    :alt="''"
                    loading="lazy"
                  />
                </span>
                <span class="jw-country-text">
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
                </span>
              </span>
            </button>
          </li>
        </ul>
        <p v-if="loadError" class="jw-error jw-error--pad">
          {{ loadError }}
        </p>
      </aside>

      <div class="jworld-map-wrap">
        <div ref="mapEl" class="jworld-map" />
        <div class="jworld-map-banner">
          <span v-if="banner" class="jworld-toast">{{ banner }}</span>
          <div class="jworld-map-actions">
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
            <button
              v-if="selected"
              class="jw-btn jw-btn--ghost"
              type="button"
              @click="openWiki(selected)"
            >
              Open wiki
            </button>
            <button
              v-if="(draftGeometry || editingCountryId) && !addingTerritory"
              class="jw-btn"
              type="button"
              @click="openSavePanel"
            >
              {{ editingCountryId ? "Save borders" : "Name & save" }}
            </button>
            <details
              v-if="selected && (canEdit(selected) || session?.isAdmin)"
              class="jworld-more"
            >
              <summary class="jw-btn jw-btn--ghost">More</summary>
              <div class="jworld-more-menu">
                <button
                  v-if="canEdit(selected)"
                  class="jw-btn jw-btn--ghost"
                  type="button"
                  @click="
                    snapLoading || snapActive
                      ? cancelSnap()
                      : snapTerritory(selected)
                  "
                >
                  {{
                    snapLoading
                      ? "Cancel loading…"
                      : snapActive
                        ? "Cancel snap"
                        : "Snap territory"
                  }}
                </button>
                <TransferOwnership
                  v-if="session?.isAdmin"
                  :token="session.token"
                  :country="selected"
                  :disabled="saving"
                  @transferred="onOwnershipTransferred"
                />
              </div>
            </details>
          </div>
        </div>

        <div v-if="showSavePanel" class="jworld-create-panel">
          <h2>{{ editingCountryId ? "Save borders" : "New country" }}</h2>
          <p v-if="!editingCountryId" class="jworld-toast jw-create-hint">
            Name the country and save. The wiki can be filled in afterward.
          </p>
          <button
            v-if="editingCountryId"
            class="jw-btn jw-btn--ghost jw-revert"
            type="button"
            @click="revertBorders"
          >
            Revert borders
          </button>
          <CountryForm
            :country="formCountry"
            :geometry="draftGeometry || formCountry?.geometry || null"
            :saving="saving"
            :pending-flag-file="pendingFlag"
            :variant="editingCountryId ? 'borders' : 'create'"
            :submit-label="editingCountryId ? 'Save borders' : 'Create country'"
            @flag-change="pendingFlag = $event"
            @submit="saveCountry"
            @cancel="closeSavePanel"
          />
          <p v-if="saveError" class="jw-error">{{ saveError }}</p>
        </div>
      </div>
    </div>

    <div
      v-if="territoryPrompt"
      class="jworld-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Name territory"
    >
      <form class="jworld-modal-card" @submit.prevent="confirmTerritoryName">
        <h2>Name this territory</h2>
        <p>
          Shown as “Name ({{ territoryPrompt.countryName }})”.
        </p>
        <label>
          Territory name
          <input
            v-model="territoryNameDraft"
            type="text"
            maxlength="80"
            required
          />
        </label>
        <div class="jw-form-actions">
          <button class="jw-btn" type="submit">Add territory</button>
          <button
            class="jw-btn jw-btn--ghost"
            type="button"
            @click="cancelTerritoryName"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import "../jworld/jworld.css";
import CountryForm from "../jworld/CountryForm.vue";
import TransferOwnership from "../jworld/TransferOwnership.vue";
import { createJworldMap, mergeGeometries } from "../jworld/map.js";
import {
  countryToPayload,
  emptyCountryPayload,
} from "../jworld/countryFields.js";
import { withCalculatedArea } from "../jworld/geometryArea.js";
import { savableGeometryError } from "../jworld/geometry.js";
import {
  clearSession,
  loadSession,
  saveSession,
} from "../jworld/session.js";
import {
  countriesStamp,
  createCountry,
  flagPublicUrl,
  getCountry,
  isJworldConfigured,
  joinWorld,
  listMapCountries,
  loadWorldMeta,
  loginWorld,
  logoutWorld,
  resetWorldPassword,
  setWorldPassword,
  updateCountry,
  uploadFlag,
} from "../jworld/supabase.js";
import {
  syncTerritoryGroups,
  territoryGroups,
  withTerritoryGroups,
  withTerritoryNames,
} from "../jworld/territories.js";

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
const countrySearch = ref("");
const listFilter = ref("all");
const loadError = ref("");
const mapEl = ref(null);
const selectedId = ref(null);
const banner = ref("Click a country or create one with the polygon tool.");
const draftGeometry = ref(null);
const editingCountryId = ref(null);
const addingTerritory = ref(false);
const snapLoading = ref(false);
const snapActive = ref(false);
const showSavePanel = ref(false);
const saving = ref(false);
const saveError = ref("");
const pendingFlag = ref(null);
const formSeed = ref(emptyCountryPayload());
const borderBaseline = ref(null);
const editBaselineUpdatedAt = ref(null);
const territoryPrompt = ref(null);
const territoryNameDraft = ref("");
let territoryNameWait = null;
let pollTimer = null;
let lastStamp = "";
let stampReady = false;

let mapApi = null;
let activeDrawer = null;

const selected = computed(
  () => countries.value.find((c) => c.id === selectedId.value) || null,
);

const filteredCountries = computed(() => {
  const q = countrySearch.value.trim().toLowerCase();
  let list = countries.value || [];
  if (listFilter.value === "mine") list = list.filter((c) => isMine(c));
  else if (listFilter.value === "others") list = list.filter((c) => !isMine(c));
  if (!q) return list;
  return list.filter((c) => {
    const name = String(c.official_name || "").toLowerCase();
    const common = String(c.common_names || "").toLowerCase();
    const owner = String(c.owner_display_name || "").toLowerCase();
    return name.includes(q) || common.includes(q) || owner.includes(q);
  });
});

function flagUrl(country) {
  return flagPublicUrl(country?.flag_path);
}

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
      : authMode.value === "reset"
        ? await resetWorldPassword(
            inviteCode.value,
            displayName.value,
            password.value,
          )
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

async function leave() {
  bootToken += 1;
  stopPolling();
  const token = session.value?.token;
  clearSession();
  session.value = null;
  addingTerritory.value = false;
  snapLoading.value = false;
  snapActive.value = false;
  editingCountryId.value = null;
  borderBaseline.value = null;
  editBaselineUpdatedAt.value = null;
  showSavePanel.value = false;
  teardownMap();
  if (token) await logoutWorld(token);
}

let bootToken = 0;

function sessionExpired(error) {
  return /session expired|invalid session token/i.test(error || "");
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function startPolling() {
  stopPolling();
  stampReady = false;
  lastStamp = "";
  pollTimer = setInterval(() => {
    pollForChanges();
  }, 15000);
}

async function pollForChanges() {
  if (!session.value || saving.value || document.hidden) return;
  const { data, error } = await countriesStamp(session.value.token);
  if (error) {
    if (sessionExpired(error)) {
      joinError.value = error;
      await leave();
    }
    return;
  }
  if (!data) return;
  const stamp = `${data.count}:${data.latest || ""}`;
  if (!stampReady) {
    stampReady = true;
    lastStamp = stamp;
    return;
  }
  if (stamp === lastStamp) return;
  lastStamp = stamp;
  const editingId = editingCountryId.value;
  const result = await refreshCountries();
  if (result?.conflict && editingId && showSavePanel.value) {
    banner.value =
      "Someone else saved this country. Close the panel and edit again before saving over them.";
  } else if (!editingId && !addingTerritory.value && !snapActive.value) {
    banner.value = "Map updated with other players' changes.";
  }
}

async function ensureFullCountry(id) {
  const existing = countries.value.find((c) => c.id === id);
  if (existing && Object.prototype.hasOwnProperty.call(existing, "lore")) {
    return existing;
  }
  const { data, error } = await getCountry(session.value?.token, id);
  if (error) throw new Error(error);
  const idx = countries.value.findIndex((c) => c.id === id);
  if (idx >= 0) {
    const next = countries.value.slice();
    next[idx] = data;
    countries.value = next;
  }
  return data;
}

async function refreshCountries() {
  const { data, error } = await listMapCountries(session.value?.token);
  if (error) {
    if (sessionExpired(error)) {
      joinError.value = error;
      await leave();
      return;
    }
    loadError.value = error;
    return;
  }
  loadError.value = "";
  const editingId = showSavePanel.value ? editingCountryId.value : null;
  const previous = countries.value;
  const baseline = editBaselineUpdatedAt.value;
  let conflict = false;
  countries.value = (data || []).map((row) => {
    if (!editingId || row.id !== editingId) return row;
    if (baseline && row.updated_at && row.updated_at !== baseline) conflict = true;
    const kept = previous.find((c) => c.id === row.id);
    if (kept && Object.prototype.hasOwnProperty.call(kept, "lore")) return kept;
    return row;
  });
  const stats = mapApi?.setCountries(
    countries.value,
    session.value?.memberId,
    session.value?.isAdmin,
  );
  mapApi?.setSelected(selectedId.value);
  if (stats && stats.total > 0 && stats.rendered === 0) {
    banner.value = `Loaded ${stats.total} countries but none had drawable borders. Re-save borders on each.`;
  } else if (stats && stats.skipped > 0) {
    banner.value = `Showing ${stats.rendered}/${stats.total} countries (${stats.skipped} missing borders).`;
  }
  return { conflict };
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
  if (myBoot === bootToken) startPolling();
}

function teardownMap() {
  stopPolling();
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

function cancelSnap() {
  snapLoading.value = false;
  snapActive.value = false;
  mapApi?.endSnapToShape?.();
  banner.value = "Snap cancelled.";
}

function startCreate() {
  editingCountryId.value = null;
  addingTerritory.value = false;
  snapLoading.value = false;
  snapActive.value = false;
  draftGeometry.value = null;
  pendingFlag.value = null;
  formSeed.value = emptyCountryPayload();
  showSavePanel.value = false;
  mapApi?.endSnapToShape?.();
  banner.value =
    "Click points to draw. The yellow/red point is the start — click it again to close.";
  activeDrawer = mapApi?.beginNewCountry() || null;
}

function snapGuard() {
  return {
    onMiss: () => {
      banner.value = "No land there — click inside a yellow country outline.";
    },
    onApproximate: (hit) => {
      banner.value = `That's near ${hit.name}. Click inside the yellow fill so the wrong outline isn't saved.`;
    },
    onLowResolution: () => {
      banner.value =
        "These outlines are too coarse to save as borders. Draw the country yourself.";
    },
  };
}

async function startSnapCreate() {
  editingCountryId.value = null;
  addingTerritory.value = false;
  draftGeometry.value = null;
  pendingFlag.value = null;
  formSeed.value = emptyCountryPayload();
  showSavePanel.value = false;
  snapLoading.value = true;
  snapActive.value = false;
  banner.value = "Loading real-world outlines…";

  try {
    await mapApi?.beginSnapToShape({
      ...snapGuard(),
      onReady: () => {
        snapLoading.value = false;
        snapActive.value = true;
        banner.value =
          "Click inside a yellow outline. The whole country is saved, not one island.";
      },
      onSelect: (hit) => {
        snapLoading.value = false;
        snapActive.value = false;
        editingCountryId.value = null;
        borderBaseline.value = null;
        editBaselineUpdatedAt.value = null;
        draftGeometry.value = hit.geometry;
        const placeName = hit.name || "";
        formSeed.value = withTerritoryNames(
          {
            ...emptyCountryPayload(),
            official_name: placeName,
          },
          [placeName],
        );
        showSavePanel.value = true;
        banner.value = `Snapped to ${hit.name}. Drag the handles if the coast is too rough, then save.`;
        mapApi?.loadCountryIntoDraw?.({
          id: "snap-draft",
          geometry: hit.geometry,
          flag_path: null,
          owner_member_id: session.value?.memberId,
        });
      },
    });
  } catch (err) {
    snapLoading.value = false;
    snapActive.value = false;
    banner.value = err.message || "Could not load world shapes.";
  }
}

async function editBorders(country) {
  if (!canEdit(country)) return;
  let full = country;
  try {
    full = await ensureFullCountry(country.id);
  } catch (err) {
    banner.value = err.message || "Could not load this country.";
    return;
  }
  editingCountryId.value = full.id;
  addingTerritory.value = false;
  borderBaseline.value = full.geometry;
  editBaselineUpdatedAt.value = full.updated_at || null;
  draftGeometry.value = full.geometry;
  pendingFlag.value = null;
  showSavePanel.value = false;
  banner.value =
    "Drag corner points to reshape. The yellow/red point is the ring start. Then Save borders.";
  mapApi?.loadCountryIntoDraw(full);
  mapApi?.focusCountry(full);
}

function revertBorders() {
  if (!editingCountryId.value || !borderBaseline.value) return;
  draftGeometry.value = borderBaseline.value;
  const country = countries.value.find((c) => c.id === editingCountryId.value);
  if (country) {
    mapApi?.loadCountryIntoDraw({
      ...country,
      geometry: borderBaseline.value,
    });
  }
  banner.value = "Restored the saved borders.";
}

function addTerritory(country) {
  if (!canEdit(country)) return;
  editingCountryId.value = country.id;
  addingTerritory.value = true;
  editBaselineUpdatedAt.value = country.updated_at || null;
  snapLoading.value = false;
  snapActive.value = false;
  draftGeometry.value = null;
  pendingFlag.value = null;
  showSavePanel.value = false;
  mapApi?.endSnapToShape?.();
  banner.value =
    "Draw the extra territory. Click the yellow/red start point to close, then it saves.";
  activeDrawer = mapApi?.beginAddTerritory() || null;
}

async function snapTerritory(country) {
  if (!canEdit(country)) return;
  editingCountryId.value = country.id;
  addingTerritory.value = true;
  editBaselineUpdatedAt.value = country.updated_at || null;
  draftGeometry.value = null;
  pendingFlag.value = null;
  showSavePanel.value = false;
  snapLoading.value = true;
  snapActive.value = false;
  banner.value = "Loading real-world outlines…";

  try {
    await mapApi?.beginSnapToShape({
      ...snapGuard(),
      onReady: () => {
        snapLoading.value = false;
        snapActive.value = true;
        banner.value = `Click inside a yellow outline to add that land to ${country.official_name}.`;
      },
      onSelect: (hit) => {
        snapLoading.value = false;
        snapActive.value = false;
        banner.value = `Snapping ${hit.name} onto ${country.official_name}…`;
        commitAddedTerritory(hit.partGeometry || hit.geometry, hit.name || "");
      },
    });
  } catch (err) {
    snapLoading.value = false;
    snapActive.value = false;
    addingTerritory.value = false;
    banner.value = err.message || "Could not load world shapes.";
  }
}

function askTerritoryName(countryName) {
  territoryNameDraft.value = "";
  territoryPrompt.value = { countryName };
  return new Promise((resolve) => {
    territoryNameWait = resolve;
  });
}

function confirmTerritoryName() {
  const name = territoryNameDraft.value.trim();
  territoryPrompt.value = null;
  const resolve = territoryNameWait;
  territoryNameWait = null;
  resolve?.(name);
}

function cancelTerritoryName() {
  territoryPrompt.value = null;
  const resolve = territoryNameWait;
  territoryNameWait = null;
  resolve?.(null);
}

async function commitAddedTerritory(newPolygon, territoryName = "") {
  const country = countries.value.find((c) => c.id === editingCountryId.value);
  if (!session.value || !country) {
    addingTerritory.value = false;
    return;
  }

  let placeName = String(territoryName || "").trim();
  if (!placeName) {
    placeName = await askTerritoryName(country.official_name);
    if (placeName == null) {
      addingTerritory.value = false;
      banner.value = "Territory cancelled.";
      mapApi?.clearDraw();
      return;
    }
  }

  saving.value = true;
  saveError.value = "";
  banner.value = "Saving new territory…";

  try {
    const full = await ensureFullCountry(country.id);
    const merged = mergeGeometries(full.geometry, newPolygon);
    if (!merged) throw new Error("Could not merge territory geometry.");
    const borderError = savableGeometryError(merged);
    if (borderError) throw new Error(borderError);

    const groups = syncTerritoryGroups(
      merged,
      territoryGroups(
        full.geometry,
        full.geography?.territories,
        full.official_name,
      ),
      full.official_name,
    );
    const last = groups[groups.length - 1];
    if (last && !String(last.name || "").trim()) last.name = placeName;

    const payload = withTerritoryGroups(
      withCalculatedArea(countryToPayload(full), merged),
      groups,
    );
    const { error } = await updateCountry(
      session.value.token,
      full.id,
      payload,
      merged,
      editBaselineUpdatedAt.value || full.updated_at || null,
    );
    if (error) throw new Error(error);

    addingTerritory.value = false;
    editingCountryId.value = null;
    draftGeometry.value = null;
    showSavePanel.value = false;
    mapApi?.clearDraw();
    banner.value = placeName
      ? `Added ${placeName} to ${country.official_name}.`
      : `Added territory to ${country.official_name}.`;
    await refreshCountries();
    mapApi?.focusCountry({ ...country, geometry: merged });
  } catch (err) {
    banner.value = err.message || "Failed to add territory.";
    saveError.value = err.message || "Failed to add territory.";
  } finally {
    saving.value = false;
  }
}

async function openWiki(country) {
  if (!country?.id) {
    banner.value = "Select a country first.";
    return;
  }
  try {
    await router.push({ name: "jworld-country", params: { id: country.id } });
  } catch (err) {
    // Stale deploy / missing lazy chunk — full navigation picks up new assets.
    window.location.assign(`/jworld/c/${country.id}`);
  }
}

async function onOwnershipTransferred(result) {
  const name = result?.official_name || selected.value?.official_name || "Country";
  const owner = result?.owner_display_name || "new owner";
  banner.value = `Transferred ${name} to ${owner}.`;
  await refreshCountries();
}

function selectCountry(country) {
  selectedId.value = country.id;
  banner.value = `${country.official_name} · ${country.owner_display_name}`;
  mapApi?.focusCountry(country);
}

async function openSavePanel() {
  if (editingCountryId.value) {
    try {
      const full = await ensureFullCountry(editingCountryId.value);
      if (!editBaselineUpdatedAt.value) {
        editBaselineUpdatedAt.value = full.updated_at || null;
      }
    } catch (err) {
      saveError.value = err.message || "Could not load this country.";
    }
  }
  showSavePanel.value = true;
}

function closeSavePanel() {
  showSavePanel.value = false;
  saveError.value = "";
  draftGeometry.value = null;
  editingCountryId.value = null;
  borderBaseline.value = null;
  editBaselineUpdatedAt.value = null;
  addingTerritory.value = false;
  mapApi?.clearDraw();
}

async function saveCountry(payload, formGeometry = null) {
  if (!session.value) return;
  saving.value = true;
  saveError.value = "";

  try {
    const geometry =
      formGeometry ||
      mapApi?.getDrawGeometry() ||
      draftGeometry.value ||
      formCountry.value?.geometry;

    if (!editingCountryId.value && !geometry) {
      saveError.value = "Draw a polygon on the map before saving.";
      saving.value = false;
      return;
    }

    if (geometry) {
      const borderError = savableGeometryError(geometry);
      if (borderError) throw new Error(borderError);
    }

    if (editingCountryId.value) {
      await ensureFullCountry(editingCountryId.value);
    }
    const namedPayload = geometry
      ? withTerritoryGroups(
          payload,
          syncTerritoryGroups(
            geometry,
            territoryGroups(
              geometry,
              payload.geography?.territories,
              payload.official_name,
            ),
            payload.official_name,
          ),
        )
      : payload;
    const areaPayload = withCalculatedArea(namedPayload, geometry);
    let flagPath = areaPayload.flag_path || null;
    const targetId = editingCountryId.value;

    if (editingCountryId.value) {
      if (pendingFlag.value) {
        const up = await uploadFlag(
          session.value.token,
          editingCountryId.value,
          pendingFlag.value,
          session.value.memberId,
        );
        if (up.error) throw new Error(up.error);
        flagPath = up.path;
      }

      const { error } = await updateCountry(
        session.value.token,
        editingCountryId.value,
        { ...areaPayload, flag_path: flagPath },
        geometry || null,
        editBaselineUpdatedAt.value,
      );
      if (error) throw new Error(error);
    } else {
      const { data, error } = await createCountry(
        session.value.token,
        areaPayload.official_name,
        geometry,
        { ...areaPayload, flag_path: null },
      );
      if (error) throw new Error(error);

      selectedId.value = data?.id || selectedId.value;
      if (pendingFlag.value && data?.id) {
        const up = await uploadFlag(
          session.value.token,
          data.id,
          pendingFlag.value,
          session.value.memberId,
        );
        if (up.error) {
          await refreshCountries();
          throw new Error(
            `Country created, but the flag did not upload: ${up.error}`,
          );
        }
        const saved = await updateCountry(
          session.value.token,
          data.id,
          { ...areaPayload, flag_path: up.path },
          null,
          data.updated_at || null,
        );
        if (saved.error) {
          await refreshCountries();
          throw new Error(
            `Country created, but the flag did not save: ${saved.error}`,
          );
        }
      }
    }

    pendingFlag.value = null;
    draftGeometry.value = null;
    editingCountryId.value = null;
    borderBaseline.value = null;
    editBaselineUpdatedAt.value = null;
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

watch(selectedId, (id) => {
  mapApi?.setSelected(id);
});

onMounted(async () => {
  if (session.value) await bootMap();
});

onBeforeUnmount(() => {
  cancelTerritoryName();
  teardownMap();
});
</script>
