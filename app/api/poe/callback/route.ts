import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchMutation } from "convex/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { env } from "@/env";

const SCOPE = "account:profile";

export async function GET(request: NextRequest) {
  const token = await convexAuthNextjsToken();
  if (!token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const state = request.nextUrl.searchParams.get("state");
  const code = request.nextUrl.searchParams.get("code");
  const savedState = request.cookies.get("poe_oauth_state")?.value;
  const codeVerifier = request.cookies.get("poe_oauth_verifier")?.value;
  const oauthError = request.nextUrl.searchParams.get("error_description");

  if (oauthError) {
    return finish(accountError(request, oauthError));
  }
  if (!state || !savedState || state !== savedState || !code || !codeVerifier) {
    return finish(accountError(request, "Authorization could not be verified"));
  }

  const clientId = env.POE_CLIENT_ID;
  const redirectUri = env.POE_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    return finish(
      accountError(request, "Path of Exile authorization is not configured"),
    );
  }

  try {
    const credentials = await exchangeCode({
      clientId,
      clientSecret: env.POE_CLIENT_SECRET,
      code,
      redirectUri,
      codeVerifier,
    });
    await fetchMutation(api.users.savePoeCredentials, credentials, { token });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Authorization failed";
    return finish(accountError(request, message));
  }

  const url = new URL("/account", request.url);
  url.searchParams.set("poe", "authorized");
  return finish(NextResponse.redirect(url));
}

async function exchangeCode(args: {
  clientId: string;
  clientSecret: string | undefined;
  code: string;
  redirectUri: string;
  codeVerifier: string;
}) {
  const body = new URLSearchParams({
    client_id: args.clientId,
    grant_type: "authorization_code",
    code: args.code,
    redirect_uri: args.redirectUri,
    scope: SCOPE,
    code_verifier: args.codeVerifier,
  });
  if (args.clientSecret) {
    body.set("client_secret", args.clientSecret);
  }

  const response = await fetch("https://www.pathofexile.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      "User-Agent": "nTrader/0.1 (local development; PoE OAuth)",
    },
    body,
  });
  const payload: unknown = await response.json();
  if (!response.ok) {
    throw new Error(readError(payload));
  }
  return readToken(payload);
}

function readToken(data: unknown) {
  if (typeof data !== "object" || data === null) {
    throw new Error("Token response was not recognized");
  }
  const record = data as Record<string, unknown>;
  if (typeof record.access_token !== "string" || record.access_token.length === 0) {
    throw new Error("Token response was missing an access token");
  }
  if (typeof record.username !== "string" || typeof record.sub !== "string") {
    throw new Error("Token response was missing the Path of Exile account");
  }
  const expiresIn = typeof record.expires_in === "number" ? record.expires_in : null;
  return {
    accessToken: record.access_token,
    refreshToken:
      typeof record.refresh_token === "string" ? record.refresh_token : null,
    expiresAt: expiresIn === null ? null : Date.now() + expiresIn * 1000,
    scope: typeof record.scope === "string" ? record.scope : SCOPE,
    poeUsername: record.username,
    poeSub: record.sub,
  };
}

function readError(data: unknown) {
  if (typeof data === "object" && data !== null && "error_description" in data) {
    const description = data.error_description;
    if (typeof description === "string" && description.length > 0) {
      return description.slice(0, 200);
    }
  }
  return "Path of Exile did not grant access";
}

function accountError(request: NextRequest, message: string) {
  const url = new URL("/account", request.url);
  url.searchParams.set("poe", "error");
  url.searchParams.set("message", message.slice(0, 200));
  return NextResponse.redirect(url);
}

function finish(response: NextResponse) {
  response.cookies.set("poe_oauth_state", "", { ...clearedCookie });
  response.cookies.set("poe_oauth_verifier", "", { ...clearedCookie });
  return response;
}

const clearedCookie = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 0,
};
