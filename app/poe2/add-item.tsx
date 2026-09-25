"use client";

import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import Image from "next/image";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { ItemMenu } from "@/components/item-menu";

export function AddItem() {
  const items = useQuery(api.items2.list);
  const currentUser = useQuery(api.users.current);
  const updateItem = useMutation(api.items2.update);
  const removeItem = useMutation(api.items2.remove);
  const [editingId, setEditingId] = useState<Id<"items2"> | null>(null);
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [internalId, setInternalId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!items || items.length === 0) {
    return null;
  }

  const role = currentUser?.role;
  const showEdit = role === "admin";
  const showDelete = role === "admin";
  const showComingSoon = role === "user" || role === "admin";

  return (
    <div className="flex w-full flex-col gap-2 text-left">
      <p className="text-sm text-neutral-400">{items.length} items</p>
      {error && editingId === null && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
      <ul className="flex max-h-[32rem] flex-col divide-y divide-neutral-800 overflow-y-auto">
        {items.map((item) => (
          <li key={item._id} className="flex flex-col gap-3 py-3">
            <div className="flex items-center gap-3">
              <Image
                src={item.image}
                alt=""
                width={40}
                height={40}
                unoptimized
                className="h-10 w-10 rounded-md object-cover"
              />
              <span className="flex min-w-0 flex-col">
                <span className="text-sm text-neutral-100">{item.name}</span>
                {item.internalId && (
                  <span className="text-xs text-neutral-500">
                    {item.internalId}
                  </span>
                )}
              </span>
              <ItemMenu
                showEdit={showEdit}
                showDelete={showDelete}
                showComingSoon={showComingSoon}
                onEdit={() => {
                  setEditingId(item._id);
                  setName(item.name);
                  setImage(item.image);
                  setInternalId(item.internalId ?? "");
                  setError(null);
                }}
                onDelete={() => {
                  setError(null);
                  void removeItem({ id: item._id })
                    .then(() => {
                      if (editingId === item._id) {
                        setEditingId(null);
                      }
                    })
                    .catch((err: unknown) => {
                      if (err instanceof ConvexError) {
                        setError(String(err.data));
                      } else if (err instanceof Error) {
                        setError(err.message);
                      } else {
                        setError("Could not delete item");
                      }
                    });
                }}
              />
            </div>
            {editingId === item._id && (
              <form
                className="flex flex-col gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  setSaving(true);
                  setError(null);
                  void updateItem({
                    id: item._id,
                    name,
                    image,
                    internalId,
                  })
                    .then(() => {
                      setEditingId(null);
                    })
                    .catch((err: unknown) => {
                      if (err instanceof ConvexError) {
                        setError(String(err.data));
                      } else if (err instanceof Error) {
                        setError(err.message);
                      } else {
                        setError("Could not update item");
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
                <input
                  value={internalId}
                  placeholder="Internal id"
                  className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
                  onChange={(event) => {
                    setInternalId(event.target.value);
                  }}
                />
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-md bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-200 disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    className="rounded-md border border-neutral-700 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-900"
                    onClick={() => {
                      setEditingId(null);
                      setError(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
                {error && (
                  <p className="text-sm text-red-400" role="alert">
                    {error}
                  </p>
                )}
              </form>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
