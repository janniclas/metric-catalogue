import { computed, onMounted, ref } from "vue";
import { loadMetricsIndex, type Metric, type MetricsIndex, type Phase } from "./metrics";

export function useMetricsCatalogue() {
  const metricsIndex = ref<MetricsIndex | null>(null);
  const loading = ref(true);
  const error = ref<string | null>(null);

  onMounted(async () => {
    try {
      metricsIndex.value = await loadMetricsIndex();
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to load metrics.";
    } finally {
      loading.value = false;
    }
  });

  const phases = computed<Phase[]>(() => metricsIndex.value?.phases ?? []);
  const metrics = computed<Metric[]>(() => metricsIndex.value?.metrics ?? []);

  const formattedUpdatedAt = computed(() => {
    if (!metricsIndex.value?.generated_at) return "";
    const date = new Date(metricsIndex.value.generated_at);
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  });

  return {
    metricsIndex,
    loading,
    error,
    phases,
    metrics,
    formattedUpdatedAt,
  };
}
