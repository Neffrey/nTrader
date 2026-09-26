import { isLocalHostname } from "./local-host";

const devConvexUrl = "https://adjoining-meerkat-656.convex.cloud";
const prodConvexUrl = "https://clean-warthog-990.convex.cloud";

export function convexUrlForHost(hostHeader: string | null | undefined) {
  return isLocalHostname(hostHeader) ? devConvexUrl : prodConvexUrl;
}
