<script setup lang="ts">
import { computed } from "vue";
import { useRoute, RouterLink } from "vue-router";
import { useMetricsCatalogue } from "../lib/useMetricsCatalogue";
import { renderMarkdown } from "../lib/markdown";

const route = useRoute();
const { phases, metrics, loading, error } = useMetricsCatalogue();

const phaseLabelMap = computed(() => {
  const map = new Map<string, string>();
  for (const phase of phases.value) {
    map.set(phase.id, phase.name);
  }
  return map;
});

const metric = computed(() => {
  const id = String(route.params.id ?? "");
  return metrics.value.find((item) => item.id === id) ?? null;
});

const renderedMarkdown = computed(() => {
  if (!metric.value) return "";
  return renderMarkdown(metric.value.markdown);
});

const dependencyList = computed(() => metric.value?.depends_on ?? []);
const repoUrl = import.meta.env.VITE_REPO_URL as string | undefined;
const repoBranch = (import.meta.env.VITE_REPO_BRANCH as string | undefined) ?? "main";

const relatedMetrics = computed(() => {
  if (!metric.value) return [];
  const tagSet = new Set(metric.value.tags ?? []);
  const toolSet = new Set(metric.value.related_tools ?? []);

  return metrics.value
    .filter((candidate) => candidate.id !== metric.value?.id)
    .map((candidate) => {
      let score = 0;
      for (const tag of candidate.tags ?? []) {
        if (tagSet.has(tag)) score += 2;
      }
      for (const tool of candidate.related_tools ?? []) {
        if (toolSet.has(tool)) score += 1;
      }
      if (candidate.phase === metric.value?.phase) score += 1;
      return { candidate, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(({ candidate }) => candidate);
});

const sourceUrl = computed(() => {
  if (!metric.value || !repoUrl) return null;
  const normalized = repoUrl.replace(/\/+$/, "");
  return `${normalized}/blob/${repoBranch}/${metric.value.source_path}`;
});
</script>

<template>
  <section class="metric-detail">
    <RouterLink class="back-link" to="/metrics">← Back to all metrics</RouterLink>

    <div v-if="loading" class="state">Loading metric…</div>
    <div v-else-if="error" class="state state--error">{{ error }}</div>
    <div v-else-if="!metric" class="state">Metric not found.</div>

    <div v-else class="metric-detail__content">
      <header class="metric-detail__header">
        <p class="metric-phase">{{ phaseLabelMap.get(metric.phase) ?? metric.phase }}</p>
        <h1>{{ metric.title }}</h1>
        <p class="metric-id">{{ metric.id }}</p>
      </header>

      <div class="metric-detail__meta">
        <div>
          <span class="meta-label">Tags</span>
          <p>{{ metric.tags?.join(", ") || "—" }}</p>
        </div>
        <div>
          <span class="meta-label">Tools</span>
          <p>{{ metric.related_tools?.join(", ") || "—" }}</p>
        </div>
        <div>
          <span class="meta-label">Thresholds</span>
          <p>{{ metric.thresholds?.length ?? 0 }}</p>
        </div>
        <div>
          <span class="meta-label">Depends on</span>
          <p>{{ metric.depends_on?.length ?? 0 }}</p>
        </div>
      </div>

      <section class="metric-detail__body" v-html="renderedMarkdown"></section>

      <section class="metric-detail__extras">
        <div>
          <h3>Thresholds</h3>
          <ul>
            <li v-for="threshold in metric.thresholds ?? []" :key="threshold.name">
              <strong>{{ threshold.name }}:</strong> {{ threshold.value }}
              <span v-if="threshold.description"> — {{ threshold.description }}</span>
            </li>
            <li v-if="!metric.thresholds?.length">No thresholds defined.</li>
          </ul>
        </div>
        <div>
          <h3>Dependencies</h3>
          <ul>
            <li v-for="dependency in dependencyList" :key="dependency">
              <RouterLink :to="`/metrics/${dependency}`">{{ dependency }}</RouterLink>
            </li>
            <li v-if="dependencyList.length === 0">No dependencies.</li>
          </ul>
        </div>
        <div>
          <h3>Related metrics</h3>
          <ul>
            <li v-for="related in relatedMetrics" :key="related.id">
              <RouterLink :to="`/metrics/${related.id}`">{{ related.title }}</RouterLink>
            </li>
            <li v-if="relatedMetrics.length === 0">No related metrics yet.</li>
          </ul>
        </div>
        <div>
          <h3>References</h3>
          <ul>
            <li v-for="reference in metric.references ?? []" :key="reference">
              <a :href="reference" target="_blank" rel="noreferrer">{{ reference }}</a>
            </li>
            <li v-if="!metric.references?.length">No references.</li>
          </ul>
        </div>
        <div>
          <h3>Source file</h3>
          <p v-if="sourceUrl">
            <a :href="sourceUrl" target="_blank" rel="noreferrer">{{ metric.source_path }}</a>
          </p>
          <p v-else><code>{{ metric.source_path }}</code></p>
        </div>
      </section>
    </div>
  </section>
</template>
