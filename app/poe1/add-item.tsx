"use client";

import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import Image from "next/image";
import { useState } from "react";
import { api } from "@/convex/_generated/api";

export function AddItem() {
  const addItem = useMutation(api.items1.add);
  const items = useQuery(api.items1.list);
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  return (
    <div className="flex w-full flex-col gap-6 text-left">
      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setSaving(true);
          setError(null);
          void addItem({ name, image })
            .then(() => {
              setName("");
              setImage("");
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
        {error && (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-white px-5 py-2.5 text-sm font-medium text-neutral-900 hover:bg-neutral-200 disabled:opacity-60"
        >
          {saving ? "Adding..." : "Add item"}
        </button>
      </form>

      {items && items.length > 0 && (
        <ul className="flex flex-col divide-y divide-neutral-800">
          {items.map((item) => (
            <li key={item._id} className="flex items-center gap-3 py-3">
              <Image
                src={item.image}
                alt=""
                width={40}
                height={40}
                unoptimized
                className="h-10 w-10 rounded-md object-cover"
              />
              <span className="text-sm text-neutral-100">{item.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
