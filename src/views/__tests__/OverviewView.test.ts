import { describe, expect, it, beforeEach } from "vitest";
import OverviewView from "../OverviewView.vue";
import { metricsIndexFixture } from "../../test/fixtures/metricsIndex";
import { mockFetch, mountWithRouter, waitFor } from "../../test/utils";

const overviewRoute = {
  path: "/",
  component: OverviewView,
};

const metricsRoute = {
  path: "/metrics",
  component: { template: "<div />" },
};

beforeEach(() => {
  mockFetch(metricsIndexFixture);
});

describe("OverviewView", () => {
  it("links phase cards to metrics with preselected phase", async () => {
    const { wrapper } = await mountWithRouter(OverviewView, {
      route: "/",
      routes: [overviewRoute, metricsRoute],
    });

    await waitFor(() => wrapper.text().includes("Plan"));
    const planLink = wrapper
      .findAll("a")
      .find((node) => node.attributes("href") === "/metrics?phase=plan");
    expect(planLink).toBeTruthy();
  });
});
