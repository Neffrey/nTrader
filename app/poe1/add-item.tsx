"use client";

import { useAction, useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import Image from "next/image";
import { useState } from "react";
import { api } from "@/convex/_generated/api";

export function AddItem() {
  const addItem = useMutation(api.items1.add);
  const fetchAll = useAction(api.items1.fetchAll);
  const items = useQuery(api.items1.list);
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [internalId, setInternalId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [fetchedCount, setFetchedCount] = useState<number | null>(null);

  return (
    <div className="flex w-full flex-col gap-6 text-left">
      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={fetching}
          className="rounded-md bg-white px-5 py-2.5 text-sm font-medium text-neutral-900 hover:bg-neutral-200 disabled:opacity-60"
          onClick={() => {
            setFetching(true);
            setError(null);
            setFetchedCount(null);
            void fetchAll({})
              .then((result) => {
                setFetchedCount(result.count);
              })
              .catch((err: unknown) => {
                if (err instanceof ConvexError) {
                  setError(String(err.data));
                } else if (err instanceof Error) {
                  setError(err.message);
                } else {
                  setError("Could not fetch items");
                }
              })
              .finally(() => {
                setFetching(false);
              });
          }}
        >
          {fetching ? "Fetching..." : "Fetch currency and fragments"}
        </button>
        {fetchedCount !== null && (
          <p className="text-sm text-neutral-400">
            Synced {fetchedCount} currency and fragment items
          </p>
        )}
        {error && (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
      </div>
      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setSaving(true);
          setError(null);
          void addItem({ name, image, internalId })
            .then(() => {
              setName("");
              setImage("");
              setInternalId("");
            })
            .catch((err: unknown) => {
              if (err instanceof ConvexError) {
                setError(String(err.data));
              } else if (err instanceof Error) {
                setError(err.message);
              } else {
                setError("Could not add item");
              }
            })
            .finally(() => {
              setSaving(false);
            });
        }}
      >
        <input
          value={internalId}
          placeholder="Internal id"
          className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
          onChange={(event) => {
            setInternalId(event.target.value);
          }}
        />
        <input
          value={name}
          placeholder="Name"
          required
          className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
          onChange={(event) => {
            setName(event.target.value);
          }}
        />
        <input
          value={image}
          placeholder="Image"
          required
          className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
          onChange={(event) => {
            setImage(event.target.value);
          }}
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-white px-5 py-2.5 text-sm font-medium text-neutral-900 hover:bg-neutral-200 disabled:opacity-60"
        >
          {saving ? "Adding..." : "Add item"}
        </button>
      </form>

      {items && items.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-neutral-400">{items.length} items</p>
          <ul className="flex max-h-[32rem] flex-col divide-y divide-neutral-800 overflow-y-auto">
          {items.map((item) => (
            <li key={item._id} className="flex items-center gap-3 py-3">
              {item.image && (
                <Image
                  src={item.image}
                  alt=""
                  width={40}
                  height={40}
                  unoptimized
                  className="h-10 w-10 rounded-md object-cover"
                />
              )}
              <span className="flex flex-col">
                <span className="text-sm text-neutral-100">{item.name}</span>
                {item.internalId && (
                  <span className="text-xs text-neutral-500">
                    {item.internalId}
                  </span>
                )}
              </span>
            </li>
          ))}
          </ul>
        </div>
      )}
    </div>
  );
}
