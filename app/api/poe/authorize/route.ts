import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/env";
import { createOauthState, createPkcePair } from "../pkce";

const SCOPE = "account:profile";

export async function GET(request: NextRequest) {
  const token = await convexAuthNextjsToken();
  if (!token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const clientId = env.POE_CLIENT_ID;
  const redirectUri = env.POE_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    return accountError(request, "Path of Exile authorization is not configured");
  }

  const { codeVerifier, codeChallenge } = await createPkcePair();
  const state = createOauthState();
  const authorizeUrl = new URL("https://www.pathofexile.com/oauth/authorize");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("scope", SCOPE);
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("code_challenge", codeChallenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set("poe_oauth_state", state, oauthCookie);
  response.cookies.set("poe_oauth_verifier", codeVerifier, oauthCookie);
  return response;
}

const oauthCookie = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 600,
};

function accountError(request: NextRequest, message: string) {
  const url = new URL("/account", request.url);
  url.searchParams.set("poe", "error");
  url.searchParams.set("message", message);
  return NextResponse.redirect(url);
}
