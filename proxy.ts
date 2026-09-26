import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { convexUrlForHost } from "./lib/convex-deployment";
import { isLocalHostname } from "./lib/local-host";

const isSignInPage = createRouteMatcher(["/signin"]);
const isMemberPage = createRouteMatcher([
  "/account",
  "/poe1",
  "/poe2",
  "/admin",
  "/add-item",
]);

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  return convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
    const authenticated = await convexAuth.isAuthenticated();
    if (isSignInPage(request) && authenticated) {
      return nextjsMiddlewareRedirect(request, "/");
    }
    if (
      isMemberPage(request) &&
      !authenticated &&
      !isLocalHostname(request.headers.get("host"))
    ) {
      return nextjsMiddlewareRedirect(request, "/");
    }
  }, {
    convexUrl: convexUrlForHost(request.headers.get("host")),
  })(request, event);
}

export const config = {
  // The following matcher runs middleware on all routes
  // except static assets.
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
