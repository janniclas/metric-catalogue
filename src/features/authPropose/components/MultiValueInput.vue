<script setup lang="ts">
import { computed, ref } from "vue";

type Props = {
  modelValue: string[];
  label: string;
  placeholder?: string;
  suggestions?: string[];
  disabled?: boolean;
  hint?: string;
  error?: string;
};

const props = defineProps<Props>();
const emit = defineEmits<{ (event: "update:modelValue", value: string[]): void }>();

const inputValue = ref("");
const listId = `list-${Math.random().toString(36).slice(2)}`;

const values = computed(() => props.modelValue ?? []);

function normalizeValue(value: string) {
  return value.trim();
}

function addValue(raw?: string) {
  const candidate = normalizeValue(raw ?? inputValue.value);
  if (!candidate) return;

  const existing = values.value.some((value) => value.toLowerCase() === candidate.toLowerCase());
  if (existing) {
    inputValue.value = "";
    return;
  }

  emit("update:modelValue", [...values.value, candidate]);
  inputValue.value = "";
}

function addValues(list: string[]) {
  if (list.length === 0) return;
  const existing = new Set(values.value.map((value) => value.toLowerCase()));
  const next = [...values.value];
  let changed = false;
  for (const item of list) {
    const candidate = normalizeValue(item);
    if (!candidate) continue;
    const key = candidate.toLowerCase();
    if (existing.has(key)) continue;
    existing.add(key);
    next.push(candidate);
    changed = true;
  }
  if (changed) {
    emit("update:modelValue", next);
  }
  inputValue.value = "";
}

function removeValue(target: string) {
  emit(
    "update:modelValue",
    values.value.filter((value) => value !== target),
  );
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === "Enter" || event.key === ",") {
    event.preventDefault();
    addValue();
  }
}

function handleBlur() {
  addValue();
}

function handlePaste(event: ClipboardEvent) {
  const text = event.clipboardData?.getData("text");
  if (!text) return;
  const parts = text.split(/[\n,]+/g).map((item) => item.trim());
  if (parts.length === 0) return;
  event.preventDefault();
  addValues(parts);
}
</script>

<template>
  <div class="form-field">
    <label class="form-label">{{ label }}</label>
    <div class="multi-input" :class="disabled ? 'is-disabled' : ''">
      <span v-for="value in values" :key="value" class="chip">
        {{ value }}
        <button type="button" :disabled="disabled" @click="removeValue(value)">×</button>
      </span>
      <input
        v-model="inputValue"
        class="chip-input"
        :placeholder="placeholder"
        :disabled="disabled"
        :list="listId"
        @keydown="handleKeydown"
        @blur="handleBlur"
        @paste="handlePaste"
      />
      <datalist :id="listId">
        <option v-for="option in suggestions ?? []" :key="option" :value="option" />
      </datalist>
    </div>
    <p v-if="hint" class="form-hint">{{ hint }}</p>
    <p v-if="error" class="form-error">{{ error }}</p>
  </div>
</template>
