import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { redirect } from "next/navigation";
import { PoeSecondaryNav } from "@/components/poe-secondary-nav";
import { isLocalHostRequest } from "@/lib/local-request";

export default async function Poe1Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await convexAuthNextjsToken();
  if (!token && !(await isLocalHostRequest())) {
    redirect("/");
  }

  return (
    <>
      <PoeSecondaryNav game="poe1" />
      {children}
    </>
  );
}
