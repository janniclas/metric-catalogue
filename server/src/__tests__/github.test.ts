import { beforeEach, describe, expect, it, vi } from "vitest";
import { exchangeCode, fetchUsername, GitHubExchangeError } from "../github";
import { resetEnvForTests } from "../env";

function setBaseEnv() {
  process.env.GITHUB_CLIENT_ID = "client";
  process.env.GITHUB_CLIENT_SECRET = "secret";
  process.env.OAUTH_REDIRECT_URI = "https://example.com/propose-auth";
  process.env.CORS_ALLOWED_ORIGIN = "https://example.com";
  process.env.PORT = "3000";
  delete process.env.GITHUB_OAUTH_BASE_URL;
  delete process.env.GITHUB_API_BASE_URL;
}

describe("github", () => {
  beforeEach(() => {
    resetEnvForTests();
    setBaseEnv();
    vi.restoreAllMocks();
  });

  it("exchanges code for access token", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ access_token: "token" }),
      }),
    );

    const token = await exchangeCode({
      code: "code",
      codeVerifier: "verifier",
      redirectUri: "https://example.com/propose-auth",
    });

    expect(token).toBe("token");
  });

  it("throws on token exchange errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error_description: "Bad code" }),
      }),
    );

    await expect(
      exchangeCode({
        code: "bad",
        codeVerifier: "verifier",
        redirectUri: "https://example.com/propose-auth",
      }),
    ).rejects.toBeInstanceOf(GitHubExchangeError);
  });

  it("fetches username", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ login: "octocat" }),
      }),
    );

    const username = await fetchUsername("token");
    expect(username).toBe("octocat");
  });

  it("honors GitHub Enterprise endpoints when provided", async () => {
    process.env.GITHUB_OAUTH_BASE_URL = "https://ghe.example.com";
    process.env.GITHUB_API_BASE_URL = "https://ghe.example.com/api/v3";
    resetEnvForTests();

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ access_token: "token" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await exchangeCode({
      code: "code",
      codeVerifier: "verifier",
      redirectUri: "https://example.com/propose-auth",
    });

    expect(fetchMock).toHaveBeenCalled();
    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe("https://ghe.example.com/login/oauth/access_token");
  });
});
