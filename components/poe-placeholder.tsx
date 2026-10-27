import Link from "next/link";

const titles = {
  flipping: "Flipping",
  assembly: "Assembly",
  investing: "Investing",
  crafts: "Crafts",
} as const;

export function PoePlaceholderPage({
  game,
  section,
}: {
  game: "poe1" | "poe2";
  section: keyof typeof titles;
}) {
  const gameLabel = game === "poe1" ? "PoE 1" : "PoE 2";
  const title = titles[section];

  return (
    <main className="flex flex-1 flex-col items-center bg-neutral-950 px-6 py-16 text-neutral-100">
      <div className="flex w-full max-w-6xl flex-col items-center gap-8 text-center">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">
            {gameLabel} {title}
          </h1>
          <p className="mt-3 text-neutral-400">Coming soon.</p>
        </div>
        <Link
          href={`/${game}`}
          className="text-sm text-neutral-400 underline underline-offset-4 hover:text-neutral-200"
        >
          Back to Prices
        </Link>
      </div>
    </main>
  );
}
