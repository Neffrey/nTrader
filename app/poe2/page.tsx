import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function Poe2Page() {
  const token = await convexAuthNextjsToken();
  if (!token) {
    redirect("/");
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-neutral-950 px-6 text-neutral-100">
      <div className="flex w-full max-w-md flex-col items-center gap-8 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">PoE 2</h1>
        <Link
          href="/"
          className="text-sm text-neutral-400 underline underline-offset-4 hover:text-neutral-200"
        >
          PoE 2 Trade Tools
        </Link>
      </div>
    </main>
  );
}
