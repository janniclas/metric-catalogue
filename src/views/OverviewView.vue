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
        <h1>SPHA</h1>
        <p class="subtitle">
          Sichere Softwareentwicklung. Ihre Start-to-End Transformation mit uns!
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

    <section class="section section--light intro">
      <div class="container intro__grid">
        <div class="intro__copy">
          <p class="eyebrow">Was ist SPHA?</p>
          <h2>Eine Plattform für messbare Software-Qualität.</h2>
          <p>
            SPHA verbindet Ihre Sicherheitsmetriken mit den Phasen des SSDLC. So entsteht ein
            konsistenter Blick auf die Wirksamkeit von Security-Aktivitäten in jedem Schritt.
          </p>
          <p>
            Die Metriken sind kuratiert, versioniert und mit Verantwortlichkeiten verknüpft – damit
            Sie Fortschritt transparent verfolgen und Teams gezielt unterstützen können.
          </p>
        </div>
        <div class="intro__visual">
          <div class="stat-grid">
            <div class="stat-card">
              <span class="stat-label">Phasen</span>
              <span class="stat-value">{{ phases.length }}</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">Metriken</span>
              <span class="stat-value">{{ metrics.length }}</span>
            </div>
            <div class="stat-card" v-if="formattedUpdatedAt">
              <span class="stat-label">Letztes Update</span>
              <span class="stat-value">{{ formattedUpdatedAt }}</span>
            </div>
          </div>
          <div class="intro__art">
            <span>Metric Map</span>
          </div>
        </div>
      </div>
    </section>

    <section class="section section--dark phase-section">
      <div class="container">
        <div class="section-header section-header--center">
          <div>
            <p class="eyebrow">Prozess</p>
            <h2>SSDLC-Phasen und Top-Level-Metriken</h2>
          </div>
          <p class="section-subtitle">
            Top-Level-Metriken sind nicht von anderen Metriken abhängig. Jede Karte zeigt die
            Metriken, die den Erfolg dieser Phase definieren.
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
