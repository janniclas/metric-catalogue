import type { Threshold } from "../../../lib/metrics";
import { formatThresholdLines } from "./validation";

type IssueBodyInput = {
  title: string;
  id: string;
  phase: string;
  description: string;
  measurement?: string;
  rationale?: string;
  notes?: string;
  tags?: string[];
  related_tools?: string[];
  depends_on?: string[];
  thresholds?: Threshold[];
  references?: string[];
};

const NO_RESPONSE = "_No response_";

function formatList(values?: string[]) {
  if (!values || values.length === 0) return NO_RESPONSE;
  return values.join(", ");
}

function formatLines(values?: string[]) {
  if (!values || values.length === 0) return NO_RESPONSE;
  return values.join("\n");
}

function formatThresholds(thresholds?: Threshold[]) {
  if (!thresholds || thresholds.length === 0) return NO_RESPONSE;
  return formatThresholdLines(thresholds).join("\n");
}

function section(label: string, value: string) {
  return `### ${label}\n\n${value}\n`;
}

export function buildIssueBody(input: IssueBodyInput) {
  const parts = [
    section("Metric title", input.title),
    section("Metric id", input.id),
    section("SSDLC phase", input.phase),
    section("Description", input.description),
    section("Measurement", input.measurement?.trim() ? input.measurement : NO_RESPONSE),
    section("Rationale", input.rationale?.trim() ? input.rationale : NO_RESPONSE),
    section("Tags (comma-separated)", formatList(input.tags)),
    section("Related tools (comma-separated)", formatList(input.related_tools)),
    section("Depends on (comma-separated metric ids)", formatList(input.depends_on)),
    section("Thresholds (one per line)", formatThresholds(input.thresholds)),
    section("References (one URL per line)", formatLines(input.references)),
    section("Notes", input.notes?.trim() ? input.notes : NO_RESPONSE),
  ];

  return `${parts.join("\n")}\n`;
}

export type { IssueBodyInput };
