<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";
import { getProposeMetricUrl } from "./lib/proposeMetric";

const proposeMetricUrl = getProposeMetricUrl();
</script>

<template>
  <div class="app-shell">
    <nav class="navbar">
      <div class="navbar__brand">
        <span class="brand-mark">Metric Catalogue</span>
        <span class="brand-sub">SSDLC metrics</span>
      </div>
      <div class="navbar__links">
        <RouterLink to="/" class="nav-link" active-class="nav-link--active" end>Overview</RouterLink>
        <RouterLink to="/metrics" class="nav-link" active-class="nav-link--active">Metrics</RouterLink>
        <a
          class="ghost"
          :href="proposeMetricUrl"
          target="_blank"
          rel="noopener noreferrer"
        >
          Propose a metric
        </a>
      </div>
    </nav>
    <main class="app-content">
      <RouterView />
    </main>
  </div>
</template>
