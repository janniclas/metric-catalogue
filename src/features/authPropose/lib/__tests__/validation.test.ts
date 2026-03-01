import { describe, expect, it } from "vitest";
import { validateProposal } from "../validation";
import type { ProposalFormState } from "../types";

const baseInput: ProposalFormState = {
  title: "Metric",
  id: "plan-security-coverage",
  phase: "plan",
  description: "Describe it.",
  measurement: "",
  rationale: "",
  notes: "",
  tags: [],
  related_tools: [],
  depends_on: [],
  thresholds: [],
  references: [],
};

describe("validateProposal", () => {
  it("returns valid for a complete proposal", () => {
    const result = validateProposal(baseInput, { phaseIds: ["plan", "code"] });
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it("flags missing required fields", () => {
    const result = validateProposal(
      { ...baseInput, title: "", id: "", phase: "", description: "" },
      { phaseIds: ["plan"] },
    );
    expect(result.isValid).toBe(false);
    expect(result.errors.title).toBeTruthy();
    expect(result.errors.id).toBeTruthy();
    expect(result.errors.phase).toBeTruthy();
    expect(result.errors.description).toBeTruthy();
  });

  it("flags invalid ids", () => {
    const result = validateProposal({ ...baseInput, id: "Invalid Id" }, { phaseIds: ["plan"] });
    expect(result.isValid).toBe(false);
    expect(result.errors.id).toMatch(/kebab-case/);
  });

  it("flags unknown phases", () => {
    const result = validateProposal({ ...baseInput, phase: "build" }, { phaseIds: ["plan"] });
    expect(result.isValid).toBe(false);
    expect(result.errors.phase).toMatch(/known/);
  });

  it("flags invalid thresholds", () => {
    const result = validateProposal(
      {
        ...baseInput,
        thresholds: [{ name: "", value: "" }],
      },
      { phaseIds: ["plan"] },
    );
    expect(result.isValid).toBe(false);
    expect(result.errors.thresholds).toMatch(/threshold/);
  });
});
