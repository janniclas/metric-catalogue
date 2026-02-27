<script setup lang="ts">
import type { Component } from "vue";
import { computed } from "vue";
import { CircleCheck, ClipboardList, Search } from "lucide-vue-next";
import { useMetricsCatalogue } from "../lib/useMetricsCatalogue";

type Step = {
  title: string;
  description: string;
  icon: Component;
  step: string;
};

const steps: Step[] = [
  {
    title: "Review existing coverage",
    description:
      "Start with the metrics list and graph view to see what already exists, which phases are covered, and how metrics depend on each other.",
    icon: Search,
    step: "01",
  },
  {
    title: "Submit a proposal",
    description:
      "Use the issue form to propose a new metric. The automation turns your submission into a pull request, so you do not need to clone the repo.",
    icon: ClipboardList,
    step: "02",
  },
  {
    title: "Review, refine, merge",
    description:
      "Maintainers validate schema rules, check dependencies, and help refine the measurement guidance before merging into the catalogue.",
    icon: CircleCheck,
    step: "03",
  },
];

const { phases, metrics, loading, formattedUpdatedAt } = useMetricsCatalogue();

const metricsCount = computed(() => metrics.value.length);
const phasesCount = computed(() => phases.value.length);
</script>

<template>
  <div class="app">
    <section class="section section--light">
      <div class="container intro__grid">
        <div class="intro__copy">
          <p class="eyebrow">What lives here</p>
          <div class="section-header">
            <h2>Actionable security metrics for real delivery teams.</h2>
          </div>
          <p class="section-subtitle">
            The catalogue focuses on product-facing, measurable security metrics that can be
            implemented in the SSDLC. Each metric is mapped to a lifecycle phase, grounded in
            concrete activities, and paired with tools that can supply the data. The intent is to
            make security measurement practical, repeatable, and connected to everyday delivery
            work.
          </p>
          <p class="section-subtitle">
            We are building this as a community project so teams can share what works, refine
            definitions together, and keep the catalogue current as tooling and practices evolve.
          </p>
        </div>
        <div class="intro__visual">
          <div class="intro__art">Community-driven</div>
          <div class="stat-grid">
            <div class="stat-card">
              <span class="stat-label">Phases</span>
              <span class="stat-value">{{ loading ? "…" : phasesCount }}</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">Metrics</span>
              <span class="stat-value">{{ loading ? "…" : metricsCount }}</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">Last updated</span>
              <span class="stat-value">{{ formattedUpdatedAt || "—" }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section section--dark">
      <div class="container">
        <p class="eyebrow">Workflow</p>
        <div class="section-header">
          <h2>How to propose new metrics.</h2>
          <p class="section-subtitle">
            Proposals are issue-driven and turned into pull requests automatically. If you prefer
            a manual PR, use the template in <code>metrics/templates/metric.md</code>.
          </p>
        </div>
        <div class="phase-grid">
          <div
            v-for="(step, index) in steps"
            :key="step.title"
            class="phase-card"
            :style="{ '--delay': index }"
          >
            <div class="phase-card__header">
              <h3 class="phase-card__title">{{ step.title }}</h3>
              <div class="phase-card__icon">
                <component :is="step.icon" :size="22" />
              </div>
            </div>
            <p class="phase-card__desc">{{ step.description }}</p>
            <div class="phase-card__meta">
              <span class="meta-value">{{ step.step }}</span>
              <span class="meta-label">step</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section section--light">
      <div class="container">
        <p class="eyebrow">Schema</p>
        <div class="section-header">
          <h2>Metric anatomy at a glance.</h2>
          <p class="section-subtitle">
            Every metric includes required identifiers, optional metadata for filtering, and a
            Markdown body that explains how to measure it.
          </p>
        </div>
        <div class="about-grid">
          <div class="metric-card">
            <p class="metric-phase">Required</p>
            <h3>Frontmatter basics</h3>
            <ul class="about-list">
              <li><code>id</code> (unique, kebab-case recommended)</li>
              <li><code>title</code> (human-readable name)</li>
              <li><code>phase</code> (one of the SSDLC phase ids)</li>
            </ul>
          </div>
          <div class="metric-card">
            <p class="metric-phase">Optional</p>
            <h3>Metadata for filtering</h3>
            <ul class="about-list">
              <li><code>thresholds</code> for target values</li>
              <li><code>tags</code> and <code>related_tools</code> for discovery</li>
              <li><code>depends_on</code> and <code>references</code> for context</li>
            </ul>
          </div>
          <div class="metric-card">
            <p class="metric-phase">Body</p>
            <h3>Markdown guidance</h3>
            <ul class="about-list">
              <li>Description and rationale</li>
              <li>Measurement steps and data sources</li>
              <li>Notes, caveats, and interpretation</li>
            </ul>
          </div>
          <div class="metric-card">
            <p class="metric-phase">Validation</p>
            <h3>Guardrails</h3>
            <ul class="about-list">
              <li>Unique ids and known phases</li>
              <li>Non-empty markdown body</li>
              <li>Dependencies must exist</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
