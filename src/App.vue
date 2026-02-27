<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { RouterLink, RouterView } from "vue-router";
import { getProposeMetricUrl } from "./lib/proposeMetric";
import logoUrl from "./assets/SPHA_Icon.svg";

const proposeMetricUrl = getProposeMetricUrl();
const githubUrl = "https://github.com/fraunhofer-iem/spha";
const linkedinUrl = "https://www.linkedin.com/company/software-product-health-assistant";
const fraunhoferUrl = "https://www.iem.fraunhofer.de";
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
          <div v-if="!isScrolled" class="navbar__social">
            <a
              class="social-link"
              :href="githubUrl"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="SPHA on GitHub"
              title="GitHub"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75 0 4.311 2.787 7.964 6.657 9.254.486.09.663-.205.663-.462 0-.23-.009-.999-.013-1.812-2.706.588-3.277-1.156-3.277-1.156-.442-1.124-1.08-1.423-1.08-1.423-.883-.603.067-.592.067-.592 1.0.07 1.528 1.026 1.528 1.026.888 1.521 2.332 1.083 2.9.827.09-.643.348-1.083.633-1.332-2.16-.246-4.432-1.08-4.432-4.806 0-1.061.378-1.928 1.0-2.606-.1-.246-.433-1.237.095-2.578 0 0 .816-.261 2.67.996a9.23 9.23 0 0 1 2.43-.327c.825.004 1.656.111 2.43.327 1.852-1.257 2.667-.996 2.667-.996.53 1.341.197 2.332.097 2.578.623.678 1.0 1.545 1.0 2.606 0 3.735-2.276 4.556-4.442 4.797.357.307.675.912.675 1.839 0 1.328-.013 2.397-.013 2.723 0 .26.174.556.67.462 3.867-1.292 6.65-4.943 6.65-9.253 0-5.385-4.365-9.75-9.75-9.75Z"
                />
              </svg>
            </a>
            <a
              class="social-link"
              :href="linkedinUrl"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="SPHA on LinkedIn"
              title="LinkedIn"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M5.5 8.5h-3v10h3v-10Zm.25-3.25a1.75 1.75 0 1 1-3.5 0 1.75 1.75 0 0 1 3.5 0ZM20.5 12.75v5.75h-3v-5.35c0-1.335-.475-2.245-1.665-2.245-.91 0-1.45.61-1.69 1.198-.088.213-.11.51-.11.807v5.59h-3s.04-9.07 0-10h3v1.416c.398-.615 1.11-1.49 2.705-1.49 1.975 0 3.46 1.29 3.46 4.074Z"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </nav>
    <main class="app-content">
      <RouterView />
    </main>
    <footer class="site-footer">
      <div class="footer__inner">
        <div class="footer__links">
          <a
            class="footer-link"
            :href="githubUrl"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75 0 4.311 2.787 7.964 6.657 9.254.486.09.663-.205.663-.462 0-.23-.009-.999-.013-1.812-2.706.588-3.277-1.156-3.277-1.156-.442-1.124-1.08-1.423-1.08-1.423-.883-.603.067-.592.067-.592 1.0.07 1.528 1.026 1.528 1.026.888 1.521 2.332 1.083 2.9.827.09-.643.348-1.083.633-1.332-2.16-.246-4.432-1.08-4.432-4.806 0-1.061.378-1.928 1.0-2.606-.1-.246-.433-1.237.095-2.578 0 0 .816-.261 2.67.996a9.23 9.23 0 0 1 2.43-.327c.825.004 1.656.111 2.43.327 1.852-1.257 2.667-.996 2.667-.996.53 1.341.197 2.332.097 2.578.623.678 1.0 1.545 1.0 2.606 0 3.735-2.276 4.556-4.442 4.797.357.307.675.912.675 1.839 0 1.328-.013 2.397-.013 2.723 0 .26.174.556.67.462 3.867-1.292 6.65-4.943 6.65-9.253 0-5.385-4.365-9.75-9.75-9.75Z"
              />
            </svg>
            GitHub
          </a>
          <a
            class="footer-link"
            :href="linkedinUrl"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M5.5 8.5h-3v10h3v-10Zm.25-3.25a1.75 1.75 0 1 1-3.5 0 1.75 1.75 0 0 1 3.5 0ZM20.5 12.75v5.75h-3v-5.35c0-1.335-.475-2.245-1.665-2.245-.91 0-1.45.61-1.69 1.198-.088.213-.11.51-.11.807v5.59h-3s.04-9.07 0-10h3v1.416c.398-.615 1.11-1.49 2.705-1.49 1.975 0 3.46 1.29 3.46 4.074Z"
              />
            </svg>
            LinkedIn
          </a>
          <a
            class="footer-link"
            :href="fraunhoferUrl"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 2.5a9.5 9.5 0 1 0 0 19 9.5 9.5 0 0 0 0-19Zm6.98 9.25h-3.03c-.1-2.165-.567-4.19-1.35-5.62a7.53 7.53 0 0 1 4.38 5.62Zm-6.98 7.0c-.9 0-2.16-2.09-2.38-5.0h4.76c-.22 2.91-1.48 5.0-2.38 5.0Zm-2.38-7.0c.22-2.91 1.48-5.0 2.38-5.0s2.16 2.09 2.38 5.0h-4.76Zm-.25-5.62c-.783 1.43-1.25 3.455-1.35 5.62H5.02a7.53 7.53 0 0 1 4.35-5.62Zm-4.35 7.62h3.03c.1 2.165.567 4.19 1.35 5.62a7.53 7.53 0 0 1-4.38-5.62Zm9.63 5.62c.783-1.43 1.25-3.455 1.35-5.62h3.03a7.53 7.53 0 0 1-4.38 5.62Z"
              />
            </svg>
            Fraunhofer IEM
          </a>
        </div>
      </div>
    </footer>
  </div>
</template>
