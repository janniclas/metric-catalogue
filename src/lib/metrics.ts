export type Phase = {
  id: string;
  name: string;
  description: string;
  icon: string;
  order: number;
};

export type Threshold = {
  name: string;
  value: string | number;
  description?: string;
};

export type Metric = {
  id: string;
  title: string;
  phase: string;
  thresholds?: Threshold[];
  tags?: string[];
  related_tools?: string[];
  depends_on?: string[];
  references?: string[];
  markdown: string;
  source_path: string;
};

export type MetricsIndex = {
  generated_at: string;
  phases: Phase[];
  metrics: Metric[];
};

export async function loadMetricsIndex(): Promise<MetricsIndex> {
  const base = import.meta.env.BASE_URL ?? "/";
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  const response = await fetch(`${normalizedBase}metrics/index.json`);

  if (!response.ok) {
    throw new Error(`Failed to load metrics index (${response.status})`);
  }

  return response.json();
}
