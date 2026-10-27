export const POE_VIEWS = [
  "prices",
  "flipping",
  "assembly",
  "investing",
  "crafts",
] as const;

export type PoeView = (typeof POE_VIEWS)[number];

export const POE_PLACEHOLDER_VIEWS = [
  "flipping",
  "assembly",
  "investing",
  "crafts",
] as const;

export type PoePlaceholderView = (typeof POE_PLACEHOLDER_VIEWS)[number];

export function parsePoeView(value: string | string[] | undefined): PoeView {
  const raw = Array.isArray(value) ? value[0] : value;
  if (
    raw === "flipping" ||
    raw === "assembly" ||
    raw === "investing" ||
    raw === "crafts" ||
    raw === "prices"
  ) {
    return raw;
  }
  return "prices";
}

export function poeViewHref(game: "poe1" | "poe2", view: PoeView) {
  if (view === "prices") {
    return `/${game}`;
  }
  return `/${game}?view=${view}`;
}
