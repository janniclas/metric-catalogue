<script setup lang="ts">
import { computed } from "vue";
import { useMetricsCatalogue } from "../lib/useMetricsCatalogue";
import { getProposeMetricUrl } from "../lib/proposeMetric";
import type { Metric } from "../lib/metrics";
import iconUrl from "../assets/SPHA_Icon.svg";

const { phases, metrics, loading, error, formattedUpdatedAt } = useMetricsCatalogue();
const proposeMetricUrl = getProposeMetricUrl();

const metricPhaseById = computed(() => {
  const map = new Map<string, string>();
  for (const metric of metrics.value) {
    map.set(metric.id, metric.phase);
  }
  return map;
});

const dependedOnInPhase = computed(() => {
  const map = new Map<string, Set<string>>();
  for (const phase of phases.value) {
    map.set(phase.id, new Set());
  }
  for (const metric of metrics.value) {
    const phase = metric.phase;
    const set = map.get(phase) ?? new Set<string>();
    for (const dependency of metric.depends_on ?? []) {
      if (metricPhaseById.value.get(dependency) === phase) {
        set.add(dependency);
      }
    }
    map.set(phase, set);
  }
  return map;
});

const topLevelByPhase = computed(() => {
  const map = new Map<string, Metric[]>();
  for (const phase of phases.value) {
    map.set(phase.id, []);
  }
  for (const metric of metrics.value) {
    const dependedOn = dependedOnInPhase.value.get(metric.phase);
    if (dependedOn?.has(metric.id)) {
      continue;
    }
    const bucket = map.get(metric.phase) ?? [];
    bucket.push(metric);
    map.set(metric.phase, bucket);
  }
  return map;
});
</script>

<template>
  <div class="app">
    <section class="hero">
      <div class="container hero__inner">
        <img class="hero__icon" :src="iconUrl" alt="" />
        <p class="eyebrow">SSDLC Metric Catalogue</p>
        <h1>Security metrics that map cleanly to software delivery.</h1>
        <p class="subtitle">
          Browse the phases of the SSDLC and the top-level metrics that define how security is measured
          across the lifecycle.
        </p>
        <div class="hero__actions">
          <router-link class="primary" to="/metrics">View all metrics</router-link>
          <a
            class="ghost"
            :href="proposeMetricUrl"
            target="_blank"
            rel="noopener noreferrer"
          >
            Propose a metric
          </a>
        </div>
        <div class="hero__meta">
          <span>{{ phases.length }} phases</span>
          <span>•</span>
          <span>{{ metrics.length }} metrics</span>
          <span v-if="formattedUpdatedAt">• Updated {{ formattedUpdatedAt }}</span>
        </div>
      </div>
    </section>

    <section class="section section--light phase-section">
      <div class="container">
        <p class="eyebrow">Phase map</p>
        <div class="section-header section-header--inline">
          <h2>SSDLC phases and top-level metrics</h2>
          <p class="section-subtitle section-subtitle--inline">
            Top-level metrics are those that are not dependencies of other metrics. Each card shows the
            metrics that define success for that phase.
          </p>
        </div>

        <div v-if="loading" class="state">Loading metrics catalogue…</div>
        <div v-else-if="error" class="state state--error">{{ error }}</div>
        <div v-else class="phase-grid">
          <router-link
            v-for="(phase, index) in phases"
            :key="phase.id"
            class="phase-card phase-card--link"
            :style="{ '--delay': index }"
            :to="`/metrics?phase=${phase.id}`"
          >
            <header class="phase-card__header">
              <div class="phase-card__icon">{{ phase.icon }}</div>
              <div>
                <h3>{{ phase.name }}</h3>
                <p>{{ phase.description }}</p>
              </div>
            </header>

            <div class="phase-card__meta">
              <span class="meta-label">Top-level metrics</span>
              <span class="meta-value">{{ topLevelByPhase.get(phase.id)?.length ?? 0 }}</span>
            </div>
          </router-link>
        </div>
      </div>
    </section>
  </div>
</template>
