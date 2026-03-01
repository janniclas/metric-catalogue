import { describe, expect, it } from "vitest";
import { buildIssueBody } from "../buildIssueBody";

const baseInput = {
  title: "Security Requirements Coverage",
  id: "plan-security-requirements-coverage",
  phase: "plan",
  description: "Describe the metric.",
};

describe("buildIssueBody", () => {
  it("builds the issue body with required headings and placeholders", () => {
    const body = buildIssueBody(baseInput);
    expect(body).toMatchInlineSnapshot(`
"### Metric title\n\nSecurity Requirements Coverage\n\n### Metric id\n\nplan-security-requirements-coverage\n\n### SSDLC phase\n\nplan\n\n### Description\n\nDescribe the metric.\n\n### Measurement\n\n_No response_\n\n### Rationale\n\n_No response_\n\n### Tags (comma-separated)\n\n_No response_\n\n### Related tools (comma-separated)\n\n_No response_\n\n### Depends on (comma-separated metric ids)\n\n_No response_\n\n### Thresholds (one per line)\n\n_No response_\n\n### References (one URL per line)\n\n_No response_\n\n### Notes\n\n_No response_\n\n"
`);
  });

  it("formats thresholds and list fields", () => {
    const body = buildIssueBody({
      ...baseInput,
      tags: ["requirements", "governance"],
      related_tools: ["jira", "github"],
      depends_on: ["plan-threat-model-coverage"],
      thresholds: [
        { name: "Coverage target", value: ">= 90%" },
        { name: "Target", value: "95%", description: "Stretch goal" },
      ],
      references: ["https://owasp.org/asvs"],
      measurement: "Measure the metric.",
      rationale: "Explain why it matters.",
      notes: "Extra notes.",
    });

    expect(body).toContain("Coverage target | >= 90%");
    expect(body).toContain("Target | 95% | Stretch goal");
    expect(body).toContain("requirements, governance");
    expect(body).toContain("jira, github");
    expect(body).toContain("plan-threat-model-coverage");
    expect(body).toContain("https://owasp.org/asvs");
  });

  it("throws when threshold entries are invalid", () => {
    expect(() =>
      buildIssueBody({
        ...baseInput,
        thresholds: [{ name: "", value: "" }],
      }),
    ).toThrow(/threshold/);
  });
});
