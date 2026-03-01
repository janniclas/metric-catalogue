<script setup lang="ts">
import { loadAuthEnv } from "./lib/env";

let envError: string | null = null;
try {
  loadAuthEnv();
} catch (err) {
  envError = err instanceof Error ? err.message : "Auth configuration error.";
}
</script>

<template>
  <div class="app">
    <section class="section">
      <div class="container">
        <h1>Propose a metric</h1>
        <pre v-if="envError" class="state state--error">{{ envError }}</pre>
        <p v-else>Authenticated proposal flow coming soon.</p>
      </div>
    </section>
  </div>
</template>
