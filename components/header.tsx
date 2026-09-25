"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { api } from "@/convex/_generated/api";

const memberLinks = [
  { href: "/poe1", label: "PoE 1", admin: false },
  { href: "/poe2", label: "PoE 2", admin: false },
  { href: "/add-item", label: "Add item", admin: true },
  { href: "/account", label: "Account", admin: false },
];

export function Header() {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const currentUser = useQuery(api.users.current);
  const { signIn } = useAuthActions();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <header className="border-b border-neutral-800 bg-neutral-950">
      <nav className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 py-4">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-neutral-100"
        >
          nTrader
        </Link>
        <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <li>
            <Link
              href="/"
              aria-current={pathname === "/" ? "page" : undefined}
              className={
                pathname === "/"
                  ? "text-sm text-neutral-100"
                  : "text-sm text-neutral-400 hover:text-neutral-200"
              }
            >
              Home
            </Link>
          </li>
          {!isLoading &&
            isAuthenticated &&
            memberLinks
              .filter((link) => !link.admin || currentUser?.role === "admin")
              .map((link) => {
              const active = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={
                      active
                        ? "text-sm text-neutral-100"
                        : "text-sm text-neutral-400 hover:text-neutral-200"
                    }
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          {!isLoading && !isAuthenticated && (
            <li>
              <button
                type="button"
                disabled={signingIn}
                className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-neutral-900 hover:bg-neutral-200 disabled:opacity-60"
                onClick={() => {
                  setSigningIn(true);
                  setError(null);
                  void signIn("google", { redirectTo: "/" }).catch(
                    (err: Error) => {
                      setError(err.message);
                      setSigningIn(false);
                    },
                  );
                }}
              >
                {signingIn ? "Loading..." : "Log in"}
              </button>
            </li>
          )}
        </ul>
        {error && (
          <p className="w-full text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
      </nav>
    </header>
  );
}
