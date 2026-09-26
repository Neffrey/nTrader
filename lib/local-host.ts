const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);

export function isLocalHostname(hostHeader: string | null | undefined) {
  if (process.env.NODE_ENV === "production") {
    return false;
  }
  if (!hostHeader) {
    return false;
  }
  const hostname = hostHeader
    .split(",")[0]
    ?.trim()
    .split(":")[0]
    ?.replace(/^\[|\]$/g, "");
  return hostname !== undefined && localHosts.has(hostname);
}
