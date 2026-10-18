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

    <section v-if="variant !== 'create' && territoryGroups.length" class="jw-form-section">
      <h3>Territories</h3>
      <p class="jw-field-hint">
        Shown as “Name ({{ model.official_name || "country" }})”. Select two or
        more islands to merge them under one name.
      </p>
      <div v-if="checkedIndexes.length >= 2" class="jw-territory-merge">
        <input
          v-model="mergeName"
          type="text"
          :placeholder="mergePlaceholder"
          aria-label="Name for the merged territory"
        />
        <button
          type="button"
          class="jw-btn jw-btn--small"
          :disabled="saving"
          @click="mergeSelected"
        >
          Merge
        </button>
      </div>
      <div
        v-for="(group, index) in territoryGroups"
        :key="`territory-${index}`"
        class="jw-territory-row"
      >
        <label
          v-if="territoryGroups.length > 1"
          class="jw-territory-check"
        >
          <input
            type="checkbox"
            :checked="checkedIndexes.includes(index)"
            :disabled="saving"
            :aria-label="`Select ${group.name || 'territory ' + (index + 1)}`"
            @change="toggleCheck(index)"
          />
        </label>
        <label class="jw-territory-name">
          {{ group.count > 1 ? group.name || "Territory" : `Territory ${index + 1}` }}
          <input
            v-model="territoryGroups[index].name"
            type="text"
            :placeholder="model.official_name || 'Territory name'"
          />
          <span class="jw-field-hint">
            <template v-if="group.count > 1">{{ group.count }} islands · </template>
            Preview:
            {{ formatTerritoryLabel(territoryGroups[index].name, model.official_name) }}
          </span>
        </label>
        <div class="jw-territory-actions">
          <button
            v-if="group.count > 1"
            type="button"
            class="jw-btn jw-btn--ghost jw-btn--small"
            :disabled="saving"
            @click="splitGroup(index)"
          >
            Split
          </button>
          <button
            type="button"
            class="jw-btn jw-btn--danger jw-btn--small"
            :disabled="saving || territoryGroups.length <= 1"
            :title="
              territoryGroups.length <= 1
                ? 'Cannot delete the last territory — delete the country instead'
                : 'Remove this territory from the map'
            "
            @click="deleteTerritory(index)"
          >
            Delete
          </button>
        </div>
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
  mergeTerritoryGroups,
  removeTerritoryGroup,
  splitTerritoryGroup,
  syncTerritoryGroups,
  territoryGroups as loadTerritoryGroups,
  withTerritoryGroups,
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
const territoryGroups = ref([]);
const checkedIndexes = ref([]);
const mergeName = ref("");

const mergePlaceholder = computed(() => {
  const first = territoryGroups.value[checkedIndexes.value[0]];
  return first?.name || model.official_name || "Name for the merged territory";
});

function refreshTerritories() {
  const geo = localGeometry.value || props.geometry || props.country?.geometry;
  territoryGroups.value = syncTerritoryGroups(
    geo,
    loadTerritoryGroups(geo, model.geography?.territories, model.official_name),
    model.official_name,
  );
  checkedIndexes.value = [];
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

function toggleCheck(index) {
  const next = new Set(checkedIndexes.value);
  if (next.has(index)) next.delete(index);
  else next.add(index);
  checkedIndexes.value = [...next].sort((a, b) => a - b);
}

function mergeSelected() {
  const indexes = checkedIndexes.value;
  if (indexes.length < 2) return;
  const fallback =
    territoryGroups.value[indexes[0]]?.name || model.official_name || "";
  const name = mergeName.value.trim() || fallback;
  const result = mergeTerritoryGroups(
    localGeometry.value,
    territoryGroups.value,
    indexes,
    name,
  );
  if (!result.geometry) return;
  localGeometry.value = result.geometry;
  territoryGroups.value = result.groups;
  checkedIndexes.value = [];
  mergeName.value = "";
}

function splitGroup(index) {
  territoryGroups.value = splitTerritoryGroup(territoryGroups.value, index);
  checkedIndexes.value = [];
}

function deleteTerritory(index) {
  if (territoryGroups.value.length <= 1) return;
  const group = territoryGroups.value[index];
  const label = formatTerritoryLabel(group?.name, model.official_name);
  const islands = group?.count > 1 ? ` (${group.count} islands)` : "";
  if (!confirm(`Delete territory “${label}”${islands} from the map?`)) return;

  const result = removeTerritoryGroup(
    localGeometry.value,
    territoryGroups.value,
    index,
  );
  if (!result.geometry) return;

  localGeometry.value = result.geometry;
  territoryGroups.value = syncTerritoryGroups(
    result.geometry,
    result.groups,
    model.official_name,
  );
  checkedIndexes.value = [];
}

function onSubmit() {
  const payload = withTerritoryGroups(model, territoryGroups.value);
  emit("submit", payload, localGeometry.value);
}

function onFlag(event) {
  const file = event.target.files?.[0] || null;
  event.target.value = "";
  emit("flag-change", file);
}
</script>
