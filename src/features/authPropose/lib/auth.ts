import { computed, ref } from "vue";
import { loadAuthEnv } from "./env";
import { createPkceChallenge } from "./pkce";
import { clearOAuthRequest, generateState, loadOAuthRequest, saveOAuthRequest } from "./state";

type AuthStatus = "unauthenticated" | "authenticating" | "authenticated" | "error";

type ExchangeResponse = {
  access_token?: string;
  username?: string;
};

const accessToken = ref<string | null>(null);
const username = ref<string | null>(null);
const status = ref<AuthStatus>("unauthenticated");
const error = ref<string | null>(null);
let callbackHandled = false;
let callbackInFlight = false;

function setError(message: string, err?: unknown) {
  if (err) {
    if (import.meta.env.DEV) {
      console.error(err);
    } else {
      console.error("Auth error:", err);
    }
  }
  error.value = message;
  status.value = "error";
}

function clearError() {
  error.value = null;
  if (status.value === "error") {
    status.value = "unauthenticated";
  }
}

function clearSession() {
  accessToken.value = null;
  username.value = null;
}

function buildAuthorizeUrl(params: {
  clientId: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
}) {
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", params.clientId);
  url.searchParams.set("scope", "public_repo");
  url.searchParams.set("state", params.state);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("code_challenge", params.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

async function exchangeCode(args: {
  code: string;
  state: string;
  codeVerifier: string;
}) {
  const env = loadAuthEnv();
  const response = await fetch(env.oauthExchangeUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      code: args.code,
      // Backend must not trust client-sent state; validate independently if needed.
      state: args.state,
      code_verifier: args.codeVerifier,
      redirect_uri: env.oauthRedirectUri,
    }),
  });

  if (!response.ok) {
    throw new Error(`OAuth exchange failed (${response.status}).`);
  }

  const payload = (await response.json()) as ExchangeResponse;
  if (!payload.access_token || !payload.username) {
    throw new Error("OAuth exchange response is missing required fields.");
  }

  return { accessToken: payload.access_token, username: payload.username };
}

export function useAuth() {
  const isAuthenticated = computed(() => status.value === "authenticated");

  async function startLogin() {
    try {
      clearError();
      callbackHandled = false;
      callbackInFlight = false;
      const env = loadAuthEnv();
      const { codeVerifier, codeChallenge } = await createPkceChallenge();
      const state = generateState();
      saveOAuthRequest(state, codeVerifier);
      status.value = "authenticating";
      const url = buildAuthorizeUrl({
        clientId: env.githubClientId,
        redirectUri: env.oauthRedirectUri,
        state,
        codeChallenge,
      });
      if (typeof window !== "undefined") {
        window.location.assign(url);
      }
    } catch (err) {
      setError("Failed to start login. Please try again.", err);
    }
  }

  async function handleCallback(params: {
    code?: string;
    state?: string;
    error?: string;
    errorDescription?: string;
  }) {
    if (callbackHandled || callbackInFlight) return;
    callbackInFlight = true;

    try {
      if (params.error) {
        clearSession();
        setError(params.errorDescription || params.error);
        clearOAuthRequest();
        return;
      }

      if (!params.code || !params.state) {
        clearSession();
        setError("Missing OAuth parameters.");
        clearOAuthRequest();
        return;
      }

      const pending = loadOAuthRequest();
      if (!pending) {
        clearSession();
        setError("OAuth state is missing. Please try logging in again.");
        return;
      }

      if (pending.state !== params.state) {
        clearOAuthRequest();
        clearSession();
        setError("OAuth state mismatch. Please try logging in again.");
        return;
      }

      clearError();
      status.value = "authenticating";
      const result = await exchangeCode({
        code: params.code,
        state: params.state,
        codeVerifier: pending.codeVerifier,
      });
      accessToken.value = result.accessToken;
      username.value = result.username;
      status.value = "authenticated";
      error.value = null;
      clearOAuthRequest();
    } catch (err) {
      clearOAuthRequest();
      clearSession();
      setError("Authentication failed. Please try again.", err);
    } finally {
      callbackHandled = true;
      callbackInFlight = false;
    }
  }

  function logout() {
    clearSession();
    status.value = "unauthenticated";
    error.value = null;
    clearOAuthRequest();
    callbackHandled = false;
    callbackInFlight = false;
  }

  return {
    accessToken,
    username,
    status,
    error,
    isAuthenticated,
    startLogin,
    handleCallback,
    logout,
    clearError,
  };
}
