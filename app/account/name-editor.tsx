"use client";

import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { useState } from "react";
import { api } from "@/convex/_generated/api";

export function NameEditor({ name }: { name: string | null }) {
  const updateName = useMutation(api.users.updateName);
  const [editing, setEditing] = useState(false);
  const [current, setCurrent] = useState(name);
  const [value, setValue] = useState(name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!editing) {
    return (
      <div className="flex items-baseline justify-between gap-6 py-3">
        <dt className="text-sm text-neutral-500">Name</dt>
        <dd className="flex items-center gap-3 text-sm text-neutral-100">
          <span>{current ?? "—"}</span>
          <button
            type="button"
            className="text-neutral-400 underline underline-offset-4 hover:text-neutral-200"
            onClick={() => {
              setValue(current ?? "");
              setError(null);
              setEditing(true);
            }}
          >
            Edit
          </button>
        </dd>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-2 py-3"
      onSubmit={(event) => {
        event.preventDefault();
        setSaving(true);
        setError(null);
        void updateName({ name: value })
          .then((saved) => {
            setCurrent(saved);
            setEditing(false);
          })
          .catch((err: unknown) => {
            if (err instanceof ConvexError) {
              setError(String(err.data));
            } else if (err instanceof Error) {
              setError(err.message);
            } else {
              setError("Could not save name");
            }
          })
          .finally(() => {
            setSaving(false);
          });
      }}
    >
      <label className="text-sm text-neutral-500" htmlFor="account-name">
        Name
      </label>
      <input
        id="account-name"
        value={value}
        maxLength={80}
        autoFocus
        className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
        onChange={(event) => {
          setValue(event.target.value);
        }}
      />
      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          className="text-sm text-neutral-400 hover:text-neutral-200"
          disabled={saving}
          onClick={() => {
            setEditing(false);
            setError(null);
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-neutral-900 hover:bg-neutral-200 disabled:opacity-60"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}
