<script setup lang="ts">
import type { Threshold } from "../../../lib/metrics";

type Props = {
  modelValue: Threshold[];
  disabled?: boolean;
  error?: string;
};

const props = defineProps<Props>();
const emit = defineEmits<{ (event: "update:modelValue", value: Threshold[]): void }>();

function updateThreshold(index: number, patch: Partial<Threshold>) {
  const next: Threshold[] = [...props.modelValue];
  const current = next[index] ?? { name: "", value: "" };
  next[index] = { ...current, ...patch };
  emit("update:modelValue", next);
}

function addThreshold() {
  emit("update:modelValue", [...(props.modelValue ?? []), { name: "", value: "" }]);
}

function removeThreshold(index: number) {
  const next = [...(props.modelValue ?? [])];
  next.splice(index, 1);
  emit("update:modelValue", next);
}
</script>

<template>
  <div class="form-field">
    <label class="form-label">Thresholds</label>
    <p class="form-hint">Format: Name | Value | Optional description</p>
    <div class="threshold-grid">
      <div v-for="(threshold, index) in modelValue" :key="index" class="threshold-row">
        <input
          class="form-input"
          type="text"
          placeholder="Name"
          :value="threshold.name"
          :disabled="disabled"
          @input="updateThreshold(index, { name: ($event.target as HTMLInputElement).value })"
        />
        <input
          class="form-input"
          type="text"
          placeholder="Value"
          :value="threshold.value"
          :disabled="disabled"
          @input="updateThreshold(index, { value: ($event.target as HTMLInputElement).value })"
        />
        <input
          class="form-input"
          type="text"
          placeholder="Description"
          :value="threshold.description"
          :disabled="disabled"
          @input="updateThreshold(index, { description: ($event.target as HTMLInputElement).value })"
        />
        <button
          type="button"
          class="ghost"
          :disabled="disabled"
          @click="removeThreshold(index)"
        >
          Remove
        </button>
      </div>
    </div>
    <button type="button" class="ghost" :disabled="disabled" @click="addThreshold">
      Add threshold
    </button>
    <p v-if="error" class="form-error">{{ error }}</p>
  </div>
</template>
