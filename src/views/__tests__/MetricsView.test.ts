import { describe, expect, it, beforeEach } from "vitest";
import MetricsView from "../MetricsView.vue";
import { metricsIndexFixture } from "../../test/fixtures/metricsIndex";
import { mockFetch, mountWithRouter, waitFor } from "../../test/utils";

const metricsRoute = {
  path: "/metrics",
  component: MetricsView,
};

const detailRoute = {
  path: "/metrics/:id",
  component: { template: "<div />" },
};

beforeEach(() => {
  mockFetch(metricsIndexFixture);
});

describe("MetricsView", () => {
  it("preselects phase filter from the URL and allows toggling", async () => {
    const { wrapper } = await mountWithRouter(MetricsView, {
      route: "/metrics?phase=plan",
      routes: [metricsRoute, detailRoute],
    });

    await waitFor(() => wrapper.findAll("[data-testid='metric-card']").length > 0);

    const cards = wrapper.findAll("[data-testid='metric-card']");
    expect(cards).toHaveLength(2);

    const planCheckbox = wrapper.find("input[type='checkbox'][value='plan']");
    expect((planCheckbox.element as HTMLInputElement).checked).toBe(true);

    const codeCheckbox = wrapper.find("input[type='checkbox'][value='code']");
    await codeCheckbox.setValue(true);
    await waitFor(() => wrapper.findAll("[data-testid='metric-card']").length === 3);

    const updatedCards = wrapper.findAll("[data-testid='metric-card']");
    expect(updatedCards).toHaveLength(3);
  });

  it("searches across tools and tags", async () => {
    const { wrapper } = await mountWithRouter(MetricsView, {
      route: "/metrics",
      routes: [metricsRoute, detailRoute],
    });

    await waitFor(() => wrapper.findAll("[data-testid='metric-card']").length > 0);

    const searchInput = wrapper.find("input[type='search']");
    await searchInput.setValue("snyk");
    await waitFor(() => wrapper.findAll("[data-testid='metric-card']").length === 1);

    const filteredCards = wrapper.findAll("[data-testid='metric-card']");
    expect(filteredCards).toHaveLength(1);
  });
});
