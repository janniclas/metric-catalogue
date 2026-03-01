import { describe, expect, it, vi } from "vitest";

const env = {
  githubClientId: "client",
  oauthExchangeUrl: "/oauth/github/exchange",
  oauthRedirectUri: "https://example.com/propose-auth",
  repoUrl: "https://github.com/org/repo",
};

async function loadAuthModule(overrides: {
  loadOAuthRequest?: () => { state: string; codeVerifier: string } | null;
  createPkceChallenge?: () => Promise<{ codeVerifier: string; codeChallenge: string }>;
  generateState?: () => string;
} = {}) {
  vi.resetModules();

  const loadOAuthRequest = overrides.loadOAuthRequest ?? (() => ({ state: "state", codeVerifier: "ver" }));
  const createPkceChallenge = overrides.createPkceChallenge ??
    (async () => ({ codeVerifier: "ver", codeChallenge: "challenge" }));
  const generateState = overrides.generateState ?? (() => "state");

  const clearOAuthRequest = vi.fn();
  const saveOAuthRequest = vi.fn();

  vi.doMock("../env", () => ({
    loadAuthEnv: () => env,
  }));
  vi.doMock("../pkce", () => ({
    createPkceChallenge,
  }));
  vi.doMock("../state", () => ({
    generateState,
    saveOAuthRequest,
    loadOAuthRequest,
    clearOAuthRequest,
  }));

  const module = await import("../auth");
  return {
    ...module,
    clearOAuthRequest,
    saveOAuthRequest,
  };
}

describe("useAuth", () => {
  it("handles successful callback exchange", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ access_token: "token", username: "octocat" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { useAuth } = await loadAuthModule();
    const auth = useAuth();

    await auth.handleCallback({ code: "code", state: "state" });

    expect(auth.accessToken.value).toBe("token");
    expect(auth.username.value).toBe("octocat");
    expect(auth.status.value).toBe("authenticated");

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(options?.headers).toMatchObject({ Accept: "application/json" });
  });

  it("guards against duplicate callback handling", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ access_token: "token", username: "octocat" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { useAuth } = await loadAuthModule();
    const auth = useAuth();

    await auth.handleCallback({ code: "code", state: "state" });
    await auth.handleCallback({ code: "code", state: "state" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rejects state mismatch and clears session", async () => {
    const { useAuth, clearOAuthRequest } = await loadAuthModule({
      loadOAuthRequest: () => ({ state: "expected", codeVerifier: "ver" }),
    });
    const auth = useAuth();

    await auth.handleCallback({ code: "code", state: "state" });

    expect(auth.accessToken.value).toBeNull();
    expect(auth.username.value).toBeNull();
    expect(auth.status.value).toBe("error");
    expect(auth.error.value).toMatch(/state mismatch/);
    expect(clearOAuthRequest).toHaveBeenCalled();
  });

  it("clears session on exchange failure", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ message: "Server error" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { useAuth } = await loadAuthModule();
    const auth = useAuth();

    await auth.handleCallback({ code: "code", state: "state" });

    expect(auth.accessToken.value).toBeNull();
    expect(auth.username.value).toBeNull();
    expect(auth.status.value).toBe("error");
    expect(auth.error.value).toBe("Authentication failed. Please try again.");
  });

  it("handles provider error responses", async () => {
    const { useAuth } = await loadAuthModule();
    const auth = useAuth();

    await auth.handleCallback({ error: "access_denied", errorDescription: "Denied" });

    expect(auth.status.value).toBe("error");
    expect(auth.error.value).toBe("Denied");
  });
});
