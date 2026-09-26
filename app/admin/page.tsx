import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import Link from "next/link";
import { redirect } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { isLocalHostRequest } from "@/lib/local-request";
import { AddItemForm } from "./add-item-form";
import { AddLeagueForm } from "./add-league-form";

export default async function AdminPage() {
  const localHost = await isLocalHostRequest();
  const token = await convexAuthNextjsToken();
  if (!token && !localHost) {
    redirect("/");
  }
  if (!localHost) {
    const user = await fetchQuery(api.users.current, {}, { token });
    if (user === null || user.role !== "admin") {
      redirect("/");
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center bg-neutral-950 px-6 py-16 text-neutral-100">
      <div className="flex w-full max-w-md flex-col items-center gap-12 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">Admin</h1>
        <section className="flex w-full flex-col items-center gap-4">
          <h2 className="text-lg font-medium text-neutral-100">Add item</h2>
          <AddItemForm />
        </section>
        <section className="flex w-full flex-col items-center gap-4">
          <h2 className="text-lg font-medium text-neutral-100">Add league</h2>
          <AddLeagueForm />
        </section>
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
