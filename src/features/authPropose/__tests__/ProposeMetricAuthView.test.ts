import { fireEvent, render } from "@testing-library/vue";
import { createMemoryHistory, createRouter, type RouteRecordRaw } from "vue-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import ProposeMetricAuthView from "../ProposeMetricAuthView.vue";
import { flushPromises, mockFetch } from "../../../test/utils";
import { metricsIndexFixture } from "../../../test/fixtures/metricsIndex";

let mockEnvError: Error | null = null;
const mockLoadAuthEnv = vi.fn(() => {
  if (mockEnvError) throw mockEnvError;
  return {
    githubClientId: "client",
    oauthExchangeUrl: "/oauth/github/exchange",
    oauthRedirectUri: "https://example.com/propose-auth",
    repoUrl: "https://github.com/org/repo",
  };
});

const { createIssue, MockGitHubApiError } = vi.hoisted(() => {
  const createIssue = vi.fn();
  class MockGitHubApiError extends Error {
    kind: string;
    status: number;
    constructor(kind: string, status: number, message: string) {
      super(message);
      this.kind = kind;
      this.status = status;
    }
  }
  return { createIssue, MockGitHubApiError };
});

let authState: any;
const mockUseAuth = vi.fn(() => authState);

vi.mock("../lib/env", () => ({
  loadAuthEnv: () => mockLoadAuthEnv(),
}));

vi.mock("../lib/auth", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("../lib/githubApi", () => ({
  createIssue,
  GitHubApiError: MockGitHubApiError,
}));

function buildRouter(route = "/propose-auth") {
  const routes: RouteRecordRaw[] = [
    {
      path: "/propose-auth",
      component: ProposeMetricAuthView,
    },
  ];
  const router = createRouter({
    history: createMemoryHistory(),
    routes,
  });
  router.push(route);
  return router;
}

describe("ProposeMetricAuthView", () => {
  beforeEach(() => {
    createIssue.mockReset();
    mockEnvError = null;
  });

  it("renders env errors and disables login", async () => {
    mockFetch(metricsIndexFixture);
    mockEnvError = new Error("Auth configuration error: missing env");
    authState = {
      status: ref("unauthenticated"),
      username: ref(null),
      accessToken: ref(null),
      error: ref(null),
      startLogin: vi.fn(),
      handleCallback: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
    };

    const router = buildRouter();
    await router.isReady();

    const { getByText, getByRole } = render(ProposeMetricAuthView, {
      global: { plugins: [router] },
    });

    expect(getByText(/Auth configuration error/)).toBeTruthy();
    const loginButton = getByRole("button", { name: /Login with GitHub/i }) as HTMLButtonElement;
    expect(loginButton.disabled).toBe(true);
  });

  it("shows authenticated state and logout", async () => {
    mockFetch(metricsIndexFixture);
    mockEnvError = null;
    authState = {
      status: ref("authenticated"),
      username: ref("octocat"),
      accessToken: ref("token"),
      error: ref(null),
      startLogin: vi.fn(),
      handleCallback: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
    };

    const router = buildRouter();
    await router.isReady();

    const { getByText, queryByRole } = render(ProposeMetricAuthView, {
      global: { plugins: [router] },
    });

    expect(getByText(/Logged in as/i)).toBeTruthy();
    expect(getByText(/octocat/)).toBeTruthy();
    expect(getByText(/Authentication is temporary/i)).toBeTruthy();
    expect(queryByRole("button", { name: /Login with GitHub/i })).toBeNull();
    expect(getByText(/Logout/i)).toBeTruthy();
  });

  it("shows authenticating state", async () => {
    mockFetch(metricsIndexFixture);
    mockEnvError = null;
    authState = {
      status: ref("authenticating"),
      username: ref(null),
      accessToken: ref(null),
      error: ref(null),
      startLogin: vi.fn(),
      handleCallback: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
    };

    const router = buildRouter();
    await router.isReady();

    const { getByText } = render(ProposeMetricAuthView, {
      global: { plugins: [router] },
    });

    expect(getByText(/Authenticating/i)).toBeTruthy();
  });

  it("handles OAuth callback and clears query params", async () => {
    mockFetch(metricsIndexFixture);
    mockEnvError = null;
    const handleCallback = vi.fn().mockResolvedValue(undefined);
    authState = {
      status: ref("unauthenticated"),
      username: ref(null),
      accessToken: ref(null),
      error: ref(null),
      startLogin: vi.fn(),
      handleCallback,
      logout: vi.fn(),
      clearError: vi.fn(),
    };

    const router = buildRouter("/propose-auth?code=abc&state=123");
    await router.isReady();
    const replaceSpy = vi.spyOn(router, "replace");

    render(ProposeMetricAuthView, {
      global: { plugins: [router] },
    });

    await flushPromises();

    expect(handleCallback).toHaveBeenCalledWith({
      code: "abc",
      state: "123",
      error: undefined,
      errorDescription: undefined,
    });
    expect(replaceSpy).toHaveBeenCalledWith({ query: {} });
  });

  it("submits a proposal and shows success", async () => {
    mockFetch(metricsIndexFixture);
    mockEnvError = null;
    createIssue.mockResolvedValueOnce({ htmlUrl: "https://github.com/org/repo/issues/1", number: 1 });

    authState = {
      status: ref("authenticated"),
      username: ref("octocat"),
      accessToken: ref("token"),
      error: ref(null),
      startLogin: vi.fn(),
      handleCallback: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
    };

    const router = buildRouter();
    await router.isReady();

    const { getByLabelText, getByRole, findByText } = render(ProposeMetricAuthView, {
      global: { plugins: [router] },
    });

    await flushPromises();

    await fireEvent.update(
      getByLabelText("Metric title") as HTMLInputElement,
      "Security Requirements Coverage",
    );
    await fireEvent.update(
      getByLabelText("Metric id") as HTMLInputElement,
      "plan-security-requirements-coverage",
    );
    await fireEvent.update(getByLabelText("SSDLC phase") as HTMLSelectElement, "plan");
    await fireEvent.update(
      getByLabelText("Description") as HTMLTextAreaElement,
      "Describe the metric.",
    );

    await fireEvent.click(getByRole("button", { name: /create github issue/i }));

    await findByText(/Issue created/);
    expect(createIssue).toHaveBeenCalledTimes(1);
    const call = createIssue.mock.calls[0];
    if (!call) {
      throw new Error("Expected createIssue to be called.");
    }
    const payload = call[0] as any;
    expect(payload.labels).toEqual(["metric-proposal"]);
    expect(payload.title).toBe("Metric proposal: Security Requirements Coverage");
    expect(payload.body).toContain("### Metric title");
  });
});
