import type { Threshold } from "../../../lib/metrics";

export type ProposalFormState = {
  title: string;
  id: string;
  phase: string;
  description: string;
  measurement: string;
  rationale: string;
  notes: string;
  tags: string[];
  related_tools: string[];
  depends_on: string[];
  thresholds: Threshold[];
  references: string[];
};

export type ProposalFormErrors = Partial<Record<keyof ProposalFormState, string>> & {
  thresholds?: string;
};
