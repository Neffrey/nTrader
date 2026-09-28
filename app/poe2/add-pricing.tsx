"use client";

import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { useState } from "react";
import { FaArrowRight } from "react-icons/fa";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { ItemSelect } from "@/components/item-select";

const amountClassName =
  "w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500";

function parseAmount(value: string, label: string) {
  const parsed = value.trim() === "" ? 1 : Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return {
      ok: false as const,
      error: `${label} must be greater than zero`,
    };
  }
  return { ok: true as const, amount: parsed };
}

function errorMessage(err: unknown) {
  if (err instanceof ConvexError) {
    return String(err.data);
  }
  if (err instanceof Error) {
    return err.message;
  }
  return "Could not add price";
}

export function AddPricing() {
  const catalog = useQuery(api.items2.list);
  const items = catalog?.items;
  const addPrice = useMutation(api.priceTicks2.add);
  const [itemAId, setItemAId] = useState<Id<"items2"> | "">("");
  const [itemBId, setItemBId] = useState<Id<"items2"> | "">("");
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [reverseAmountA, setReverseAmountA] = useState("");
  const [reverseAmountB, setReverseAmountB] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const sortedItems = [...(items ?? [])].sort((left, right) =>
    left.name.localeCompare(right.name, undefined, { sensitivity: "base" }),
  );
  const clearSaved = () => {
    setSaved(false);
  };

  return (
    <form
      className="flex w-full flex-col gap-3 text-left"
      onSubmit={(event) => {
        event.preventDefault();
        if (itemAId === "" || itemBId === "") {
          setError("Select an item");
          return;
        }
        const parsedA = parseAmount(amountA, "Item A amount");
        if (!parsedA.ok) {
          setError(parsedA.error);
          return;
        }
        const parsedB = parseAmount(amountB, "Item B amount");
        if (!parsedB.ok) {
          setError(parsedB.error);
          return;
        }
        const reverseEntered =
          reverseAmountA.trim() !== "" || reverseAmountB.trim() !== "";
        const parsedReverseA = reverseEntered
          ? parseAmount(reverseAmountA, "Reverse item A amount")
          : null;
        if (parsedReverseA !== null && !parsedReverseA.ok) {
          setError(parsedReverseA.error);
          return;
        }
        const parsedReverseB = reverseEntered
          ? parseAmount(reverseAmountB, "Reverse item B amount")
          : null;
        if (parsedReverseB !== null && !parsedReverseB.ok) {
          setError(parsedReverseB.error);
          return;
        }
        setSaving(true);
        setError(null);
        setSaved(false);
        void addPrice({
          itemAId,
          itemBId,
          amountA: parsedA.amount,
          amountB: parsedB.amount,
        })
          .then(async () => {
            if (parsedReverseA?.ok && parsedReverseB?.ok) {
              await addPrice({
                itemAId: itemBId,
                itemBId: itemAId,
                amountA: parsedReverseA.amount,
                amountB: parsedReverseB.amount,
              });
            }
            setAmountA("");
            setAmountB("");
            setReverseAmountA("");
            setReverseAmountB("");
            setSaved(true);
          })
          .catch((err: unknown) => {
            setError(errorMessage(err));
          })
          .finally(() => {
            setSaving(false);
          });
      }}
    >
      <h2 className="text-lg font-medium text-neutral-100">Add price</h2>
      {catalog?.truncated ? (
        <p className="text-sm text-neutral-400">
          This list is the first 2,000 items. More items exist in the catalog.
        </p>
      ) : null}
      <div className="grid w-full grid-cols-[5rem_minmax(0,1fr)_auto_5rem_minmax(0,1fr)_auto] items-end gap-x-2 gap-y-3">
        <label>
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
              clearSaved();
            }}
          />
        </label>
        <ItemSelect
          className="min-w-0"
          label="Item A"
          items={sortedItems}
          value={itemAId}
          onChange={(id) => {
            setItemAId(id as Id<"items2"> | "");
            clearSaved();
          }}
        />
        <span aria-hidden="true" className="px-1 pb-2 text-neutral-400">
          <FaArrowRight className="h-4 w-4" />
        </span>
        <label>
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
              clearSaved();
            }}
          />
        </label>
        <ItemSelect
          className="min-w-0"
          label="Item B"
          items={sortedItems}
          value={itemBId}
          onChange={(id) => {
            setItemBId(id as Id<"items2"> | "");
            clearSaved();
          }}
        />
        <button
          type="submit"
          disabled={saving || items === undefined}
          className="row-span-3 self-center shrink-0 rounded-md bg-white px-5 py-2.5 text-sm font-medium text-neutral-900 hover:bg-neutral-200 disabled:opacity-60"
        >
          {saving ? "Adding..." : "Add price"}
        </button>
        <p className="col-span-5 text-sm text-neutral-400">Optional reverse price</p>
        <label>
          <input
            type="number"
            inputMode="decimal"
            step="any"
            min="0"
            value={reverseAmountA}
            placeholder="1"
            aria-label="Reverse item A amount"
            className={amountClassName}
            onChange={(event) => {
              setReverseAmountA(event.target.value);
              clearSaved();
            }}
          />
        </label>
        <ItemSelect
          className="min-w-0"
          label="Item A"
          items={sortedItems}
          value={itemBId}
          disabled
          onChange={() => {}}
        />
        <span aria-hidden="true" className="px-1 pb-2 text-neutral-400">
          <FaArrowRight className="h-4 w-4" />
        </span>
        <label>
          <input
            type="number"
            inputMode="decimal"
            step="any"
            min="0"
            value={reverseAmountB}
            placeholder="1"
            aria-label="Reverse item B amount"
            className={amountClassName}
            onChange={(event) => {
              setReverseAmountB(event.target.value);
              clearSaved();
            }}
          />
        </label>
        <ItemSelect
          className="min-w-0"
          label="Item B"
          items={sortedItems}
          value={itemAId}
          disabled
          onChange={() => {}}
        />
      </div>
      {saved && <p className="text-sm text-neutral-400">Price added</p>}
      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
