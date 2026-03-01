<script setup lang="ts">
import { computed, reactive } from "vue";
import { useMetricsCatalogue } from "../../../lib/useMetricsCatalogue";
import type { Phase } from "../../../lib/metrics";
import type { ProposalFormState } from "../lib/types";
import { validateProposal } from "../lib/validation";
import MarkdownEditor from "./MarkdownEditor.vue";
import ThresholdEditor from "./ThresholdEditor.vue";
import MultiValueInput from "./MultiValueInput.vue";

const props = defineProps<{ disabled?: boolean; submitLabel?: string }>();
const emit = defineEmits<{ (event: "submit", value: ProposalFormState): void }>();

const form = reactive<ProposalFormState>({
  title: "",
  id: "",
  phase: "",
  description: "",
  measurement: "",
  rationale: "",
  notes: "",
  tags: [],
  related_tools: [],
  depends_on: [],
  thresholds: [],
  references: [],
});

const { phases, metrics, loading, error } = useMetricsCatalogue();

const phaseOptions = computed<Phase[]>(() => phases.value);
const phaseIds = computed(() => phaseOptions.value.map((phase) => phase.id));

const tagOptions = computed(() => {
  const set = new Set<string>();
  for (const metric of metrics.value) {
    for (const tag of metric.tags ?? []) {
      set.add(tag);
    }
  }
  return [...set].sort();
});

const toolOptions = computed(() => {
  const set = new Set<string>();
  for (const metric of metrics.value) {
    for (const tool of metric.related_tools ?? []) {
      set.add(tool);
    }
  }
  return [...set].sort();
});

const dependencyOptions = computed(() => metrics.value.map((metric) => metric.id).sort());

const validation = computed(() => validateProposal(form, { phaseIds: phaseIds.value }));
const errors = computed(() => validation.value.errors);
const canSubmit = computed(() => validation.value.isValid && !props.disabled && !loading.value);

const referencesText = computed({
  get: () => form.references.join("\n"),
  set: (value: string) => {
    form.references = value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  },
});

function normalizeFormValue(value: string) {
  return value.trim();
}

function normalizeList(values: string[]) {
  return values.map((value) => value.trim()).filter(Boolean);
}

function handleSubmit() {
  const result = validateProposal(form, { phaseIds: phaseIds.value });
  if (!result.isValid) return;

  emit("submit", {
    ...form,
    title: normalizeFormValue(form.title),
    id: normalizeFormValue(form.id),
    phase: normalizeFormValue(form.phase),
    description: normalizeFormValue(form.description),
    measurement: normalizeFormValue(form.measurement),
    rationale: normalizeFormValue(form.rationale),
    notes: normalizeFormValue(form.notes),
    tags: normalizeList(form.tags),
    related_tools: normalizeList(form.related_tools),
    depends_on: normalizeList(form.depends_on),
    references: normalizeList(form.references),
  });
}
</script>

<template>
  <form class="propose-form" @submit.prevent="handleSubmit">
    <div v-if="error" class="state state--error">{{ error }}</div>
    <div v-else-if="loading" class="state">Loading catalogue data…</div>

    <div class="form-grid">
      <div class="form-field">
        <label class="form-label" for="metric-title">Metric title</label>
        <input
          id="metric-title"
          v-model="form.title"
          class="form-input"
          type="text"
          placeholder="Security Requirements Coverage"
          :disabled="props.disabled"
        />
        <p v-if="errors.title" class="form-error">{{ errors.title }}</p>
      </div>

      <div class="form-field">
        <label class="form-label" for="metric-id">Metric id</label>
        <input
          id="metric-id"
          v-model="form.id"
          class="form-input"
          type="text"
          placeholder="plan-security-requirements-coverage"
          :disabled="props.disabled"
        />
        <p v-if="errors.id" class="form-error">{{ errors.id }}</p>
      </div>

      <div class="form-field">
        <label class="form-label" for="metric-phase">SSDLC phase</label>
        <select
          id="metric-phase"
          v-model="form.phase"
          class="form-select"
          :disabled="props.disabled"
        >
          <option value="" disabled>Select a phase</option>
          <option v-for="phase in phaseOptions" :key="phase.id" :value="phase.id">
            {{ phase.name }}
          </option>
        </select>
        <p v-if="errors.phase" class="form-error">{{ errors.phase }}</p>
      </div>

      <MarkdownEditor
        v-model="form.description"
        label="Description"
        id="metric-description"
        placeholder="Describe what the metric measures and why it matters."
        :disabled="props.disabled"
        :error="errors.description"
        hint="Markdown supported."
      />

      <div class="form-field">
        <label class="form-label" for="metric-measurement">Measurement</label>
        <textarea
          id="metric-measurement"
          v-model="form.measurement"
          class="form-textarea"
          placeholder="Define how to measure the metric."
          :disabled="props.disabled"
        ></textarea>
      </div>

      <div class="form-field">
        <label class="form-label" for="metric-rationale">Rationale</label>
        <textarea
          id="metric-rationale"
          v-model="form.rationale"
          class="form-textarea"
          placeholder="Explain why this metric is important."
          :disabled="props.disabled"
        ></textarea>
      </div>

      <MultiValueInput
        v-model="form.tags"
        label="Tags"
        placeholder="Add a tag"
        :suggestions="tagOptions"
        :disabled="props.disabled"
        hint="Press Enter or comma to add multiple tags."
      />

      <MultiValueInput
        v-model="form.related_tools"
        label="Related tools"
        placeholder="Add a tool"
        :suggestions="toolOptions"
        :disabled="props.disabled"
        hint="Autocomplete is based on existing catalogue tools."
      />

      <MultiValueInput
        v-model="form.depends_on"
        label="Depends on"
        placeholder="Add a metric id"
        :suggestions="dependencyOptions"
        :disabled="props.disabled"
        hint="List metric ids that this proposal depends on."
      />

      <ThresholdEditor v-model="form.thresholds" :disabled="props.disabled" :error="errors.thresholds" />

      <div class="form-field">
        <label class="form-label" for="metric-references">References</label>
        <textarea
          id="metric-references"
          v-model="referencesText"
          class="form-textarea"
          placeholder="One URL per line"
          :disabled="props.disabled"
        ></textarea>
      </div>

      <div class="form-field">
        <label class="form-label" for="metric-notes">Notes</label>
        <textarea
          id="metric-notes"
          v-model="form.notes"
          class="form-textarea"
          placeholder="Additional guidance, caveats, or interpretation tips."
          :disabled="props.disabled"
        ></textarea>
      </div>
    </div>

    <div class="form-actions">
      <button class="primary" type="submit" :disabled="!canSubmit">
        {{ props.submitLabel ?? "Submit proposal" }}
      </button>
      <span v-if="!canSubmit" class="form-hint">Fill all required fields to submit.</span>
    </div>
  </form>
</template>
