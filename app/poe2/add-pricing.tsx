"use client";

import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export function AddPricing() {
  const items = useQuery(api.items2.list);
  const addPrice = useMutation(api.priceTicks2.add);
  const [itemAId, setItemAId] = useState<Id<"items2"> | "">("");
  const [itemBId, setItemBId] = useState<Id<"items2"> | "">("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const sortedItems = [...(items ?? [])].sort((left, right) =>
    left.name.localeCompare(right.name, undefined, { sensitivity: "base" }),
  );

  return (
    <form
      className="flex w-full max-w-md flex-col gap-3 text-left"
      onSubmit={(event) => {
        event.preventDefault();
        if (itemAId === "" || itemBId === "") {
          return;
        }
        const parsed = Number(price);
        if (!Number.isFinite(parsed)) {
          setError("Price must be a number");
          return;
        }
        setSaving(true);
        setError(null);
        setSaved(false);
        void addPrice({ itemAId, itemBId, price: parsed })
          .then(() => {
            setPrice("");
            setSaved(true);
          })
          .catch((err: unknown) => {
            if (err instanceof ConvexError) {
              setError(String(err.data));
            } else if (err instanceof Error) {
              setError(err.message);
            } else {
              setError("Could not add price");
            }
          })
          .finally(() => {
            setSaving(false);
          });
      }}
    >
      <h2 className="text-lg font-medium text-neutral-100">Add price</h2>
      <label className="flex flex-col gap-1 text-sm text-neutral-400">
        Item A
        <select
          required
          value={itemAId}
          className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
          onChange={(event) => {
            setItemAId(event.target.value as Id<"items2"> | "");
            setSaved(false);
          }}
        >
          <option value="">Select an item</option>
          {sortedItems.map((item) => (
            <option key={item._id} value={item._id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm text-neutral-400">
        Item B
        <select
          required
          value={itemBId}
          className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
          onChange={(event) => {
            setItemBId(event.target.value as Id<"items2"> | "");
            setSaved(false);
          }}
        >
          <option value="">Select an item</option>
          {sortedItems.map((item) => (
            <option key={item._id} value={item._id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm text-neutral-400">
        Price
        <input
          type="number"
          inputMode="decimal"
          step="any"
          required
          value={price}
          placeholder="Price"
          className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
          onChange={(event) => {
            setPrice(event.target.value);
            setSaved(false);
          }}
        />
      </label>
      <button
        type="submit"
        disabled={saving || items === undefined}
        className="rounded-md bg-white px-5 py-2.5 text-sm font-medium text-neutral-900 hover:bg-neutral-200 disabled:opacity-60"
      >
        {saving ? "Adding..." : "Add price"}
      </button>
      {saved && (
        <p className="text-sm text-neutral-400">Price added</p>
      )}
      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
