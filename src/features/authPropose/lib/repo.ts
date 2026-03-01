type RepoTarget = {
  owner: string;
  repo: string;
  repoUrl: string;
};

export function parseRepoTarget(repoUrl: string): RepoTarget {
  let url: URL;
  try {
    url = new URL(repoUrl);
  } catch {
    throw new Error("VITE_REPO_URL must be a valid absolute URL.");
  }

  if (!/github\.com$/i.test(url.hostname)) {
    throw new Error("VITE_REPO_URL must point to github.com.");
  }

  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length < 2) {
    throw new Error("VITE_REPO_URL must include /{owner}/{repo}.");
  }
  if (segments.length > 2) {
    throw new Error("VITE_REPO_URL must not include extra path segments.");
  }

  const [owner, repoRaw] = segments;
  if (!owner || !repoRaw) {
    throw new Error("VITE_REPO_URL must include a valid owner and repo.");
  }
  const repo = repoRaw.endsWith(".git") ? repoRaw.slice(0, -4) : repoRaw;
  if (!repo) {
    throw new Error("VITE_REPO_URL must include a valid owner and repo.");
  }

  const normalizedRepoUrl = `${url.origin}/${owner}/${repo}`;

  return {
    owner,
    repo,
    repoUrl: normalizedRepoUrl,
  };
}

export type { RepoTarget };
