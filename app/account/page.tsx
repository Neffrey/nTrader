import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { DisplayNameEditor } from "./display-name-editor";

export default async function AccountPage() {
  const token = await convexAuthNextjsToken();
  if (!token) {
    redirect("/");
  }

  const user = await fetchQuery(api.users.current, {}, { token });
  if (user === null) {
    redirect("/");
  }

  const fields = [
    { label: "Name", value: user.name },
    { label: "Email", value: user.email },
    { label: "Phone", value: user.phone },
  ];

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 px-6 text-neutral-100">
      <div className="flex w-full max-w-md flex-col items-center gap-8 text-center">
        <div className="flex flex-col items-center gap-4">
          {user.image && (
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
          <DisplayNameEditor displayName={user.displayName} />
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
