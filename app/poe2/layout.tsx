import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PoeSecondaryNav } from "@/components/poe-secondary-nav";
import { isLocalHostRequest } from "@/lib/local-request";

export default async function Poe2Layout({
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
      <Suspense
        fallback={
          <div className="border-b border-neutral-800 bg-neutral-950 py-3" />
        }
      >
        <PoeSecondaryNav game="poe2" />
      </Suspense>
      {children}
    </>
  );
}
