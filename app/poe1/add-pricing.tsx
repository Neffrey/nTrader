"use client";

import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { ItemSelect } from "@/components/item-select";

export function AddPricing() {
  const items = useQuery(api.items1.list);
  const addPrice = useMutation(api.priceTicks1.add);
  const [itemAId, setItemAId] = useState<Id<"items1"> | "">("");
  const [itemBId, setItemBId] = useState<Id<"items1"> | "">("");
  const [price, setPrice] = useState("");
  const [reversePrice, setReversePrice] = useState("");
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
          setError("Select an item");
          return;
        }
        const parsed = Number(price);
        const parsedReverse = Number(reversePrice);
        if (!Number.isFinite(parsed) || !Number.isFinite(parsedReverse)) {
          setError("Price must be a number");
          return;
        }
        setSaving(true);
        setError(null);
        setSaved(false);
        void addPrice({
          itemAId,
          itemBId,
          price: parsed,
          reversePrice: parsedReverse,
        })
          .then(() => {
            setPrice("");
            setReversePrice("");
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
      <ItemSelect
        label="Item A"
        items={sortedItems}
        value={itemAId}
        onChange={(id) => {
          setItemAId(id as Id<"items1"> | "");
          setSaved(false);
        }}
      />
      <ItemSelect
        label="Item B"
        items={sortedItems}
        value={itemBId}
        onChange={(id) => {
          setItemBId(id as Id<"items1"> | "");
          setSaved(false);
        }}
      />
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
      <label className="flex flex-col gap-1 text-sm text-neutral-400">
        Reverse price
        <input
          type="number"
          inputMode="decimal"
          step="any"
          required
          value={reversePrice}
          placeholder="Reverse price"
          className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
          onChange={(event) => {
            setReversePrice(event.target.value);
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
      {saved && <p className="text-sm text-neutral-400">Price added</p>}
      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
