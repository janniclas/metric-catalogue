import { describe, expect, it, vi } from "vitest";
import { createIssue, GitHubApiError } from "../githubApi";

function mockResponse({
  ok,
  status,
  json,
  headers,
}: {
  ok: boolean;
  status: number;
  json: () => Promise<any>;
  headers?: Record<string, string>;
}) {
  return {
    ok,
    status,
    json,
    headers: {
      get: (key: string) => headers?.[key] ?? null,
    },
  } as Response;
}

describe("createIssue", () => {
  it("posts issue payload with required headers", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      mockResponse({
        ok: true,
        status: 201,
        json: async () => ({ html_url: "https://github.com/org/repo/issues/1", number: 1 }),
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await createIssue({
      token: "token",
      owner: "org",
      repo: "repo",
      title: "Metric proposal: Test",
      body: "body",
      labels: ["metric-proposal"],
    });

    expect(result).toEqual({ number: 1, htmlUrl: "https://github.com/org/repo/issues/1" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.github.com/repos/org/repo/issues");
    expect(options?.method).toBe("POST");
    expect(options?.headers).toMatchObject({
      Authorization: "Bearer token",
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    });
  });

  it("classifies unauthorized responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        mockResponse({
          ok: false,
          status: 401,
          json: async () => ({ message: "Bad credentials" }),
        }),
      ),
    );

    await expect(
      createIssue({
        token: "token",
        owner: "org",
        repo: "repo",
        title: "Metric proposal: Test",
        body: "body",
      }),
    ).rejects.toMatchObject({ kind: "unauthorized", status: 401 });
  });

  it("classifies rate limited responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        mockResponse({
          ok: false,
          status: 403,
          headers: { "x-ratelimit-remaining": "0" },
          json: async () => ({ message: "API rate limit exceeded" }),
        }),
      ),
    );

    await expect(
      createIssue({
        token: "token",
        owner: "org",
        repo: "repo",
        title: "Metric proposal: Test",
        body: "body",
      }),
    ).rejects.toMatchObject({ kind: "rate_limited", status: 403 });
  });

  it("classifies forbidden responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        mockResponse({
          ok: false,
          status: 403,
          headers: { "x-ratelimit-remaining": "10" },
          json: async () => ({ message: "Forbidden" }),
        }),
      ),
    );

    await expect(
      createIssue({
        token: "token",
        owner: "org",
        repo: "repo",
        title: "Metric proposal: Test",
        body: "body",
      }),
    ).rejects.toMatchObject({ kind: "forbidden", status: 403 });
  });

  it("throws when payload is missing fields", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        mockResponse({
          ok: true,
          status: 201,
          json: async () => ({ html_url: "" }),
        }),
      ),
    );

    await expect(
      createIssue({
        token: "token",
        owner: "org",
        repo: "repo",
        title: "Metric proposal: Test",
        body: "body",
      }),
    ).rejects.toBeInstanceOf(GitHubApiError);
  });
});
