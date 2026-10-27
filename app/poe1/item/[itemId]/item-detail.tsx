"use client";

import { useQuery } from "convex/react";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  GameLeagueSelect,
  useSelectedLeague,
} from "@/components/game-league-select";
import { PriceHistoryChart } from "@/components/price-history-chart";

function formatValue(value: number) {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 4,
  }).format(value);
}

export function ItemDetail({ itemId }: { itemId: Id<"items1"> }) {
  const { leagueId } = useSelectedLeague();
  const history = useQuery(
    api.priceTicks1.historyForItem,
    leagueId === ""
      ? "skip"
      : { itemId, gameLeagueId: leagueId },
  );

  if (leagueId === "") {
    return (
      <div className="flex w-full flex-col items-center gap-4 text-center">
        <GameLeagueSelect game="poe1" />
        <p className="text-sm text-neutral-400">Select a league to view prices</p>
      </div>
    );
  }

  if (history === undefined) {
    return <p className="text-sm text-neutral-400">Loading…</p>;
  }

  if (history === null) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-sm text-neutral-400">Item or quote currency not found</p>
        <Link
          href="/poe1"
          className="text-sm text-neutral-400 underline underline-offset-4 hover:text-neutral-200"
        >
          Back to prices
        </Link>
      </div>
    );
  }

  const { item, quote, points } = history;
  const newestFirst = [...points].reverse();

  return (
    <div className="flex w-full flex-col gap-8 text-left">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {item.image ? (
            <Image
              src={item.image}
              alt=""
              width={48}
              height={48}
              unoptimized
              className="h-12 w-12 rounded-md object-cover"
            />
          ) : (
            <span className="h-12 w-12 rounded-md bg-neutral-800" />
          )}
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-100">
              {item.name}
            </h1>
            <p className="text-sm text-neutral-400">
              Quoted in {quote.name}
            </p>
          </div>
        </div>
        <GameLeagueSelect game="poe1" />
      </div>

      <PriceHistoryChart points={points} quoteName={quote.name} />

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-neutral-100">Price history</h2>
        {newestFirst.length === 0 ? (
          <p className="text-sm text-neutral-400">
            No price points for this item in the selected league.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-neutral-800">
            <table className="w-full min-w-[28rem] text-left text-sm">
              <thead className="border-b border-neutral-800 bg-neutral-950 text-neutral-400">
                <tr>
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Value ({quote.name})</th>
                  <th className="px-3 py-2 font-medium">Ratio</th>
                </tr>
              </thead>
              <tbody>
                {newestFirst.map((point) => (
                  <tr
                    key={`${point.postTime}-${point.value}`}
                    className="border-b border-neutral-800 last:border-b-0"
                  >
                    <td className="px-3 py-2 text-neutral-200">
                      {new Date(point.postTime).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 tabular-nums text-neutral-100">
                      {formatValue(point.value)}
                    </td>
                    <td className="px-3 py-2 tabular-nums text-neutral-400">
                      {formatValue(point.amountSubject)} :{" "}
                      {formatValue(point.amountQuote)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Link
        href="/poe1"
        className="self-center text-sm text-neutral-400 underline underline-offset-4 hover:text-neutral-200"
      >
        Back to prices
      </Link>
    </div>
  );
}
