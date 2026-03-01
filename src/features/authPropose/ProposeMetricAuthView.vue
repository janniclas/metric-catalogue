<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { loadAuthEnv } from "./lib/env";
import { useAuth } from "./lib/auth";

let envError: string | null = null;
try {
  loadAuthEnv();
} catch (err) {
  envError = err instanceof Error ? err.message : "Auth configuration error.";
}

const route = useRoute();
const router = useRouter();
const { status, username, error, startLogin, handleCallback, logout, clearError } = useAuth();

const authError = computed(() => envError ?? error.value);
const isAuthenticating = computed(() => status.value === "authenticating");
const isAuthenticated = computed(() => status.value === "authenticated");
const canLogin = computed(() => !envError && !isAuthenticating.value);

function extractQueryParam(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

onMounted(async () => {
  if (envError) return;
  const code = extractQueryParam(route.query.code);
  const state = extractQueryParam(route.query.state);
  const oauthError = extractQueryParam(route.query.error);
  const oauthErrorDescription = extractQueryParam(route.query.error_description);

  if (code || state || oauthError) {
    await handleCallback({
      code,
      state,
      error: oauthError,
      errorDescription: oauthErrorDescription,
    });
    const nextQuery = { ...route.query };
    delete nextQuery.code;
    delete nextQuery.state;
    delete nextQuery.error;
    delete nextQuery.error_description;
    await router.replace({ query: nextQuery });
  }
});
</script>

<template>
  <div class="app">
    <section class="section">
      <div class="container">
        <h1>Propose a metric</h1>
        <p class="subtitle">
          Create a proposal directly from the app. You’ll need to authenticate with GitHub.
        </p>

        <div class="state-card">
          <p v-if="!isAuthenticated" class="state">
            You must log in with GitHub to submit a proposal.
          </p>
          <p v-else class="state">Logged in as <strong>{{ username }}</strong>.</p>
          <p v-if="isAuthenticated" class="state state--subtle">
            Authentication is temporary and will reset on refresh.
          </p>

          <div class="state-actions">
            <button v-if="!isAuthenticated" class="primary" :disabled="!canLogin" @click="startLogin">
              Login with GitHub
            </button>
            <button v-else class="ghost" type="button" @click="logout">Logout</button>
          </div>

          <div v-if="isAuthenticating" class="state">Authenticating…</div>

          <pre v-if="authError" class="state state--error">
{{ authError }}
          </pre>
          <button v-if="authError && !envError" class="ghost" type="button" @click="clearError">
            Dismiss error
          </button>
        </div>
      </div>
    </section>
  </div>
</template>
