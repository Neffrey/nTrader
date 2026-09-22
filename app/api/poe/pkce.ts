export async function createPkcePair() {
  const secret = crypto.getRandomValues(new Uint8Array(32));
  const codeVerifier = base64Url(secret);
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(codeVerifier),
  );
  return {
    codeVerifier,
    codeChallenge: base64Url(new Uint8Array(digest)),
  };
}

export function createOauthState() {
  return base64Url(crypto.getRandomValues(new Uint8Array(32)));
}

function base64Url(bytes: Uint8Array) {
  return Buffer.from(bytes).toString("base64url");
}
