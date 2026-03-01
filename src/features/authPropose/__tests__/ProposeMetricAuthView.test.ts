import { render } from "@testing-library/vue";
import { createMemoryHistory, createRouter, type RouteRecordRaw } from "vue-router";
import { describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import ProposeMetricAuthView from "../ProposeMetricAuthView.vue";
import { flushPromises } from "../../../test/utils";

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

let authState: any;
const mockUseAuth = vi.fn(() => authState);

vi.mock("../lib/env", () => ({
  loadAuthEnv: () => mockLoadAuthEnv(),
}));

vi.mock("../lib/auth", () => ({
  useAuth: () => mockUseAuth(),
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
  it("renders env errors and disables login", async () => {
    mockEnvError = new Error("Auth configuration error: missing env");
    authState = {
      status: ref("unauthenticated"),
      username: ref(null),
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
    mockEnvError = null;
    authState = {
      status: ref("authenticated"),
      username: ref("octocat"),
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
    mockEnvError = null;
    authState = {
      status: ref("authenticating"),
      username: ref(null),
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
    mockEnvError = null;
    const handleCallback = vi.fn().mockResolvedValue(undefined);
    authState = {
      status: ref("unauthenticated"),
      username: ref(null),
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
});
