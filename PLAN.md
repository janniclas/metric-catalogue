# Metric Catalogue Website Plan

## Goals
- Build a web UI to browse a security metrics catalogue, with default SSDLC phase overview and top-level metrics.
- Provide a full metrics list with filtering by properties such as related tools, tags, thresholds, phases, and dependencies.
- Store metrics as Markdown in a GitHub repository, accessible without the website.
- Support proposing new metrics by generating a pull request in the GitHub repo.
- Provide templates for a metric Markdown file and a pull request.

## Decisions
- The metrics Markdown files and website sources live in the same repository.
- The website will be hosted on GitHub Pages.
- No GitHub OAuth. The website will describe the PR workflow and link to a prefilled PR template.
- Schema validation in CI is required for Markdown metrics.

## Proposed Data Model
- Directory structure: `metrics/` with one Markdown file per metric and optional `phases/` overview.
- Frontmatter schema in each metric file, including: `id`, `title`, `phase`, `description`, `thresholds`, `tags`, `related_tools`, `depends_on`, `references`.
- Optional `metrics/index.json` generated from Markdown frontmatter for faster client-side loading.
- Backward-compatible: metrics remain readable in raw Markdown on GitHub.

## UI And UX Plan
1. Phase Overview Screen
1. Display SSDLC phases as cards or a visual timeline.
1. Show top-level metrics per phase with quick drill-down.
1. Provide a global search and a “view all metrics” entry point.

2. Metrics List Screen
1. Full list view with filter panel and search.
1. Filters by phase, tags, thresholds, related tools, and dependencies.
1. Support multi-select filters and clear-all.
1. Show key metadata at a glance, with detail page or drawer.

3. Metric Detail View
1. Render Markdown content with structured metadata.
1. Show dependency graph or list of child metrics.
1. Links to related tools and references.

## Contribution And PR Flow
- Provide a “Propose a metric” form in the UI.
- Generate a metric Markdown file from form data using the template.
- Use a pre-filled “Create PR” link that opens GitHub with the new file content.
- Add a PR template in `.github/PULL_REQUEST_TEMPLATE.md` aligned with the metric template.

## Implementation Steps
1. Repository Setup And Structure
1. Add `metrics/` directory with initial example metrics and phase taxonomy.
1. Add metric Markdown template file and PR template.

2. Data Ingestion Layer
1. Parse Markdown + frontmatter at build time or runtime.
1. Build a normalized in-memory model for filtering.
1. Add optional JSON index generation script for speed.

3. Frontend Screens
1. Build phase overview and top-level metrics view.
1. Build full list with filters, search, and summary cards.
1. Build metric detail view and dependency display.

4. Contribution Workflow
1. Build “Propose a metric” form and validation.
1. Implement PR creation flow using the pre-filled PR link.
1. Add success and error states.

5. Quality And Docs
1. Add schema validation (required CI check).
1. Document metric format and contribution steps in README.

## Deliverables
- Metric Markdown template and PR template.
- Vue UI for phase overview, list, filters, and detail.
- Metrics stored in GitHub as Markdown and accessible directly.
- Contribution flow that produces a PR.

## Next Confirmation Needed
- Confirm exact metadata fields and SSDLC phase taxonomy.
- Confirm the CI validation approach and tooling.
