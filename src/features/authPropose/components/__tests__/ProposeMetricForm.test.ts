import { fireEvent, render } from "@testing-library/vue";
import { describe, expect, it, vi } from "vitest";
import ProposeMetricForm from "../ProposeMetricForm.vue";
import { metricsIndexFixture } from "../../../../test/fixtures/metricsIndex";
import { flushPromises, mockFetch } from "../../../../test/utils";

describe("ProposeMetricForm", () => {
  it("submits a valid proposal", async () => {
    mockFetch(metricsIndexFixture);
    const onSubmit = vi.fn();

    const { getByLabelText, getByRole } = render(ProposeMetricForm, {
      props: {
        disabled: false,
        onSubmit,
      },
    });

    await flushPromises();

    await fireEvent.update(
      getByLabelText("Metric title") as HTMLInputElement,
      "Security Requirements Coverage",
    );
    await fireEvent.update(
      getByLabelText("Metric id") as HTMLInputElement,
      "plan-new-metric",
    );
    await fireEvent.update(getByLabelText("SSDLC phase") as HTMLSelectElement, "plan");
    await fireEvent.update(
      getByLabelText("Description") as HTMLTextAreaElement,
      "Describe the metric.",
    );

    await fireEvent.click(getByRole("button", { name: /submit proposal/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const call = onSubmit.mock.calls[0];
    if (!call) {
      throw new Error("Expected submit to be called.");
    }
    const payload = call[0];
    expect(payload).toMatchObject({
      title: "Security Requirements Coverage",
      id: "plan-new-metric",
      phase: "plan",
      description: "Describe the metric.",
    });
  });

  it("blocks submit when required fields are missing", async () => {
    mockFetch(metricsIndexFixture);
    const onSubmit = vi.fn();

    const { getByRole } = render(ProposeMetricForm, {
      props: {
        disabled: false,
        onSubmit,
      },
    });

    await flushPromises();

    await fireEvent.click(getByRole("button", { name: /submit proposal/i }));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("blocks submit when metric id already exists", async () => {
    mockFetch(metricsIndexFixture);
    const onSubmit = vi.fn();

    const { getByLabelText, getByRole, findByText } = render(ProposeMetricForm, {
      props: {
        disabled: false,
        onSubmit,
      },
    });

    await flushPromises();

    await fireEvent.update(
      getByLabelText("Metric title") as HTMLInputElement,
      "Security Requirements Coverage",
    );
    await fireEvent.update(
      getByLabelText("Metric id") as HTMLInputElement,
      "plan-security-requirements-coverage",
    );
    await fireEvent.update(getByLabelText("SSDLC phase") as HTMLSelectElement, "plan");
    await fireEvent.update(
      getByLabelText("Description") as HTMLTextAreaElement,
      "Describe the metric.",
    );

    await fireEvent.click(getByRole("button", { name: /submit proposal/i }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(await findByText(/already exists/i)).toBeTruthy();
  });
});
