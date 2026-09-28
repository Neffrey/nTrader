"use client";

import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { useState } from "react";
import { FaArrowRight } from "react-icons/fa";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { ItemSelect } from "@/components/item-select";

const amountClassName =
  "w-20 shrink-0 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500";

export function AddPricing() {
  const items = useQuery(api.items2.list);
  const addPrice = useMutation(api.priceTicks2.add);
  const [itemAId, setItemAId] = useState<Id<"items2"> | "">("");
  const [itemBId, setItemBId] = useState<Id<"items2"> | "">("");
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const sortedItems = [...(items ?? [])].sort((left, right) =>
    left.name.localeCompare(right.name, undefined, { sensitivity: "base" }),
  );

  return (
    <form
      className="flex w-full flex-col gap-3 text-left"
      onSubmit={(event) => {
        event.preventDefault();
        if (itemAId === "" || itemBId === "") {
          setError("Select an item");
          return;
        }
        const parsedA = amountA.trim() === "" ? 1 : Number(amountA);
        const parsedB = amountB.trim() === "" ? 1 : Number(amountB);
        if (!Number.isFinite(parsedA) || parsedA <= 0) {
          setError("Item A amount must be greater than zero");
          return;
        }
        if (!Number.isFinite(parsedB) || parsedB <= 0) {
          setError("Item B amount must be greater than zero");
          return;
        }
        setSaving(true);
        setError(null);
        setSaved(false);
        void addPrice({
          itemAId,
          itemBId,
          amountA: parsedA,
          amountB: parsedB,
        })
          .then(() => {
            setAmountA("");
            setAmountB("");
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
      <div className="flex w-full items-end gap-2">
        <label className="shrink-0">
          <input
            type="number"
            inputMode="decimal"
            step="any"
            min="0"
            value={amountA}
            placeholder="1"
            aria-label="Item A amount"
            className={amountClassName}
            onChange={(event) => {
              setAmountA(event.target.value);
              setSaved(false);
            }}
          />
        </label>
        <ItemSelect
          className="min-w-0 flex-1"
          label="Item A"
          items={sortedItems}
          value={itemAId}
          onChange={(id) => {
            setItemAId(id as Id<"items2"> | "");
            setSaved(false);
          }}
        />
        <span aria-hidden="true" className="shrink-0 px-1 pb-2 text-neutral-400">
          <FaArrowRight className="h-4 w-4" />
        </span>
        <label className="shrink-0">
          <input
            type="number"
            inputMode="decimal"
            step="any"
            min="0"
            value={amountB}
            placeholder="1"
            aria-label="Item B amount"
            className={amountClassName}
            onChange={(event) => {
              setAmountB(event.target.value);
              setSaved(false);
            }}
          />
        </label>
        <ItemSelect
          className="min-w-0 flex-1"
          label="Item B"
          items={sortedItems}
          value={itemBId}
          onChange={(id) => {
            setItemBId(id as Id<"items2"> | "");
            setSaved(false);
          }}
        />
        <button
          type="submit"
          disabled={saving || items === undefined}
          className="shrink-0 rounded-md bg-white px-5 py-2.5 text-sm font-medium text-neutral-900 hover:bg-neutral-200 disabled:opacity-60"
        >
          {saving ? "Adding..." : "Add price"}
        </button>
      </div>
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
