import { Suspense } from "react";
import { AdminSecondaryNav } from "@/components/admin-secondary-nav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense
        fallback={
          <div className="border-b border-neutral-800 bg-neutral-950 py-3" />
        }
      >
        <AdminSecondaryNav />
      </Suspense>
      {children}
    </>
  );
}
