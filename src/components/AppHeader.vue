<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { headerSocialLinks, proposeMetricUrl } from "../lib/config";
import logoUrl from "../assets/SPHA_Icon.svg";

const isScrolled = ref(false);
const isMetricsOpen = ref(false);
const metricsMenuRef = ref<HTMLElement | null>(null);
const route = useRoute();

const isMetricsActive = computed(() => {
  return route.path.startsWith("/metrics") || route.path.startsWith("/graph");
});

function updateScrollState() {
  isScrolled.value = window.scrollY > 48;
}

function closeMetricsMenu(event?: Event) {
  if (!event || !metricsMenuRef.value) {
    isMetricsOpen.value = false;
    return;
  }
  const target = event.target as Node | null;
  if (target && metricsMenuRef.value.contains(target)) return;
  isMetricsOpen.value = false;
}

onMounted(() => {
  updateScrollState();
  window.addEventListener("scroll", updateScrollState, { passive: true });
  document.addEventListener("click", closeMetricsMenu);
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", updateScrollState);
  document.removeEventListener("click", closeMetricsMenu);
});
</script>

<template>
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
        <RouterLink to="/" class="nav-link" active-class="nav-link--active" end
          >Overview
        </RouterLink>
        <div
          ref="metricsMenuRef"
          class="nav-dropdown"
          :class="isMetricsOpen ? 'nav-dropdown--open' : ''"
        >
          <button
            class="nav-link nav-link--button"
            :class="isMetricsActive ? 'nav-link--active' : ''"
            type="button"
            aria-haspopup="true"
            :aria-expanded="isMetricsOpen"
            aria-controls="metrics-menu"
            @click.stop="isMetricsOpen = !isMetricsOpen"
          >
            Metrics
            <span class="nav-dropdown__chevron" aria-hidden="true">▾</span>
          </button>
          <div id="metrics-menu" class="nav-dropdown__menu" v-show="isMetricsOpen">
            <RouterLink
              to="/metrics"
              class="nav-dropdown__link"
              active-class="nav-dropdown__link--active"
              @click="isMetricsOpen = false"
            >
              List view
            </RouterLink>
            <RouterLink
              to="/graph"
              class="nav-dropdown__link"
              active-class="nav-dropdown__link--active"
              @click="isMetricsOpen = false"
            >
              Graph view
            </RouterLink>
          </div>
        </div>
        <a class="nav-cta" :href="proposeMetricUrl" target="_blank" rel="noopener noreferrer">
          Propose a metric
        </a>
        <div v-if="!isScrolled" class="navbar__social">
          <a
            v-for="link in headerSocialLinks"
            :key="link.id"
            class="social-link"
            :href="link.url"
            target="_blank"
            rel="noopener noreferrer"
            :aria-label="link.ariaLabel"
            :title="link.title"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" :d="link.iconPath" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  </nav>
</template>
