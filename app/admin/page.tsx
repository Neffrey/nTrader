import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { parseAdminView } from "@/lib/admin-view";
import { convexUrlForHost } from "@/lib/convex-deployment";
import { isLocalHostRequest } from "@/lib/local-request";
import { AddItemForm } from "./add-item-form";
import { AddLeagueForm } from "./add-league-form";
import { CategoryAdmin } from "./category-admin";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string | string[] }>;
}) {
  const localHost = await isLocalHostRequest();
  const token = await convexAuthNextjsToken();
  if (!token && !localHost) {
    redirect("/");
  }
  if (!localHost) {
    const user = await fetchQuery(api.users.current, {}, {
      token,
      url: convexUrlForHost((await headers()).get("host")),
    });
    if (user === null || user.role !== "admin") {
      redirect("/");
    }
  }

  const params = await searchParams;
  const view = parseAdminView(params.view);

  return (
    <main className="flex flex-1 flex-col items-center bg-neutral-950 px-6 py-16 text-neutral-100">
      <div className="flex w-full max-w-md flex-col items-center gap-12 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">Admin</h1>
        {view === "items" ? (
          <section className="flex w-full flex-col items-center gap-4">
            <h2 className="text-lg font-medium text-neutral-100">Add item</h2>
            <AddItemForm />
          </section>
        ) : null}
        {view === "categories" ? (
          <section className="flex w-full flex-col items-center gap-4">
            <h2 className="text-lg font-medium text-neutral-100">Categories</h2>
            <CategoryAdmin />
          </section>
        ) : null}
        {view === "leagues" ? (
          <section className="flex w-full flex-col items-center gap-4">
            <h2 className="text-lg font-medium text-neutral-100">Add league</h2>
            <AddLeagueForm />
          </section>
        ) : null}
        <Link
          href="/"
          className="text-sm text-neutral-400 underline underline-offset-4 hover:text-neutral-200"
        >
          Home
        </Link>
      </div>
    </main>
  );
}
