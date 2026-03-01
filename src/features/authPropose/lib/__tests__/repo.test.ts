import { describe, expect, it } from "vitest";
import { parseRepoTarget } from "../repo";

describe("parseRepoTarget", () => {
  it("parses owner and repo from a GitHub URL", () => {
    const result = parseRepoTarget("https://github.com/octo-org/metric-catalogue");
    expect(result).toEqual({
      owner: "octo-org",
      repo: "metric-catalogue",
      repoUrl: "https://github.com/octo-org/metric-catalogue",
    });
  });

  it("strips .git suffix from repo", () => {
    const result = parseRepoTarget("https://github.com/octo-org/metric-catalogue.git");
    expect(result.repo).toBe("metric-catalogue");
    expect(result.repoUrl).toBe("https://github.com/octo-org/metric-catalogue");
  });

  it("rejects non-GitHub hosts", () => {
    expect(() => parseRepoTarget("https://gitlab.com/octo-org/metric-catalogue")).toThrow(
      /github\.com/,
    );
  });

  it("rejects URLs without owner and repo", () => {
    expect(() => parseRepoTarget("https://github.com/octo-org")).toThrow(/owner/);
  });

  it("rejects URLs with extra path segments", () => {
    expect(() =>
      parseRepoTarget("https://github.com/octo-org/metric-catalogue/issues"),
    ).toThrow(/extra path segments/);
  });
});
