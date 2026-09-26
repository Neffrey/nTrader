import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { isLocalHostRequest } from "@/lib/local-request";
import { DisplayNameEditor } from "./display-name-editor";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ poe?: string; message?: string }>;
}) {
  const localHost = await isLocalHostRequest();
  const token = await convexAuthNextjsToken();
  if (!token && !localHost) {
    redirect("/");
  }

  const user = token
    ? await fetchQuery(api.users.current, {}, { token })
    : null;
  if (user === null && !localHost) {
    redirect("/");
  }

  const params = await searchParams;
  const poeError = params.poe === "error" ? params.message : null;

  const fields = [
    { label: "Name", value: user?.name },
    { label: "Email", value: user?.email },
    { label: "Phone", value: user?.phone },
    {
      label: "Path of Exile",
      value: user?.poeAuthorized
        ? (user.poeUsername ?? "Authorized")
        : "Not authorized",
    },
  ];

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-neutral-950 px-6 text-neutral-100">
      <div className="flex w-full max-w-md flex-col items-center gap-8 text-center">
        <div className="flex flex-col items-center gap-4">
          {user?.image && (
            <Image
              src={user.image}
              alt={user.displayName ?? "Profile photo"}
              width={72}
              height={72}
              unoptimized
              className="rounded-full"
            />
          )}
          <h1 className="text-4xl font-semibold tracking-tight">Account</h1>
        </div>

        <dl className="w-full divide-y divide-neutral-800 text-left">
        <DisplayNameEditor displayName={user?.displayName ?? null} />
          {fields.map((field) => (
            <div
              key={field.label}
              className="flex items-baseline justify-between gap-6 py-3"
            >
              <dt className="text-sm text-neutral-500">{field.label}</dt>
              <dd className="text-sm text-neutral-100">
                {field.value ?? "—"}
              </dd>
            </div>
          ))}
        </dl>

        <a
          href="/api/poe/authorize"
          className="rounded-md bg-white px-5 py-2.5 text-sm font-medium text-neutral-900 hover:bg-neutral-200"
        >
          {user?.poeAuthorized ? "Reauthorize Path of Exile" : "Authorize Path of Exile"}
        </a>
        {poeError && (
          <p className="text-sm text-red-400" role="alert">
            {poeError}
          </p>
        )}

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
