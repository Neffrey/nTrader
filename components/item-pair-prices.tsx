import Image from "next/image";
import { FaArrowRight } from "react-icons/fa";

type PairItem = {
  name: string;
  image?: string | null;
};

type PairQuote<T extends string> = {
  itemAId: T;
  itemBId: T;
  amountA: number;
  amountB: number;
};

function formatPrice(price: number) {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 4,
  }).format(price);
}

function ItemIcon({ item }: { item: PairItem }) {
  if (!item.image) {
    return <span className="h-5 w-5 shrink-0 rounded bg-neutral-800" />;
  }
  return (
    <Image
      src={item.image}
      alt=""
      width={20}
      height={20}
      unoptimized
      className="h-5 w-5 shrink-0 rounded object-cover"
    />
  );
}

export function ItemPairPrices<T extends string>({
  itemId,
  favoriteIds,
  quotes,
  itemsById,
}: {
  itemId: T;
  favoriteIds: ReadonlySet<T>;
  quotes: PairQuote<T>[];
  itemsById: ReadonlyMap<T, PairItem>;
}) {
  const labels = quotes
    .flatMap((quote) => {
      const otherId =
        quote.itemAId === itemId
          ? quote.itemBId
          : quote.itemBId === itemId
            ? quote.itemAId
            : null;
      const includesFavorite =
        favoriteIds.has(quote.itemAId) || favoriteIds.has(quote.itemBId);
      if (otherId === null || otherId === itemId || !includesFavorite) {
        return [];
      }
      const itemA = itemsById.get(quote.itemAId);
      const itemB = itemsById.get(quote.itemBId);
      const other = itemsById.get(otherId);
      if (itemA === undefined || itemB === undefined || other === undefined) {
        return [];
      }
      return [{ quote, otherName: other.name, itemA, itemB }];
    })
    .sort((left, right) => {
      const nameComparison = left.otherName.localeCompare(right.otherName, undefined, {
        sensitivity: "base",
      });
      if (nameComparison !== 0) {
        return nameComparison;
      }
      const leftOutgoing = left.quote.itemAId === itemId ? 0 : 1;
      const rightOutgoing = right.quote.itemAId === itemId ? 0 : 1;
      return leftOutgoing - rightOutgoing;
    });

  if (labels.length === 0) {
    return null;
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {labels.map(({ quote, itemA, itemB }) => (
        <span
          key={`${quote.itemAId}-${quote.itemBId}`}
          className="inline-flex items-center gap-1 rounded bg-neutral-900 px-1.5 py-0.5 text-xs text-neutral-200"
          aria-label={`${quote.amountA === 1 ? itemA.name : `${itemA.name} ${formatPrice(quote.amountA)}`} to ${quote.amountB === 1 ? itemB.name : `${itemB.name} ${formatPrice(quote.amountB)}`}`}
        >
          <ItemIcon item={itemA} />
          {quote.amountA === 1 ? null : (
            <span className="tabular-nums">{formatPrice(quote.amountA)}</span>
          )}
          <FaArrowRight className="h-3 w-3 shrink-0 text-neutral-400" aria-hidden="true" />
          <ItemIcon item={itemB} />
          {quote.amountB === 1 ? null : (
            <span className="tabular-nums">{formatPrice(quote.amountB)}</span>
          )}
        </span>
      ))}
    </span>
  );
}
