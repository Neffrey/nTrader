import { headers } from "next/headers";
import { isLocalHostname } from "./local-host";

export async function isLocalHostRequest() {
  return isLocalHostname((await headers()).get("host"));
}
