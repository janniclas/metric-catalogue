# Metric Catalogue

A Vue 3 + Vite app that renders a catalogue of SSDLC security metrics sourced from Markdown files in `metrics/`.

**Requirements**
- Node.js + npm

**Development**
```sh
npm install
npm run dev
```

**Build**
```sh
npm run metrics:build
npm run build
```

**Tests**
```sh
npm test
```

**Formatting**
```sh
npm run format
npm run format:fix
```

**Metrics Data**
- Metrics live under `metrics/` as Markdown with YAML frontmatter.
- `metrics/phases.json` defines available phases.
- `scripts/build-metrics-index.ts` validates and generates `public/metrics/index.json`.

**Environment Variables**
- `VITE_BASE_PATH`: base path for deployments (used by Vite).
- `VITE_REPO_URL`: repository URL used to link to source files.
- `VITE_REPO_BRANCH`: repository branch for source links (defaults to `main`).
