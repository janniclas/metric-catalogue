## Summary
Describe the metric and why it should be added.

## Metric Markdown (copy into a new file under `metrics/`)
```md
---
id: metric-id
title: Metric Title
phase: plan
tags:
  - example-tag
related_tools:
  - example-tool
depends_on:
  - parent-metric-id
thresholds:
  - name: Target threshold
    value: "<= 5%"
    description: Optional clarification for the threshold.
references:
  - https://example.com/reference
---

# Description
Describe what the metric measures and why it matters.

# Measurement
Explain how to measure the metric and what data sources are needed.

# Notes
Add any caveats, constraints, or interpretation guidance.
```

## Checklist
- [ ] The metric follows `metrics/README.md` schema.
- [ ] Frontmatter is valid and required fields are present.
- [ ] `depends_on` references existing metric ids.
- [ ] `npm run metrics:build` succeeds locally.
