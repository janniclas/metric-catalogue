import { describe, expect, it, beforeEach, vi } from "vitest";
import MetricDetailView from "../MetricDetailView.vue";
import { metricsIndexFixture } from "../../test/fixtures/metricsIndex";
import { mockFetch, mountWithRouter, waitFor } from "../../test/utils";

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
    const { wrapper } = await mountWithRouter(MetricDetailView, {
      route: "/metrics/plan-security-requirements-coverage",
      routes: [detailRoute, listRoute],
    });

    await waitFor(() => wrapper.text().includes("Security Requirements Coverage"));
    expect(wrapper.text()).toContain("Security Requirements Coverage");
    expect(wrapper.text()).toContain("Measure security requirements coverage.");

    const relatedLink = wrapper
      .findAll("a")
      .find((node) => node.text().trim() === "Threat Model Coverage");
    expect(relatedLink?.attributes("href")).toBe("/metrics/plan-threat-model-coverage");

    const sourceLink = wrapper
      .findAll("a")
      .find((node) => node.text().trim() === "metrics/plan-security-requirements-coverage.md");
    expect(sourceLink?.attributes("href")).toBe(
      "https://github.com/example/metric-catalogue/blob/main/metrics/plan-security-requirements-coverage.md"
    );
  });
});
