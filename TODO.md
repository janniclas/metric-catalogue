# Metric Catalogue Implementation To-Do (Phase 1)

## 1) Confirm Core Tech Decisions
- Data format: Markdown files with YAML frontmatter in `metrics/`.
- Frontmatter parser: use `front-matter`.
- Markdown renderer: use `marked` for client-side rendering and sanitize HTML with `DOMPurify`.
- Schema validation: use `zod` for frontmatter validation in a CI script.
- Index generation: add a Node script to create `metrics/index.json` from frontmatter.
- Hosting: GitHub Pages with Vite (confirm `base` path in `vite.config.ts`).

## 2) Define Minimal Metric Schema (v1)
- Required fields: `id`, `title`, `phase`.
- Optional fields: `thresholds`, `tags`, `related_tools`, `depends_on`, `references`.
- SSDLC phase taxonomy: Plan, Code, Build, Test, Release, Deploy, Operate, Monitor.
- Phase metadata: include `description` and `icon` fields.
- Dependency rules: confirm how hierarchical metrics are represented (`depends_on` list of ids).

## 3) Establish Repository Structure
- Create `metrics/` directory for Markdown files.
- Add `metrics/README.md` describing the schema briefly.
- Add `metrics/templates/metric.md` template.
- Add `.github/PULL_REQUEST_TEMPLATE.md` aligned with schema.

## 4) Implement Data Ingestion (Build-Time First)
- Add a Node script (e.g., `scripts/build-metrics-index.ts`) to parse Markdown and emit `metrics/index.json`.
- Validate frontmatter against schema during index generation (fail on invalid).
- Decide whether to run script as part of `npm run build` or separate `npm run metrics:build`.

## 5) CI Validation Setup (Minimal)
- Add a CI step to run the index generation + schema validation.
- Decide CI provider: GitHub Actions.
- Decide trigger: pull requests to `main`.

## Open Questions For Phase 1
- Confirm the icon format for phases (e.g., icon name, SVG path, or emoji).
