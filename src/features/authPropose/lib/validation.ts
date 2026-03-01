import type { Threshold } from "../../../lib/metrics";
import type { ProposalFormErrors, ProposalFormState } from "./types";

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function formatThresholdLine(threshold: Threshold, index?: number) {
  const name = threshold.name?.toString().trim();
  const value = threshold.value?.toString().trim();
  const description = threshold.description?.toString().trim();

  if (!name || !value) {
    const suffix = typeof index === "number" ? ` at index ${index}` : "";
    throw new Error(`Invalid threshold entry${suffix}. Name and value are required.`);
  }

  return description ? `${name} | ${value} | ${description}` : `${name} | ${value}`;
}

export function formatThresholdLines(thresholds: Threshold[] = []) {
  return thresholds.map((threshold, index) => formatThresholdLine(threshold, index));
}

export function validateMetricId(id: string) {
  const normalized = id.trim();
  if (!normalized) return "Metric id is required.";
  if (!ID_PATTERN.test(normalized)) {
    return "Metric id must be kebab-case (lowercase letters, numbers, hyphens).";
  }
  return null;
}

export function validateProposal(
  input: ProposalFormState,
  {
    phaseIds,
    existingIds,
  }: { phaseIds: string[] | Set<string>; existingIds?: string[] | Set<string> },
) {
  const errors: ProposalFormErrors = {};
  const phaseSet = Array.isArray(phaseIds) ? new Set(phaseIds) : phaseIds;
  const existingSet = existingIds
    ? new Set(
        Array.isArray(existingIds)
          ? existingIds.map((id) => id.toLowerCase())
          : [...existingIds].map((id) => id.toLowerCase()),
      )
    : null;

  if (!input.title.trim()) {
    errors.title = "Metric title is required.";
  }

  const idError = validateMetricId(input.id);
  if (idError) {
    errors.id = idError;
  } else if (existingSet && existingSet.has(input.id.trim().toLowerCase())) {
    errors.id = "Metric id already exists.";
  }

  if (!input.phase.trim()) {
    errors.phase = "SSDLC phase is required.";
  } else if (phaseSet.size > 0 && !phaseSet.has(input.phase)) {
    errors.phase = "SSDLC phase is not a known value.";
  }

  if (!input.description.trim()) {
    errors.description = "Description is required.";
  }

  try {
    formatThresholdLines(input.thresholds ?? []);
  } catch (err) {
    errors.thresholds = err instanceof Error ? err.message : "Invalid thresholds.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
