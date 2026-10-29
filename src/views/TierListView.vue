<template>
  <main class="tier-page">
    <header class="tier-heading">
      <h1>{{ t("tiers.title") }}</h1>
      <p class="intro">{{ t("tiers.intro") }}</p>
    </header>

    <p v-if="loadError" class="status">{{ t("tiers.loadError") }}</p>
    <p v-else-if="!ready" class="status">{{ t("tiers.loading") }}</p>

    <template v-else>
      <div class="toolbar">
        <label class="list-name">
          <span>{{ t("tiers.listName") }}</span>
          <input
            v-model="title"
            type="text"
            maxlength="80"
            autocomplete="off"
            :placeholder="t('tiers.defaultName')"
            @focus="startEdit"
            @input="markEdit"
            @blur="finishEdit()"
          />
        </label>
        <div class="toolbar-actions">
          <button type="button" :disabled="!past.length" @click="undo">
            {{ t("tiers.undo") }}
          </button>
          <button type="button" @click="copyLink">{{ t("tiers.copy") }}</button>
          <button type="button" :disabled="rendering" @click="downloadImage">
            {{ rendering ? t("tiers.rendering") : t("tiers.download") }}
          </button>
          <button type="button" @click="confirm = { kind: 'reset' }">
            {{ t("tiers.reset") }}
          </button>
        </div>
        <p class="count" aria-live="polite">
          {{ rankedCount }} {{ t("tiers.ranked") }} · {{ unranked.length }}
          {{ t("tiers.left") }}
        </p>
      </div>

      <p v-if="message" class="toast" role="status">{{ message }}</p>
      <input
        v-if="shareUrl"
        class="share-url"
        type="text"
        readonly
        :value="shareUrl"
        @focus="selectShareUrl"
      />

      <div v-if="pendingShare" class="notice">
        <p>{{ t("tiers.shared") }}</p>
        <button type="button" @click="useSharedList">
          {{ t("tiers.useShared") }}
        </button>
        <button type="button" @click="keepMine">{{ t("tiers.keepMine") }}</button>
      </div>

      <div v-if="confirm" class="notice">
        <p>
          {{
            confirm.kind === "reset"
              ? t("tiers.resetPrompt")
              : t("tiers.removePrompt")
          }}
        </p>
        <button type="button" @click="runConfirm">
          {{
            confirm.kind === "reset" ? t("tiers.resetConfirm") : t("tiers.remove")
          }}
        </button>
        <button type="button" @click="confirm = null">
          {{ t("tiers.cancel") }}
        </button>
      </div>

      <div v-if="selected" class="selection">
        <span v-if="broken.has(selected.id)" class="initials">{{
          countryInitials(selected.name)
        }}</span>
        <img
          v-else
          :src="imageUrl(selected.svgUrl)"
          alt=""
          draggable="false"
          @error="markBroken(selected.id)"
        />
        <p>
          <strong>{{ selected.name }}</strong>
          {{ t("tiers.selectedHint") }}
        </p>
        <button type="button" @click="unrankSelected">
          {{ t("tiers.unrank") }}
        </button>
        <button type="button" @click="selectedId = null">
          {{ t("tiers.cancelSelect") }}
        </button>
      </div>

      <div class="board">
        <section class="tiers" :aria-label="t('tiers.title')">
          <article
            v-for="(tier, tierIndex) in tiers"
            :key="tier.id"
            class="tier"
            :class="{
              'is-hot': dropHint?.tierId === tier.id,
              'is-armed': selectedId && !draggingId,
            }"
            :data-tier-id="tier.id"
            @click="onTierClick($event, tier.id)"
          >
            <div class="tier-label" :style="labelStyle(tier)">
              <input
                v-model="tier.label"
                class="tier-name"
                type="text"
                maxlength="16"
                :aria-label="t('tiers.tierLabel')"
                @click.stop
                @focus="startEdit"
                @input="markEdit"
                @blur="finishEdit(tier)"
              />
              <div class="tier-tools" @click.stop>
                <input
                  v-model="tier.color"
                  type="color"
                  :aria-label="t('tiers.tierColor')"
                  @focus="startEdit"
                  @input="markEdit"
                  @blur="finishEdit()"
                />
                <button
                  type="button"
                  :aria-label="t('tiers.up')"
                  :disabled="tierIndex === 0"
                  @click="moveTier(tierIndex, -1)"
                >
                  ↑
                </button>
                <button
                  type="button"
                  :aria-label="t('tiers.down')"
                  :disabled="tierIndex === tiers.length - 1"
                  @click="moveTier(tierIndex, 1)"
                >
                  ↓
                </button>
                <button
                  type="button"
                  :aria-label="t('tiers.remove')"
                  :disabled="tiers.length === 1"
                  @click="askRemove(tier)"
                >
                  ×
                </button>
                <button
                  v-if="selectedId"
                  type="button"
                  class="place-btn"
                  @click="placeSelected(tier.id)"
                >
                  {{ t("tiers.place") }}
                </button>
              </div>
            </div>

            <div class="tier-flags">
              <button
                v-for="(id, index) in tier.ids"
                :key="id"
                type="button"
                class="flag-chip"
                :class="chipClass(tier.id, id, index)"
                :title="countryName(id)"
                :aria-label="countryName(id)"
                :aria-pressed="selectedId === id"
                :data-flag-index="index"
                draggable="false"
                @dragstart.prevent
                @pointerdown="onPointerDown($event, id)"
                @click.stop="onChipClick(id, tier.id, index)"
              >
                <span v-if="broken.has(id) || !byId.get(id)" class="initials">{{
                  countryInitials(countryName(id))
                }}</span>
                <img
                  v-else
                  :src="imageUrl(byId.get(id).svgUrl)"
                  alt=""
                  draggable="false"
                  loading="lazy"
                  @error="markBroken(id)"
                />
              </button>
              <i
                v-if="
                  dropHint?.tierId === tier.id &&
                  dropHint.index === tier.ids.length
                "
                class="insert-end"
              ></i>
              <p v-if="!tier.ids.length" class="drop-hint">
                {{ selectedId ? t("tiers.place") : t("tiers.drop") }}
              </p>
            </div>
          </article>

          <button
            type="button"
            class="add-tier"
            :disabled="tiers.length >= 12"
            @click="addTier"
          >
            {{ t("tiers.addTier") }}
          </button>
        </section>

        <aside class="pool" :class="{ 'is-open': poolOpen, 'is-hot': poolHot }">
          <div class="pool-head">
            <h2>{{ t("tiers.unranked") }}</h2>
            <span class="count">{{ filteredPool.length }}</span>
            <button
              type="button"
              class="pool-toggle"
              @click="poolOpen = !poolOpen"
            >
              {{ poolOpen ? t("tiers.hidePool") : t("tiers.showPool") }}
            </button>
          </div>
          <div class="pool-body">
            <input
              v-model="query"
              type="search"
              :placeholder="t('tiers.search')"
              :aria-label="t('tiers.search')"
              autocomplete="off"
            />
            <div class="pool-grid" data-drop="pool" @click="onPoolClick">
              <p v-if="!unranked.length" class="pool-empty">
                {{ t("tiers.emptyPool") }}
              </p>
              <p v-else-if="!filteredPool.length" class="pool-empty">
                {{ t("tiers.noMatches") }}
              </p>
              <button
                v-for="country in filteredPool"
                :key="country.id"
                type="button"
                class="flag-chip pool-chip"
                :class="{
                  'is-selected': selectedId === country.id,
                  'is-dragging': draggingId === country.id,
                }"
                :aria-label="country.name"
                :aria-pressed="selectedId === country.id"
                draggable="false"
                @dragstart.prevent
                @pointerdown="onPointerDown($event, country.id)"
                @click.stop="onChipClick(country.id, null, 0)"
              >
                <span v-if="broken.has(country.id)" class="initials">{{
                  countryInitials(country.name)
                }}</span>
                <img
                  v-else
                  :src="imageUrl(country.svgUrl)"
                  alt=""
                  draggable="false"
                  loading="lazy"
                  @error="markBroken(country.id)"
                />
                <span class="flag-name">{{ country.name }}</span>
              </button>
            </div>
          </div>
        </aside>
      </div>
    </template>

    <div
      v-if="ghostCountry"
      class="ghost"
      :style="{ left: `${ghost.x}px`, top: `${ghost.y}px` }"
    >
      <img :src="imageUrl(ghostCountry.svgUrl)" alt="" />
    </div>
  </main>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, shallowRef } from "vue";
import { imageUrl } from "../data/flags.js";
import { cachedFlagImageUrl } from "../data/flagImageCache.js";
import {
  TIER_PALETTE,
  countryInitials,
  defaultTiers,
  labelInk,
  loadCountryRecords,
  readShareHash,
  readTierStorage,
  renderTierListCanvas,
  sanitizeTierState,
  shareHash,
  tierStatesEqual,
  writeTierStorage,
} from "../data/tierList.js";
import { useI18n } from "../i18n.js";

const { t } = useI18n();

const countries = shallowRef([]);
const tiers = ref(defaultTiers());
const title = ref("");
const ready = ref(false);
const loadError = ref(false);
const hydrated = ref(false);
const query = ref("");
const selectedId = ref(null);
const draggingId = ref(null);
const dropHint = ref(null);
const ghost = ref(null);
const past = ref([]);
const message = ref("");
const shareUrl = ref("");
const pendingShare = ref(null);
const confirm = ref(null);
const rendering = ref(false);
const poolOpen = ref(false);
const broken = ref(new Set());

const byId = computed(
  () => new Map(countries.value.map((country) => [country.id, country])),
);
const validIds = computed(() => new Set(byId.value.keys()));
const rankedCount = computed(() =>
  tiers.value.reduce((sum, tier) => sum + tier.ids.length, 0),
);
const unranked = computed(() => {
  const placed = new Set(tiers.value.flatMap((tier) => tier.ids));
  return countries.value.filter((country) => !placed.has(country.id));
});
const filteredPool = computed(() => {
  const needle = fold(query.value.trim());
  if (!needle) return unranked.value;
  return unranked.value.filter((country) => fold(country.name).includes(needle));
});
const selected = computed(() => byId.value.get(selectedId.value) || null);
const ghostCountry = computed(() =>
  ghost.value ? byId.value.get(ghost.value.id) || null : null,
);
const poolHot = computed(
  () => Boolean(draggingId.value && dropHint.value && dropHint.value.tierId == null),
);

let disposed = false;
let ignoreClick = false;
let editBaseline = "";
let editPushed = false;
let persistTimer = 0;
let flashTimer = 0;
let removeDragListeners = () => {};

onMounted(async () => {
  window.addEventListener("keydown", onKey);
  let records = [];
  try {
    records = await loadCountryRecords();
  } catch {
    loadError.value = true;
    return;
  }
  countries.value = records;
  const saved = readTierStorage();
  const savedClean = saved ? sanitizeTierState(saved, validIds.value) : null;
  const shared = readShareHash(window.location.hash);
  const sharedClean = shared ? sanitizeTierState(shared, validIds.value) : null;
  hydrated.value = true;

  if (sharedClean && savedClean && !tierStatesEqual(sharedClean, savedClean)) {
    applyState(savedClean);
    pendingShare.value = sharedClean;
  } else if (sharedClean) {
    applyState(sharedClean);
    persistNow();
  } else if (savedClean) {
    applyState(savedClean);
  }
  ready.value = true;
});

onUnmounted(() => {
  disposed = true;
  removeDragListeners();
  window.removeEventListener("keydown", onKey);
  window.removeEventListener("click", swallowClick, true);
  document.body.classList.remove("tier-dragging");
  window.clearTimeout(persistTimer);
  window.clearTimeout(flashTimer);
});

function fold(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

function countryName(id) {
  return byId.value.get(id)?.name || id;
}

function labelStyle(tier) {
  return {
    background: tier.color,
    color: labelInk(tier.color),
  };
}

function chipClass(tierId, id, index) {
  const hint = dropHint.value;
  return {
    "is-selected": selectedId.value === id,
    "is-dragging": draggingId.value === id,
    "is-before": hint?.tierId === tierId && hint.index === index,
  };
}

function snapshot() {
  return JSON.stringify({
    title: title.value,
    tiers: tiers.value.map(({ id, label, color, ids }) => ({
      id,
      label,
      color,
      ids: [...ids],
    })),
  });
}

function trimPast() {
  if (past.value.length > 50) past.value.splice(0, past.value.length - 50);
}

function remember() {
  past.value.push(snapshot());
  trimPast();
}

function applyState(state) {
  const clean = sanitizeTierState(state, validIds.value);
  title.value = clean.title;
  tiers.value = clean.tiers;
}

function schedulePersist() {
  window.clearTimeout(persistTimer);
  persistTimer = window.setTimeout(persistNow, 200);
}

function persistNow() {
  if (!hydrated.value) return;
  window.clearTimeout(persistTimer);
  const state = {
    title: title.value,
    tiers: tiers.value.map(({ id, label, color, ids }) => ({
      id,
      label,
      color,
      ids: [...ids],
    })),
  };
  writeTierStorage(state);
  const hash = shareHash(state);
  if (window.location.hash !== hash) {
    history.replaceState(history.state, "", hash);
  }
  pendingShare.value = null;
}

function startEdit() {
  editBaseline = snapshot();
  editPushed = false;
}

function markEdit() {
  if (!editPushed) {
    past.value.push(editBaseline);
    trimPast();
    editPushed = true;
  }
  schedulePersist();
}

function finishEdit(tier) {
  let changed = editPushed;
  if (tier) {
    const label = String(tier.label || "").trim().slice(0, 16) || "?";
    if (label !== tier.label) {
      if (!editPushed) {
        past.value.push(editBaseline);
        trimPast();
      }
      tier.label = label;
      changed = true;
    }
  }
  editPushed = false;
  if (changed) persistNow();
}

function place(id, tierId, index) {
  const current = tiers.value;
  const source = current.find((tier) => tier.ids.includes(id));
  const sourceIndex = source ? source.ids.indexOf(id) : -1;
  if (!tierId && !source) return;

  let at = index;
  if (tierId) {
    const target = current.find((tier) => tier.id === tierId);
    if (!target) return;
    if (at == null || Number.isNaN(at)) at = target.ids.length;
    if (source?.id === tierId && sourceIndex > -1 && sourceIndex < at) at -= 1;
    const nextLength = source?.id === tierId ? target.ids.length - 1 : target.ids.length;
    at = Math.max(0, Math.min(at, nextLength));
    if (source?.id === tierId && sourceIndex === at) return;
  }

  const next = current.map((tier) => ({
    ...tier,
    ids: tier.ids.filter((item) => item !== id),
  }));
  if (tierId) {
    next.find((tier) => tier.id === tierId).ids.splice(at, 0, id);
  }
  remember();
  tiers.value = next;
  persistNow();
}

function undo() {
  const raw = past.value.pop();
  if (!raw) return;
  const data = JSON.parse(raw);
  title.value = data.title || "";
  tiers.value = data.tiers;
  selectedId.value = null;
  confirm.value = null;
  persistNow();
}

function addTier() {
  if (tiers.value.length >= 12) return;
  remember();
  const used = new Set(tiers.value.map((tier) => tier.label.toUpperCase()));
  const letters = ["S", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"];
  tiers.value.push({
    id: `tier-${Date.now().toString(36)}-${tiers.value.length}`,
    label: letters.find((letter) => !used.has(letter)) || String(tiers.value.length + 1),
    color: TIER_PALETTE[tiers.value.length % TIER_PALETTE.length],
    ids: [],
  });
  persistNow();
}

function moveTier(index, delta) {
  const next = index + delta;
  if (next < 0 || next >= tiers.value.length) return;
  remember();
  const copy = [...tiers.value];
  const [item] = copy.splice(index, 1);
  copy.splice(next, 0, item);
  tiers.value = copy;
  persistNow();
}

function askRemove(tier) {
  if (tiers.value.length <= 1) return;
  if (!tier.ids.length) {
    removeTier(tier.id);
    return;
  }
  confirm.value = { kind: "remove", tierId: tier.id };
}

function removeTier(tierId) {
  if (tiers.value.length <= 1) return;
  remember();
  tiers.value = tiers.value.filter((tier) => tier.id !== tierId);
  confirm.value = null;
  persistNow();
}

function resetList() {
  remember();
  title.value = "";
  tiers.value = defaultTiers();
  selectedId.value = null;
  confirm.value = null;
  query.value = "";
  persistNow();
}

function runConfirm() {
  if (confirm.value?.kind === "reset") resetList();
  else if (confirm.value?.kind === "remove") removeTier(confirm.value.tierId);
}

function useSharedList() {
  if (!pendingShare.value) return;
  remember();
  applyState(pendingShare.value);
  selectedId.value = null;
  pendingShare.value = null;
  persistNow();
}

function keepMine() {
  pendingShare.value = null;
  persistNow();
}

function onChipClick(id, tierId, index) {
  if (ignoreClick) return;
  if (selectedId.value && selectedId.value !== id && tierId) {
    place(selectedId.value, tierId, index);
    selectedId.value = null;
    return;
  }
  selectedId.value = selectedId.value === id ? null : id;
}

function onTierClick(event, tierId) {
  if (ignoreClick || !selectedId.value) return;
  if (event.target.closest("button, input, a")) return;
  place(selectedId.value, tierId, null);
  selectedId.value = null;
}

function onPoolClick(event) {
  if (ignoreClick || !selectedId.value) return;
  if (event.target.closest("button, input, a")) return;
  place(selectedId.value, null, null);
  selectedId.value = null;
}

function placeSelected(tierId) {
  if (!selectedId.value) return;
  place(selectedId.value, tierId, null);
  selectedId.value = null;
}

function unrankSelected() {
  if (!selectedId.value) return;
  place(selectedId.value, null, null);
  selectedId.value = null;
}

function hintFromPoint(x, y) {
  const el = document.elementFromPoint(x, y);
  if (!el) return null;
  if (el.closest("[data-drop='pool']")) return { tierId: null, index: null };
  const row = el.closest("[data-tier-id]");
  if (!row) return null;
  const tierId = row.getAttribute("data-tier-id");
  const tier = tiers.value.find((item) => item.id === tierId);
  if (!tier) return null;
  const chip = el.closest("[data-flag-index]");
  if (!chip || chip.closest("[data-tier-id]") !== row) {
    return { tierId, index: tier.ids.length };
  }
  const index = Number(chip.getAttribute("data-flag-index"));
  const rect = chip.getBoundingClientRect();
  const after = x > rect.left + rect.width / 2;
  return { tierId, index: index + (after ? 1 : 0) };
}

function swallowClick(event) {
  event.preventDefault();
  event.stopPropagation();
  window.removeEventListener("click", swallowClick, true);
}

function onPointerDown(event, id) {
  if (event.pointerType === "touch" || event.button !== 0) return;
  removeDragListeners();
  const startX = event.clientX;
  const startY = event.clientY;
  let moved = false;

  const move = (pointer) => {
    if (disposed) return;
    const dx = pointer.clientX - startX;
    const dy = pointer.clientY - startY;
    if (!moved) {
      if (Math.hypot(dx, dy) < 6) return;
      moved = true;
      draggingId.value = id;
      document.body.classList.add("tier-dragging");
    }
    ghost.value = { id, x: pointer.clientX, y: pointer.clientY };
    dropHint.value = hintFromPoint(pointer.clientX, pointer.clientY);
    if (pointer.clientY < 72) window.scrollBy(0, -16);
    else if (pointer.clientY > window.innerHeight - 72) window.scrollBy(0, 16);
  };

  const end = (pointer, cancel) => {
    removeDragListeners();
    if (!moved) return;
    ignoreClick = true;
    window.addEventListener("click", swallowClick, true);
    const hint = !cancel && !disposed ? hintFromPoint(pointer.clientX, pointer.clientY) : null;
    draggingId.value = null;
    ghost.value = null;
    dropHint.value = null;
    document.body.classList.remove("tier-dragging");
    if (hint) {
      place(id, hint.tierId, hint.index);
      if (selectedId.value === id) selectedId.value = null;
    }
    window.setTimeout(() => {
      ignoreClick = false;
    }, 0);
  };

  const onMove = (pointer) => move(pointer);
  const onUp = (pointer) => end(pointer, false);
  const onCancel = (pointer) => end(pointer, true);
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onCancel);
  removeDragListeners = () => {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onCancel);
  };
}

function onKey(event) {
  if (event.key === "Escape") {
    if (confirm.value) confirm.value = null;
    else selectedId.value = null;
    return;
  }
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z" && !event.shiftKey) {
    const tag = document.activeElement?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    event.preventDefault();
    undo();
  }
}

function flash(text) {
  message.value = text;
  window.clearTimeout(flashTimer);
  flashTimer = window.setTimeout(() => {
    if (message.value === text) message.value = "";
  }, 2600);
}

function selectShareUrl(event) {
  event.target.select();
}

async function copyLink() {
  persistNow();
  const url = window.location.href;
  try {
    await navigator.clipboard.writeText(url);
    shareUrl.value = "";
    flash(t("tiers.copied"));
  } catch {
    shareUrl.value = url;
    flash(t("tiers.copyFail"));
  }
}

function fileSlug(value) {
  const slug = String(value || "")
    .normalize("NFKD")
    .replace(/[^\w]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || "country-tier-list";
}

function loadExportImage(svgUrl) {
  return cachedFlagImageUrl(svgUrl).then(
    (url) =>
      new Promise((resolve) => {
        if (!url) {
          resolve(null);
          return;
        }
        const image = new Image();
        const timer = window.setTimeout(() => resolve(null), 15000);
        if (!url.startsWith("blob:")) image.crossOrigin = "anonymous";
        image.onload = () => {
          window.clearTimeout(timer);
          resolve(image.naturalWidth ? image : null);
        };
        image.onerror = () => {
          window.clearTimeout(timer);
          resolve(null);
        };
        image.src = url;
      }),
  );
}

async function mapLimited(items, limit, task) {
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      await task(items[index], index);
    }
  }
  const workers = Math.min(limit, items.length);
  await Promise.all(Array.from({ length: workers }, () => worker()));
}

async function canvasBlob(canvas) {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("empty image"));
      }, "image/png");
    } catch (error) {
      reject(error);
    }
  });
}

async function downloadImage() {
  if (rendering.value) return;
  rendering.value = true;
  try {
    const placed = [];
    for (const tier of tiers.value) {
      for (const id of tier.ids) {
        const country = byId.value.get(id);
        if (country) placed.push(country);
      }
    }
    const images = new Map();
    let failed = 0;
    await mapLimited(placed, 6, async (country) => {
      const image = await loadExportImage(country.svgUrl);
      images.set(country.id, image);
      if (!image) failed += 1;
    });
    const paint = (imageMap) =>
      renderTierListCanvas({
        title: title.value.trim() || t("tiers.defaultName"),
        subtitle: `${placed.length} ${t("tiers.ranked")}`,
        footer: "eireq.github.io/tiers",
        tiers: tiers.value,
        names: byId.value,
        images: imageMap,
      });
    let canvas = paint(images);
    let blob;
    try {
      blob = await canvasBlob(canvas);
    } catch {
      failed = placed.length;
      canvas = paint(new Map());
      blob = await canvasBlob(canvas);
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileSlug(title.value)}.png`;
    link.click();
    URL.revokeObjectURL(url);
    flash(failed ? t("tiers.downloadPartial") : t("tiers.downloaded"));
  } catch {
    flash(t("tiers.downloadFail"));
  } finally {
    rendering.value = false;
  }
}

function markBroken(id) {
  if (broken.value.has(id)) return;
  const next = new Set(broken.value);
  next.add(id);
  broken.value = next;
}
</script>

<style scoped>
.tier-page {
  align-items: stretch;
  justify-content: flex-start;
  width: min(1240px, 100%);
  margin: 0 auto;
  padding: 64px 22px 88px;
  text-align: left;
}

h1 {
  margin: 0 0 14px;
  font-size: clamp(42px, 7vw, 72px);
  line-height: 0.95;
  letter-spacing: -3px;
}

h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
}

.intro,
.status,
.count,
.toast,
.notice p,
.selection p,
.drop-hint,
.pool-empty,
.flag-name {
  color: #888;
}

.intro {
  max-width: 680px;
  margin: 0 0 28px;
  font-size: 18px;
  line-height: 1.6;
}

.status {
  margin: 0;
  font-size: 16px;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 14px 18px;
  margin-bottom: 16px;
}

.list-name {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: min(100%, 280px);
  flex: 1;
  color: #888;
  font-size: 13px;
}

.list-name input,
.pool-body input,
.share-url {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #333;
  background: #000;
  color: #fff;
  font: inherit;
  font-size: 16px;
}

.toolbar-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.toolbar-actions button,
.notice button,
.selection button,
.add-tier,
.pool-toggle,
.tier-tools button {
  padding: 8px 12px;
  border: 1px solid #333;
  background: #000;
  color: #fff;
  font: inherit;
  font-size: 14px;
  cursor: pointer;
}

.toolbar-actions button:hover,
.notice button:hover,
.selection button:hover,
.add-tier:hover,
.pool-toggle:hover,
.tier-tools button:hover {
  border-color: #fff;
}

button:disabled {
  opacity: 0.4;
  cursor: default;
}

.count {
  margin: 0;
  font-size: 14px;
}

.toast,
.notice,
.selection {
  margin: 0 0 14px;
}

.notice,
.selection {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border: 1px solid #333;
}

.notice p,
.selection p {
  margin: 0;
  flex: 1;
  min-width: 180px;
}

.selection {
  border-color: #fff;
}

.selection strong {
  color: #fff;
}

.selection img,
.selection .initials {
  width: 56px;
  height: 36px;
}

.board {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 16px;
  align-items: start;
}

.tier {
  display: flex;
  align-items: stretch;
  min-height: 86px;
  border: 1px solid #222;
  background: #0a0a0a;
}

.tier + .tier {
  margin-top: 8px;
}

.tier.is-armed {
  border-color: #444;
}

.tier.is-hot,
.pool.is-hot {
  border-color: #fff;
}

.tier-label {
  width: 132px;
  flex: 0 0 132px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 0 0;
}

.tier-name {
  width: 100%;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 28px;
  font-weight: 700;
  text-align: center;
  letter-spacing: -1px;
  padding: 0 8px;
}

.tier-tools {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px;
  padding: 6px;
  background: #000;
}

.tier-tools button {
  min-width: 26px;
  height: 26px;
  padding: 0 6px;
}

.tier-tools button.place-btn {
  flex: 1 0 100%;
}

.tier-tools input[type="color"] {
  width: 26px;
  height: 26px;
  padding: 0;
  border: 1px solid #fff;
  background: transparent;
  cursor: pointer;
}

.tier-tools input[type="color"]::-webkit-color-swatch-wrapper {
  padding: 0;
}

.tier-tools input[type="color"]::-webkit-color-swatch {
  border: 0;
}

.tier-flags,
.pool-grid {
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: 6px;
}

.tier-flags {
  flex: 1;
  min-width: 0;
  min-height: 72px;
  padding: 8px;
}

.drop-hint {
  margin: auto;
  font-size: 14px;
}

.flag-chip {
  position: relative;
  display: block;
  width: 74px;
  padding: 0;
  border: 1px solid #2a2a2a;
  background: #111;
  color: inherit;
  cursor: grab;
}

.flag-chip img {
  display: block;
  width: 100%;
  height: 48px;
  object-fit: contain;
  pointer-events: none;
  background: #111;
}

.flag-chip.is-selected {
  border-color: #fff;
}

.flag-chip.is-dragging {
  opacity: 0.35;
}

.flag-chip.is-before {
  box-shadow: -3px 0 0 #fff;
}

.initials {
  display: grid;
  place-items: center;
  width: 100%;
  height: 48px;
  color: #ddd;
  font-size: 14px;
  font-weight: 700;
}

.insert-end {
  width: 3px;
  align-self: stretch;
  background: #fff;
}

.add-tier {
  margin-top: 10px;
}

.pool {
  position: sticky;
  top: 74px;
  max-height: calc(100vh - 90px);
  overflow: auto;
  border: 1px solid #222;
  background: #000;
}

.pool-head {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #000;
}

.pool-head .count {
  margin-right: auto;
}

.pool-toggle {
  display: none;
}

@media (min-width: 901px) {
  .pool-body {
    display: block;
  }
}

.pool-body {
  padding: 0 12px 12px;
}

.pool-body input {
  margin-bottom: 10px;
}

.pool-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
  min-height: 72px;
}

.pool-chip {
  width: 100%;
  padding: 6px;
  text-align: left;
}

.flag-name {
  display: block;
  margin-top: 4px;
  font-size: 11px;
  line-height: 1.3;
}

.pool-empty {
  grid-column: 1 / -1;
  margin: 12px 0;
  font-size: 14px;
}

.ghost {
  position: fixed;
  z-index: 300;
  width: 74px;
  margin-left: -37px;
  margin-top: -24px;
  pointer-events: none;
  border: 1px solid #fff;
  background: #111;
}

.ghost img {
  display: block;
  width: 100%;
  height: 48px;
  object-fit: contain;
}

:global(body.tier-dragging) {
  cursor: grabbing;
  user-select: none;
}

:global(body.tier-dragging) .flag-chip {
  cursor: grabbing;
}

@media (max-width: 900px) {
  .tier-page {
    padding-bottom: calc(46vh + 28px);
  }

  .tier-page:has(.pool:not(.is-open)) {
    padding-bottom: 88px;
  }

  .board {
    display: block;
  }

  .pool {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 40;
    top: auto;
    display: flex;
    flex-direction: column;
    max-height: 46vh;
    border-left: 0;
    border-right: 0;
    border-bottom: 0;
  }

  .pool:not(.is-open) {
    max-height: none;
  }

  .pool:not(.is-open) .pool-body {
    display: none;
  }

  .pool-head {
    position: static;
  }

  .pool-toggle {
    display: inline-flex;
  }

  .pool-body {
    overflow: auto;
    overscroll-behavior: contain;
  }

  .tier {
    flex-direction: column;
  }

  .tier-label {
    width: 100%;
    flex-basis: auto;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    min-height: 0;
    padding: 0;
  }

  .tier-name {
    width: 72px;
    flex: 0 0 72px;
    font-size: 24px;
  }

  .tier-tools {
    flex: 1;
    justify-content: flex-end;
  }
}
</style>
