<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { headerSocialLinks, proposeMetricUrl } from "../lib/config";
import logoUrl from "../assets/SPHA_Icon.svg";

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
