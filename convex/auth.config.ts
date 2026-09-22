import { AuthConfig } from "convex/server";

export default {
  providers: [
    {
      // Convex Auth signs JWTs with issuer CONVEX_SITE_URL (*.convex.site).
      domain: process.env.CONVEX_SITE_URL!,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
