import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetEnvForTests } from "../env";

const { exchangeCode, fetchUsername, GitHubExchangeError } = vi.hoisted(() => {
  const exchangeCode = vi.fn();
  const fetchUsername = vi.fn();
  class GitHubExchangeError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  }
  return { exchangeCode, fetchUsername, GitHubExchangeError };
});

vi.mock("../github", () => ({
  exchangeCode,
  fetchUsername,
  GitHubExchangeError,
}));

import { buildServer } from "../server";

function setBaseEnv() {
  process.env.GITHUB_CLIENT_ID = "client";
  process.env.GITHUB_CLIENT_SECRET = "secret";
  process.env.OAUTH_REDIRECT_URI = "https://example.com/propose-auth";
  process.env.CORS_ALLOWED_ORIGIN = "https://example.com";
  process.env.PORT = "3000";
}

describe("/oauth/github/exchange", () => {
  beforeEach(() => {
    resetEnvForTests();
    setBaseEnv();
    exchangeCode.mockReset();
    fetchUsername.mockReset();
  });

  it("returns access token and username", async () => {
    exchangeCode.mockResolvedValue("token");
    fetchUsername.mockResolvedValue("octocat");

    const server = await buildServer();
    const response = await server.inject({
      method: "POST",
      url: "/oauth/github/exchange",
      payload: {
        code: "code",
        redirect_uri: "https://example.com/propose-auth",
        code_verifier: "verifier",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ access_token: "token", username: "octocat" });
  });

  it("rejects invalid payload", async () => {
    const server = await buildServer();
    const response = await server.inject({
      method: "POST",
      url: "/oauth/github/exchange",
      payload: { code: "" },
    });

    expect(response.statusCode).toBe(400);
  });

  it("maps invalid OAuth code to 401", async () => {
    exchangeCode.mockRejectedValue(new GitHubExchangeError(401, "bad"));

    const server = await buildServer();
    const response = await server.inject({
      method: "POST",
      url: "/oauth/github/exchange",
      payload: {
        code: "bad",
        redirect_uri: "https://example.com/propose-auth",
        code_verifier: "verifier",
      },
    });

    expect(response.statusCode).toBe(401);
  });

  it("maps rate limit to 429", async () => {
    exchangeCode.mockRejectedValue(new GitHubExchangeError(403, "rate"));

    const server = await buildServer();
    const response = await server.inject({
      method: "POST",
      url: "/oauth/github/exchange",
      payload: {
        code: "code",
        redirect_uri: "https://example.com/propose-auth",
        code_verifier: "verifier",
      },
    });

    expect(response.statusCode).toBe(429);
  });

  it("maps unexpected errors to 500", async () => {
    exchangeCode.mockRejectedValue(new Error("boom"));

    const server = await buildServer();
    const response = await server.inject({
      method: "POST",
      url: "/oauth/github/exchange",
      payload: {
        code: "code",
        redirect_uri: "https://example.com/propose-auth",
        code_verifier: "verifier",
      },
    });

    expect(response.statusCode).toBe(500);
  });
});
