"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const { signIn, signOut } = useAuthActions();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 px-6 text-neutral-100">
      <div className="flex w-full max-w-md flex-col items-center gap-8 text-center">
        <div>
          <h1 className="text-5xl font-semibold tracking-tight">nTrader</h1>
          <p className="mt-3 text-lg text-neutral-400">
            Arbitrage Trade Tools for PoE
          </p>
        </div>

        {isLoading ? null : isAuthenticated ? (
          <div className="flex items-center gap-3">
            <Link
              href="/account"
              className="rounded-md border border-neutral-700 px-5 py-2.5 text-sm text-neutral-200 hover:bg-neutral-900"
            >
              Account
            </Link>
            <button
              type="button"
              className="rounded-md border border-neutral-700 px-5 py-2.5 text-sm text-neutral-200 hover:bg-neutral-900"
              onClick={() => {
                void signOut();
              }}
            >
              Sign out
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-neutral-400">Must login to use tools</p>
            <button
              type="button"
              disabled={loading}
              className="inline-flex items-center justify-center gap-3 rounded-md bg-white px-5 py-2.5 text-sm font-medium text-neutral-900 hover:bg-neutral-200 disabled:opacity-60"
              onClick={() => {
                setLoading(true);
                setError(null);
                void signIn("google", { redirectTo: "/" }).catch(
                  (err: Error) => {
                    setError(err.message);
                    setLoading(false);
                  },
                );
              }}
            >
              <GoogleLogo />
              {loading ? "Loading..." : "Sign in with Google"}
            </button>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}

function GoogleLogo() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
