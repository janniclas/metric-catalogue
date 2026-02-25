<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";
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
        <button class="ghost" type="button">Propose a metric</button>
      </div>
    </nav>
    <main class="app-content">
      <RouterView />
    </main>
  </div>
</template>
