<script setup lang="ts">
import { computed } from "vue";
import { renderMarkdown } from "../../../lib/markdown";

type Props = {
  modelValue: string;
  label: string;
  placeholder?: string;
  disabled?: boolean;
  hint?: string;
  error?: string;
  id?: string;
};

const props = defineProps<Props>();
const emit = defineEmits<{ (event: "update:modelValue", value: string): void }>();

const preview = computed(() => renderMarkdown(props.modelValue || ""));
const inputId = computed(() => props.id ?? `markdown-${Math.random().toString(36).slice(2)}`);
</script>

<template>
  <div class="form-field">
    <label class="form-label" :for="inputId">{{ label }}</label>
    <div class="markdown-editor">
      <textarea
        :id="inputId"
        class="form-textarea"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      ></textarea>
      <div class="markdown-preview" v-html="preview"></div>
    </div>
    <p v-if="hint" class="form-hint">{{ hint }}</p>
    <p v-if="error" class="form-error">{{ error }}</p>
  </div>
</template>
