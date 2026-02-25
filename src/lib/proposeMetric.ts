const REPO_URL = "https://github.com/fraunhofer-iem/spha";
const ISSUE_TEMPLATE = "metric.yml";

export function getProposeMetricUrl(): string {
  const template = encodeURIComponent(ISSUE_TEMPLATE);
  return `${REPO_URL}/issues/new?template=${template}`;
}
