import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { loadEnv, resetEnvForTests } from "../env";

const ORIGINAL_ENV = { ...process.env };

function setBaseEnv() {
  process.env.GITHUB_CLIENT_ID = "client";
  process.env.GITHUB_CLIENT_SECRET = "secret";
  process.env.OAUTH_REDIRECT_URI = "https://example.com/propose-auth";
  process.env.CORS_ALLOWED_ORIGIN = "https://example.com";
  process.env.PORT = "4000";
}

describe("loadEnv", () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    resetEnvForTests();
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    resetEnvForTests();
  });

  it("loads required environment variables", () => {
    setBaseEnv();
    const env = loadEnv();
    expect(env.GITHUB_CLIENT_ID).toBe("client");
    expect(env.PORT).toBe(4000);
  });

  it("throws on missing required variables", () => {
    process.env = { ...ORIGINAL_ENV };
    resetEnvForTests();
    expect(() => loadEnv()).toThrow(/GITHUB_CLIENT_ID/);
  });
});
