export interface PkcePair {
  codeVerifier: string;
  codeChallenge: string;
}

function getCrypto() {
  if (typeof crypto === "undefined") {
    throw new Error("Web Crypto API is not available.");
  }
  return crypto;
}

function base64UrlEncode(buffer: ArrayBuffer | Uint8Array) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function randomBytes(length: number) {
  const array = new Uint8Array(length);
  getCrypto().getRandomValues(array);
  return array;
}

export async function createPkceChallenge(): Promise<PkcePair> {
  const verifierBytes = randomBytes(64); // ↑ increased entropy
  const codeVerifier = base64UrlEncode(verifierBytes);

  const digest = await getCrypto().subtle.digest("SHA-256", new TextEncoder().encode(codeVerifier));

  const codeChallenge = base64UrlEncode(digest);

  return { codeVerifier, codeChallenge };
}
