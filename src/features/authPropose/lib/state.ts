const STATE_KEY = "auth_propose_state";
const VERIFIER_KEY = "auth_propose_code_verifier";

function base64UrlEncode(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function getSessionStorage() {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function generateState() {
  if (typeof crypto === "undefined") {
    throw new Error("Web Crypto API is not available.");
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

export function saveOAuthRequest(state: string, codeVerifier: string) {
  const storage = getSessionStorage();
  if (!storage) return;
  storage.setItem(STATE_KEY, state);
  storage.setItem(VERIFIER_KEY, codeVerifier);
}

export function loadOAuthRequest() {
  const storage = getSessionStorage();
  if (!storage) return null;
  const state = storage.getItem(STATE_KEY);
  const codeVerifier = storage.getItem(VERIFIER_KEY);
  if (!state || !codeVerifier) return null;
  return { state, codeVerifier };
}

export function clearOAuthRequest() {
  const storage = getSessionStorage();
  if (!storage) return;
  storage.removeItem(STATE_KEY);
  storage.removeItem(VERIFIER_KEY);
}
