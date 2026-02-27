# Cleanup TODOs (Proposal)

Context: Review of the current implementation with a focus on redundancy reduction, security hardening, and general best practices.

**Security + Correctness**
- [x] Validate `phase` in `scripts/issue-to-metric.ts` against known phase IDs from `metrics/phases.json` (or a shared schema) to prevent invalid phases and path traversal; add coverage in `scripts/__tests__/issue-to-metric.test.ts`.
- [x] Replace hand-built YAML in `scripts/issue-to-metric.ts` with a real YAML serializer to prevent malformed frontmatter when fields contain `:`/`#`/newlines; update tests in `scripts/__tests__/issue-to-metric.test.ts`.
- [x] Harden markdown rendering in `src/lib/markdown.ts`: restrict allowed URI protocols, and enforce safe link attributes (e.g., `rel="noopener noreferrer"`) when external links are rendered.
- [x] Add runtime validation or safe parsing for the metrics index in `src/lib/metrics.ts` to avoid silent UI failures on malformed JSON.

**De-duplication + Structure**
- [ ] Centralize shared lookups in `src/lib/useMetricsCatalogue.ts` (e.g., `phaseLabelMap`, `phaseById`, `metricById`, `metricsByPhase`) and reuse them in `src/views/OverviewView.vue`, `src/views/MetricsView.vue`, `src/views/MetricDetailView.vue`.
- [ ] Extract header/footer markup in `src/App.vue` into components (e.g., `src/components/AppHeader.vue`, `src/components/AppFooter.vue`) and reuse shared icon/link data to remove duplication.
- [ ] Extract the metric card markup in `src/views/MetricsView.vue` into `src/components/MetricCard.vue` for easier reuse and cleaner templates.
- [ ] Move global constants (e.g., repo/social URLs, propose-metric URL) into a single config module like `src/lib/config.ts` and consume from `src/App.vue`, `src/views/OverviewView.vue`, `src/views/MetricDetailView.vue`.

**Performance + UX**
- [ ] Precompute a normalized search index for metrics (e.g., `searchText`) in `src/lib/useMetricsCatalogue.ts` or a dedicated composable to avoid rebuilding large strings on every filter change in `src/views/MetricsView.vue`.
- [ ] Provide a graceful fallback icon when `phase.icon` is missing or unknown (currently `iconMap[phase.icon]` can be `undefined`) in `src/views/OverviewView.vue`.

**Best Practices + Maintainability**
- [ ] Add `src/env.d.ts` to type `import.meta.env` values like `VITE_REPO_URL`, `VITE_REPO_BRANCH`, `VITE_BASE_PATH` instead of casting in `src/views/MetricDetailView.vue`.
- [ ] Normalize formatting across `src/views/MetricsView.vue` and `vite.config.ts` and introduce a formatter/linter config to keep it consistent.
- [ ] Update `README.md` to reflect the actual project (not the Vite template) and document build/test commands plus the metrics ingestion workflow.

**Tests**
- [ ] Ensure global stubs are cleaned between tests by adding `vi.unstubAllGlobals()` (or equivalent) in `src/test/setup.ts` to avoid cross-test leakage from `vi.stubGlobal`.
- [ ] Add a focused unit test for the filter logic once it’s extracted (e.g., from `src/views/MetricsView.vue`) to prevent regressions in tag/tool/phase matching.

**Implementation Notes**
- Added phase validation against `metrics/phases.json` in `scripts/issue-to-metric.ts` (new `--phases-file` optional argument). Tests now write a phases fixture and cover unknown phases.
- Replaced manual YAML frontmatter with `yaml` serialization and updated tests to parse frontmatter via `gray-matter` (covers special characters like `:` and `#`).
- Hardened markdown rendering by restricting URI protocols and enforcing `rel="noopener noreferrer"` + `target="_blank"` for external links; added tests for unsafe links and external link attributes.
- Added runtime validation for the metrics index in `src/lib/metrics.ts` using `zod`; added client-side unit tests for valid/invalid payloads.
