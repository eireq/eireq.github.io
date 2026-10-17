<template>
  <form class="jw-form" @submit.prevent="onSubmit">
    <div class="jw-form-actions jw-form-actions--top">
      <button type="submit" class="jw-btn" :disabled="saving">
        {{ saving ? "Saving…" : submitLabel }}
      </button>
      <button
        v-if="showDelete"
        type="button"
        class="jw-btn jw-btn--danger"
        :disabled="saving"
        @click="emit('delete')"
      >
        Delete country
      </button>
      <button
        type="button"
        class="jw-btn jw-btn--ghost"
        @click="emit('cancel')"
      >
        Cancel
      </button>
    </div>

    <section class="jw-form-section">
      <h3>Identity</h3>
      <label>
        Official name
        <input v-model="model.official_name" type="text" required />
      </label>
      <label>
        Common names
        <input v-model="model.common_names" type="text" />
      </label>
      <p v-if="variant === 'create'" class="jw-field-hint">
        A name and a flag are enough here. Fill in the wiki from the country page.
      </p>
      <p v-else-if="variant === 'borders'" class="jw-field-hint">
        This saves the borders and the name. The rest of the wiki stays on the country page.
      </p>
      <template v-if="variant === 'full'">
      <label>
        Motto
        <input v-model="model.motto" type="text" />
      </label>
      <label>
        Short description
        <textarea v-model="model.short_description" rows="3" />
      </label>
      <label>
        Lore
        <textarea v-model="model.lore" rows="6" />
      </label>
      </template>
      <label class="jw-flag-upload">
        Flag image
        <input type="file" accept="image/*" @change="onFlag" />
      </label>
      <div v-if="flagPreview" class="jw-flag-preview">
        <img :src="flagPreview" alt="Flag preview" />
      </div>
    </section>

    <section v-if="variant !== 'create' && territoryNames.length" class="jw-form-section">
      <h3>Territories</h3>
      <p class="jw-field-hint">
        Shown as “Name ({{ model.official_name || "country" }})” on the wiki.
      </p>
      <div
        v-for="(name, index) in territoryNames"
        :key="`territory-${index}`"
        class="jw-territory-row"
      >
        <label class="jw-territory-name">
          Territory {{ index + 1 }}
          <input
            v-model="territoryNames[index]"
            type="text"
            :placeholder="model.official_name || 'Territory name'"
          />
          <span class="jw-field-hint">
            Preview:
            {{ formatTerritoryLabel(territoryNames[index], model.official_name) }}
          </span>
        </label>
        <button
          type="button"
          class="jw-btn jw-btn--danger jw-btn--small"
          :disabled="saving || territoryNames.length <= 1"
          :title="
            territoryNames.length <= 1
              ? 'Cannot delete the last territory — delete the country instead'
              : 'Remove this territory from the map'
          "
          @click="deleteTerritory(index)"
        >
          Delete
        </button>
      </div>
    </section>

    <section v-if="variant === 'full'" class="jw-form-section">
      <h3>Infobox</h3>
      <label v-for="field in INFOBOX_FIELDS" :key="field.key">
        {{ field.label }}
        <template v-if="field.computed">
          <input
            type="text"
            :value="computedArea || model[field.key] || 'Draw borders to calculate'"
            readonly
            class="jw-computed"
          />
          <span v-if="field.hint" class="jw-field-hint">{{ field.hint }}</span>
        </template>
        <select
          v-else-if="field.options"
          v-model="model[field.key]"
        >
          <option value="">— select —</option>
          <option
            v-for="opt in selectOptions(field, model[field.key])"
            :key="opt"
            :value="opt"
          >
            {{ opt }}
          </option>
        </select>
        <input v-else v-model="model[field.key]" type="text" />
      </label>
      <label>
        Religion
        <textarea v-model="model.religion.summary" rows="4" />
      </label>
    </section>

    <template v-if="variant === 'full'">
    <section
      v-for="(fields, sectionKey) in SECTION_FIELDS"
      :key="sectionKey"
      class="jw-form-section"
    >
      <h3>{{ sectionTitle(sectionKey) }}</h3>
      <label v-for="field in fields" :key="field.key">
        {{ field.label }}
        <template v-if="field.computed">
          <input
            type="text"
            :value="computedArea || model[sectionKey][field.key] || 'Draw borders to calculate'"
            readonly
            class="jw-computed"
          />
          <span v-if="field.hint" class="jw-field-hint">{{ field.hint }}</span>
        </template>
        <select
          v-else-if="field.options"
          v-model="model[sectionKey][field.key]"
        >
          <option value="">— select —</option>
          <option
            v-for="opt in selectOptions(field, model[sectionKey][field.key])"
            :key="opt"
            :value="opt"
          >
            {{ opt }}
          </option>
        </select>
        <textarea
          v-else-if="field.multiline || field.key === 'admin_divisions'"
          v-model="model[sectionKey][field.key]"
          rows="3"
        />
        <input v-else v-model="model[sectionKey][field.key]" type="text" />
      </label>
    </section>
    </template>
  </form>
</template>

<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from "vue";
import {
  INFOBOX_FIELDS,
  SECTION_FIELDS,
  countryToPayload,
} from "./countryFields.js";
import { formatLandArea } from "./geometryArea.js";
import { flagPublicUrl } from "./supabase.js";
import {
  formatTerritoryLabel,
  listTerritoryNames,
  removeTerritoryAt,
  syncTerritoryNames,
  withTerritoryNames,
} from "./territories.js";

const props = defineProps({
  country: { type: Object, default: null },
  geometry: { type: Object, default: null },
  saving: { type: Boolean, default: false },
  submitLabel: { type: String, default: "Save" },
  showDelete: { type: Boolean, default: false },
  pendingFlagFile: { type: File, default: null },
  variant: { type: String, default: "full" },
});

const emit = defineEmits(["submit", "cancel", "delete", "flag-change"]);

const model = reactive(countryToPayload(props.country));
const localGeometry = ref(
  props.geometry || props.country?.geometry || null,
);
const territoryNames = ref([]);

function refreshTerritories() {
  const geo = localGeometry.value || props.geometry || props.country?.geometry;
  const fromCountry = listTerritoryNames(
    { ...model, geometry: geo },
    geo,
  );
  territoryNames.value = syncTerritoryNames(
    geo,
    fromCountry,
    model.official_name,
  );
}

watch(
  () => props.country,
  (next) => {
    Object.assign(model, countryToPayload(next));
    localGeometry.value = props.geometry || next?.geometry || null;
    refreshTerritories();
  },
  { deep: true },
);

watch(
  () => props.geometry,
  (next) => {
    if (next) localGeometry.value = next;
    refreshTerritories();
  },
);

refreshTerritories();

const computedArea = computed(() => {
  const geo = localGeometry.value || props.geometry || props.country?.geometry || null;
  return formatLandArea(geo);
});

watch(
  computedArea,
  (area) => {
    if (!area) return;
    model.land_area = area;
    if (!model.geography) model.geography = {};
    model.geography.area = area;
  },
  { immediate: true },
);

const previewUrl = ref(null);

watch(
  () => props.pendingFlagFile,
  (file) => {
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
    previewUrl.value = file ? URL.createObjectURL(file) : null;
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
});

const flagPreview = computed(() => {
  return previewUrl.value || flagPublicUrl(model.flag_path);
});

function selectOptions(field, current) {
  const opts = [...(field.options || [])];
  if (current && !opts.includes(current)) opts.unshift(current);
  return opts;
}

function sectionTitle(key) {
  return (
    {
      politics: "Politics",
      government: "Government & Society",
      geography: "Geography",
      symbols: "Symbols",
    }[key] || key
  );
}

function deleteTerritory(index) {
  if (territoryNames.value.length <= 1) return;
  const label = formatTerritoryLabel(
    territoryNames.value[index],
    model.official_name,
  );
  if (!confirm(`Delete territory “${label}” from the map?`)) return;

  const result = removeTerritoryAt(
    localGeometry.value,
    territoryNames.value,
    index,
  );
  if (!result.geometry) return;

  localGeometry.value = result.geometry;
  territoryNames.value = syncTerritoryNames(
    result.geometry,
    result.names,
    model.official_name,
  );
}

function onSubmit() {
  const payload = withTerritoryNames(model, territoryNames.value);
  emit("submit", payload, localGeometry.value);
}

function onFlag(event) {
  const file = event.target.files?.[0] || null;
  event.target.value = "";
  emit("flag-change", file);
}
</script>
