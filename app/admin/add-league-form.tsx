"use client";

import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { useState } from "react";
import { api } from "@/convex/_generated/api";

function internalIdFromName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, "-");
}

export function AddLeagueForm() {
  const addLeague = useMutation(api.gameLeague.add);
  const [name, setName] = useState("");
  const [internalId, setInternalId] = useState("");
  const [internalIdTouched, setInternalIdTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  return (
    <form
      className="flex w-full flex-col gap-3 text-left"
      onSubmit={(event) => {
        event.preventDefault();
        setSaving(true);
        setError(null);
        setSaved(false);
        void addLeague({ name, internalId })
          .then(() => {
            setName("");
            setInternalId("");
            setInternalIdTouched(false);
            setSaved(true);
          })
          .catch((err: unknown) => {
            if (err instanceof ConvexError) {
              setError(String(err.data));
            } else if (err instanceof Error) {
              setError(err.message);
            } else {
              setError("Could not add league");
            }
          })
          .finally(() => {
            setSaving(false);
          });
      }}
    >
      <input
        value={name}
        placeholder="Name"
        required
        className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
        onChange={(event) => {
          const nextName = event.target.value;
          setName(nextName);
          if (!internalIdTouched) {
            setInternalId(internalIdFromName(nextName));
          }
          setSaved(false);
        }}
      />
      <input
        value={internalId}
        placeholder="Internal id"
        required
        className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
        onChange={(event) => {
          const nextId = event.target.value;
          setInternalId(nextId);
          setInternalIdTouched(nextId !== internalIdFromName(name));
          setSaved(false);
        }}
      />
      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-white px-5 py-2.5 text-sm font-medium text-neutral-900 hover:bg-neutral-200 disabled:opacity-60"
      >
        {saving ? "Adding..." : "Add league"}
      </button>
      {saved && (
        <p className="text-center text-sm text-neutral-400">League added</p>
      )}
      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
