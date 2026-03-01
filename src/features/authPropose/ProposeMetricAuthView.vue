<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { loadAuthEnv } from "./lib/env";
import { useAuth } from "./lib/auth";
import ProposeMetricForm from "./components/ProposeMetricForm.vue";
import type { ProposalFormState } from "./lib/types";
import { buildIssueBody } from "./lib/buildIssueBody";
import { createIssue, GitHubApiError } from "./lib/githubApi";
import { parseRepoTarget } from "./lib/repo";

let envError: string | null = null;
try {
  loadAuthEnv();
} catch (err) {
  envError = err instanceof Error ? err.message : "Auth configuration error.";
}

const route = useRoute();
const router = useRouter();
const { status, username, error, startLogin, handleCallback, logout, clearError, accessToken } =
  useAuth();

const authError = computed(() => envError ?? error.value);
const isAuthenticating = computed(() => status.value === "authenticating");
const isAuthenticated = computed(() => status.value === "authenticated");
const canLogin = computed(() => !envError && !isAuthenticating.value);

const submitStatus = ref<"idle" | "submitting" | "success" | "error">("idle");
const submitError = ref<string | null>(null);
const submitIssueUrl = ref<string | null>(null);

const isSubmitting = computed(() => submitStatus.value === "submitting");
const isFormDisabled = computed(
  () => !isAuthenticated.value || isAuthenticating.value || isSubmitting.value || !!envError,
);

const submitLabel = computed(() => {
  if (!isAuthenticated.value) return "Login required";
  if (isSubmitting.value) return "Creating issue…";
  return "Create GitHub issue";
});

function extractQueryParam(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

async function handleSubmit(payload: ProposalFormState) {
  if (isSubmitting.value) return;
  if (!isAuthenticated.value || !accessToken.value) {
    submitStatus.value = "error";
    submitError.value = "Please log in with GitHub before submitting.";
    return;
  }

  submitStatus.value = "submitting";
  submitError.value = null;
  submitIssueUrl.value = null;

  try {
    const env = loadAuthEnv();
    const { owner, repo } = parseRepoTarget(env.repoUrl);
    const title = `Metric proposal: ${payload.title}`;
    const body = buildIssueBody(payload);

    const issue = await createIssue({
      token: accessToken.value,
      owner,
      repo,
      title,
      body,
      labels: ["metric-proposal"],
    });

    submitIssueUrl.value = issue.htmlUrl;
    submitStatus.value = "success";
  } catch (err) {
    submitStatus.value = "error";
    if (err instanceof GitHubApiError) {
      if (err.kind === "unauthorized") {
        submitError.value = "GitHub authorization expired. Please log in again.";
      } else if (err.kind === "rate_limited") {
        submitError.value = "GitHub rate limit reached. Please try again later.";
      } else if (err.kind === "forbidden") {
        submitError.value = "GitHub rejected the request. Check repository permissions.";
      } else {
        submitError.value = err.message;
      }
    } else {
      if (import.meta.env.DEV) {
        console.error(err);
      } else {
        console.error("Issue submission failed.");
      }
      submitError.value = "Network error. Please try again.";
    }
  }
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

        <ProposeMetricForm
          class="propose-form-wrapper"
          :disabled="isFormDisabled"
          :submit-label="submitLabel"
          @submit="handleSubmit"
        />

        <div v-if="submitStatus === 'submitting'" class="state">Creating GitHub issue…</div>
        <div v-if="submitStatus === 'success' && submitIssueUrl" class="state state--success">
          Issue created: <a :href="submitIssueUrl" target="_blank" rel="noopener noreferrer">View on GitHub</a>
        </div>
        <div v-if="submitStatus === 'error' && submitError" class="state state--error">
          {{ submitError }}
        </div>
      </div>
    </section>
  </div>
</template>
