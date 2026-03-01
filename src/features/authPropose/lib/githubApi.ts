type CreateIssueInput = {
  token: string;
  owner: string;
  repo: string;
  title: string;
  body: string;
  labels?: string[];
};

type CreatedIssue = {
  number: number;
  htmlUrl: string;
};

type ErrorKind = "unauthorized" | "forbidden" | "rate_limited" | "unknown";

type GitHubErrorPayload = {
  message?: string;
};

export class GitHubApiError extends Error {
  readonly kind: ErrorKind;
  readonly status: number;

  constructor(kind: ErrorKind, status: number, message: string) {
    super(message);
    this.kind = kind;
    this.status = status;
  }
}

const GITHUB_API_BASE = "https://api.github.com";
const GITHUB_API_VERSION = "2022-11-28";

async function readErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as GitHubErrorPayload;
    if (payload?.message) return payload.message;
  } catch {
    // ignore
  }
  return `GitHub API request failed (${response.status}).`;
}

function classifyError(response: Response) {
  if (response.status === 401) return "unauthorized" as const;
  if (response.status === 429) return "rate_limited" as const;
  if (response.status === 403) {
    const remaining = response.headers.get("x-ratelimit-remaining");
    if (remaining === "0") return "rate_limited" as const;
    return "forbidden" as const;
  }
  return "unknown" as const;
}

export async function createIssue(input: CreateIssueInput): Promise<CreatedIssue> {
  const response = await fetch(
    `${GITHUB_API_BASE}/repos/${input.owner}/${input.repo}/issues`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": GITHUB_API_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: input.title,
        body: input.body,
        labels: input.labels ?? [],
      }),
    },
  );

  if (!response.ok) {
    const message = await readErrorMessage(response);
    const kind = classifyError(response);
    throw new GitHubApiError(kind, response.status, message);
  }

  const payload = (await response.json()) as { html_url?: string; number?: number };
  if (!payload.html_url || !payload.number) {
    throw new GitHubApiError("unknown", response.status, "GitHub response is missing issue data.");
  }

  return {
    number: payload.number,
    htmlUrl: payload.html_url,
  };
}

export type { CreatedIssue, CreateIssueInput, ErrorKind };
