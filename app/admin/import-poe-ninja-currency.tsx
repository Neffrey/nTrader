"use client";

import { useAction } from "convex/react";
import { ConvexError } from "convex/values";
import { useState } from "react";
import { api } from "@/convex/_generated/api";

export function ImportPoeNinjaCurrency() {
  const importCurrency = useAction(api.items1.fetchPoeNinjaCurrency);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function onImport() {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const response = await importCurrency({ league: "Allflame" });
      setResult(
        `Imported ${response.count} Allflame currencies (${response.written} written) from poe.ninja.`,
      );
    } catch (cause) {
      setError(
        cause instanceof ConvexError
          ? String(cause.data)
          : cause instanceof Error
            ? cause.message
            : "Import failed",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <p className="text-sm text-neutral-400">
        Pull PoE1 currency names and icons from the Allflame economy page on
        poe.ninja into the local catalog.
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          void onImport();
        }}
        className="rounded-md border border-neutral-700 bg-neutral-900 px-4 py-2 text-sm text-neutral-100 hover:border-neutral-500 disabled:opacity-50"
      >
        {busy ? "Importing…" : "Import Allflame currency"}
      </button>
      {error !== null ? (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      {result !== null ? (
        <p className="text-sm text-neutral-300">{result}</p>
      ) : null}
    </div>
  );
}
