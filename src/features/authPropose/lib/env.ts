type AuthEnv = {
  githubClientId: string;
  oauthExchangeUrl: string;
  oauthRedirectUri: string;
  repoUrl: string;
};

function isNonEmpty(value: string | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validateAbsoluteUrl(value: string, name: string, issues: string[]) {
  try {
    const url = new URL(value);
    if (!url.protocol || !url.host) {
      issues.push(`${name} must be a valid absolute URL.`);
    }
  } catch {
    issues.push(`${name} must be a valid absolute URL.`);
  }
}

function validateUrlOrPath(value: string, name: string, issues: string[]) {
  if (value.startsWith("/")) return;
  validateAbsoluteUrl(value, name, issues);
}

export function loadAuthEnv(): AuthEnv {
  const issues: string[] = [];

  const githubClientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
  const oauthExchangeUrl = import.meta.env.VITE_OAUTH_EXCHANGE_URL;
  const oauthRedirectUri = import.meta.env.VITE_OAUTH_REDIRECT_URI;
  const repoUrl = import.meta.env.VITE_REPO_URL;

  if (!isNonEmpty(githubClientId)) {
    issues.push("VITE_GITHUB_CLIENT_ID is required.");
  }
  if (!isNonEmpty(oauthExchangeUrl)) {
    issues.push("VITE_OAUTH_EXCHANGE_URL is required.");
  }
  if (!isNonEmpty(oauthRedirectUri)) {
    issues.push("VITE_OAUTH_REDIRECT_URI is required.");
  }
  if (!isNonEmpty(repoUrl)) {
    issues.push("VITE_REPO_URL is required.");
  }

  if (isNonEmpty(oauthExchangeUrl)) {
    validateUrlOrPath(oauthExchangeUrl, "VITE_OAUTH_EXCHANGE_URL", issues);
  }
  if (isNonEmpty(oauthRedirectUri)) {
    validateAbsoluteUrl(oauthRedirectUri, "VITE_OAUTH_REDIRECT_URI", issues);
  }
  if (isNonEmpty(repoUrl)) {
    validateAbsoluteUrl(repoUrl, "VITE_REPO_URL", issues);
  }

  if (issues.length > 0) {
    throw new Error(`Auth configuration error: ${issues.join(" ")}`);
  }

  return {
    githubClientId: githubClientId!.trim(),
    oauthExchangeUrl: oauthExchangeUrl!.trim(),
    oauthRedirectUri: oauthRedirectUri!.trim(),
    repoUrl: repoUrl!.trim(),
  };
}

export type { AuthEnv };
