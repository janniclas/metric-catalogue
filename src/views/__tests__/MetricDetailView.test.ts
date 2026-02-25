import { describe, expect, it, beforeEach, vi } from "vitest";
import MetricDetailView from "../MetricDetailView.vue";
import { metricsIndexFixture } from "../../test/fixtures/metricsIndex";
import { mockFetch, renderWithRouter } from "../../test/utils";

const detailRoute = {
  path: "/metrics/:id",
  component: MetricDetailView,
};

const listRoute = {
  path: "/metrics",
  component: { template: "<div />" },
};

beforeEach(() => {
  mockFetch(metricsIndexFixture);
  vi.stubEnv("VITE_REPO_URL", "https://github.com/example/metric-catalogue");
  vi.stubEnv("VITE_REPO_BRANCH", "main");
});

describe("MetricDetailView", () => {
  it("renders markdown, related metrics, and source link", async () => {
    const { findByText, getByRole } = await renderWithRouter(MetricDetailView, {
      route: "/metrics/plan-security-requirements-coverage",
      routes: [detailRoute, listRoute],
    });

    await findByText("Security Requirements Coverage");
    await findByText("Measure security requirements coverage.");

    const relatedLink = getByRole("link", { name: "Threat Model Coverage" });
    expect(relatedLink.getAttribute("href")).toBe("/metrics/plan-threat-model-coverage");

    const sourceLink = getByRole("link", {
      name: "metrics/plan-security-requirements-coverage.md",
    });
    expect(sourceLink.getAttribute("href")).toBe(
      "https://github.com/example/metric-catalogue/blob/main/metrics/plan-security-requirements-coverage.md"
    );
  });
});
