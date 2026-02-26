<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { RouterLink, RouterView } from "vue-router";
import { getProposeMetricUrl } from "./lib/proposeMetric";
import logoUrl from "./assets/SPHA_Icon.svg";

const proposeMetricUrl = getProposeMetricUrl();
const isScrolled = ref(false);

function updateScrollState() {
  isScrolled.value = window.scrollY > 48;
}

onMounted(() => {
  updateScrollState();
  window.addEventListener("scroll", updateScrollState, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", updateScrollState);
});
</script>

<template>
  <div class="app-shell">
    <nav class="navbar" :class="isScrolled ? 'navbar--floating' : 'navbar--banner'">
      <div class="navbar__inner">
        <RouterLink to="/" class="navbar__brand">
          <img class="brand-logo" :src="logoUrl" alt="SPHA logo" />
          <span class="brand-text">
          <span class="brand-title">SPHA</span>
            <span class="brand-sub">Metric Catalogue</span>
          </span>
        </RouterLink>
        <div class="navbar__links">
          <RouterLink to="/" class="nav-link" active-class="nav-link--active" end>Overview</RouterLink>
          <RouterLink to="/metrics" class="nav-link" active-class="nav-link--active">Metrics</RouterLink>
          <a
            class="nav-cta"
            :href="proposeMetricUrl"
            target="_blank"
            rel="noopener noreferrer"
          >
            Propose a metric
          </a>
        </div>
      </div>
    </nav>
    <main class="app-content">
      <RouterView />
    </main>
  </div>
</template>
