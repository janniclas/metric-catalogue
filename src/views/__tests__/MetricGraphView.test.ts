import { describe, expect, it } from "vitest";
import MetricGraphView from "../MetricGraphView.vue";
import { metricsIndexFixture } from "../../test/fixtures/metricsIndex";
import { flushPromises, mockFetch, renderWithRouter, waitFor } from "../../test/utils";

function buildMetricsIndex(count: number) {
  const metrics = Array.from({ length: count }, (_, index) => ({
    id: `metric-${index + 1}`,
    title: `Metric ${index + 1}`,
    phase: "plan",
    markdown: `# Description\nMetric ${index + 1} description.`,
    source_path: `metrics/metric-${index + 1}.md`,
  }));

  return {
    generated_at: "2026-02-25T00:00:00.000Z",
    phases: [
      {
        id: "plan",
        name: "Plan",
        description: "Define security goals.",
        icon: "calendar",
        order: 1,
      },
    ],
    metrics,
  };
}

describe("MetricGraphView", () => {
  it("shows the expand action when more than 30 metrics are present", async () => {
    mockFetch(buildMetricsIndex(31));

    const { getByText } = await renderWithRouter(MetricGraphView, {
      route: "/graph",
      routes: [{ path: "/graph", component: MetricGraphView }],
    });

    await flushPromises();

    expect(getByText("Show all metrics")).toBeTruthy();
  });

  it("hides the expand action when 30 or fewer metrics are present", async () => {
    mockFetch(metricsIndexFixture);

    const { queryByText } = await renderWithRouter(MetricGraphView, {
      route: "/graph",
      routes: [{ path: "/graph", component: MetricGraphView }],
    });

    await flushPromises();

    expect(queryByText("Show all metrics")).toBeNull();
  });

  it("shows phase details when clicking a phase node", async () => {
    mockFetch(metricsIndexFixture);

    const { getAllByText, getByText, container } = await renderWithRouter(MetricGraphView, {
      route: "/graph",
      routes: [{ path: "/graph", component: MetricGraphView }],
    });

    await flushPromises();

    await waitFor(() => getAllByText("Plan").length > 0);

    const phaseLabels = getAllByText("Plan");
    phaseLabels[0].dispatchEvent(new MouseEvent("click", { bubbles: true }));

    await waitFor(() => !!getByText("SSDLC phase"));

    expect(getByText("Define security goals.")).toBeTruthy();
    expect(container.querySelector(".catalogue-graph__node--phase.is-highlighted")).toBeTruthy();
  });
});
