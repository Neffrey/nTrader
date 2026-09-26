import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import Link from "next/link";
import { redirect } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { isLocalHostRequest } from "@/lib/local-request";
import { AddItemForm } from "./add-item-form";

export default async function AddItemPage() {
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
      <div className="flex w-full max-w-md flex-col items-center gap-8 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">Add item</h1>
        <AddItemForm />
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
