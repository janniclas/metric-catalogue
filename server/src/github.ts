import { loadEnv } from "./env";

export class GitHubExchangeError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const DEFAULT_OAUTH_BASE = "https://github.com";
const DEFAULT_API_BASE = "https://api.github.com";
const API_VERSION = "2022-11-28";

async function parseJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function exchangeCode(args: {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}) {
  const env = loadEnv();
  const baseUrl = env.GITHUB_OAUTH_BASE_URL ?? DEFAULT_OAUTH_BASE;
  const response = await fetch(`${baseUrl}/login/oauth/access_token`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code: args.code,
      code_verifier: args.codeVerifier,
      redirect_uri: args.redirectUri,
    }),
  });

  if (!response.ok) {
    throw new GitHubExchangeError(response.status, `OAuth exchange failed (${response.status}).`);
  }

  const payload = await parseJson<{ access_token?: string; error_description?: string }>(response);
  if (!payload?.access_token) {
    throw new GitHubExchangeError(401, payload?.error_description ?? "Missing access token.");
  }

  return payload.access_token;
}

export async function fetchUsername(accessToken: string) {
  const env = loadEnv();
  const baseUrl = env.GITHUB_API_BASE_URL ?? DEFAULT_API_BASE;
  const response = await fetch(`${baseUrl}/user`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": API_VERSION,
    },
  });

  if (!response.ok) {
    throw new GitHubExchangeError(response.status, `Failed to fetch user (${response.status}).`);
  }

  const payload = await parseJson<{ login?: string }>(response);
  if (!payload?.login) {
    throw new GitHubExchangeError(500, "GitHub user response missing login.");
  }

  return payload.login;
}
