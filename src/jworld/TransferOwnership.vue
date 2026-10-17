<template>
  <div class="jw-transfer">
    <button
      v-if="!open"
      class="jw-btn jw-btn--ghost"
      type="button"
      :disabled="disabled"
      @click="start"
    >
      Transfer ownership
    </button>

    <div v-else class="jw-transfer-panel">
      <label>
        New owner
        <select v-model="newOwnerId" :disabled="busy || loadingMembers">
          <option disabled value="">
            {{ loadingMembers ? "Loading players…" : "— select player —" }}
          </option>
          <option
            v-for="member in otherMembers"
            :key="member.id"
            :value="member.id"
          >
            {{ member.display_name
            }}{{ member.is_admin ? " (admin)" : "" }}
          </option>
        </select>
      </label>
      <div class="jw-form-actions">
        <button
          class="jw-btn"
          type="button"
          :disabled="busy || !newOwnerId"
          @click="confirmTransfer"
        >
          {{ busy ? "Transferring…" : "Transfer" }}
        </button>
        <button
          class="jw-btn jw-btn--ghost"
          type="button"
          :disabled="busy"
          @click="cancel"
        >
          Cancel
        </button>
      </div>
      <p v-if="error" class="jw-error">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { listMembers, transferCountry } from "./supabase.js";

const props = defineProps({
  token: { type: String, required: true },
  country: { type: Object, required: true },
  disabled: { type: Boolean, default: false },
});

const emit = defineEmits(["transferred"]);

const open = ref(false);
const busy = ref(false);
const loadingMembers = ref(false);
const members = ref([]);
const newOwnerId = ref("");
const error = ref("");

const otherMembers = computed(() =>
  (members.value || []).filter(
    (m) => m.id !== props.country?.owner_member_id,
  ),
);

async function start() {
  open.value = true;
  error.value = "";
  newOwnerId.value = "";
  loadingMembers.value = true;
  const { data, error: err } = await listMembers(props.token);
  loadingMembers.value = false;
  if (err) {
    error.value = err;
    return;
  }
  members.value = data || [];
  if (!otherMembers.value.length) {
    error.value = "No other players to transfer to.";
  }
}

function cancel() {
  open.value = false;
  error.value = "";
  newOwnerId.value = "";
}

async function confirmTransfer() {
  if (!newOwnerId.value || !props.country?.id) return;
  const target = otherMembers.value.find((m) => m.id === newOwnerId.value);
  const label = target?.display_name || "that player";
  if (
    !confirm(
      `Transfer “${props.country.official_name}” to ${label}? They will become the owner.`,
    )
  ) {
    return;
  }

  busy.value = true;
  error.value = "";
  const { data, error: err } = await transferCountry(
    props.token,
    props.country.id,
    newOwnerId.value,
  );
  busy.value = false;
  if (err) {
    error.value = err;
    return;
  }

  open.value = false;
  emit("transferred", data);
}
</script>
