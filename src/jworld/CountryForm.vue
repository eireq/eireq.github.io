<template>
  <form class="jw-form" @submit.prevent="emit('submit', model)">
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
      <label class="jw-flag-upload">
        Flag image
        <input type="file" accept="image/*" @change="onFlag" />
      </label>
      <div v-if="flagPreview" class="jw-flag-preview">
        <img :src="flagPreview" alt="Flag preview" />
      </div>
    </section>

    <section class="jw-form-section">
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

    <div class="jw-form-actions">
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
  </form>
</template>

<script setup>
import { computed, reactive, watch } from "vue";
import {
  INFOBOX_FIELDS,
  SECTION_FIELDS,
  countryToPayload,
} from "./countryFields.js";
import { formatLandArea } from "./geometryArea.js";
import { flagPublicUrl } from "./supabase.js";

const props = defineProps({
  country: { type: Object, default: null },
  geometry: { type: Object, default: null },
  saving: { type: Boolean, default: false },
  submitLabel: { type: String, default: "Save" },
  showDelete: { type: Boolean, default: false },
  pendingFlagFile: { type: File, default: null },
});

const emit = defineEmits(["submit", "cancel", "delete", "flag-change"]);

const model = reactive(countryToPayload(props.country));

watch(
  () => props.country,
  (next) => {
    Object.assign(model, countryToPayload(next));
  },
  { deep: true },
);

const computedArea = computed(() => {
  const geo = props.geometry || props.country?.geometry || null;
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

const localPreviewUrl = computed(() => {
  if (!props.pendingFlagFile) return null;
  return URL.createObjectURL(props.pendingFlagFile);
});

const flagPreview = computed(() => {
  return localPreviewUrl.value || flagPublicUrl(model.flag_path);
});

/** Keep legacy free-text values selectable even if not in the preset list. */
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

function onFlag(event) {
  const file = event.target.files?.[0] || null;
  event.target.value = "";
  emit("flag-change", file);
}
</script>
