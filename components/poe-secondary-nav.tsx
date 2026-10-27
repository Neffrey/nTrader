"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { parsePoeView, poeViewHref, type PoeView } from "@/lib/poe-view";

const sections: Array<{ view: PoeView; label: string }> = [
  { view: "prices", label: "Prices" },
  { view: "flipping", label: "Flipping" },
  { view: "assembly", label: "Assembly" },
  { view: "investing", label: "Investing" },
  { view: "crafts", label: "Crafts" },
];

export function PoeSecondaryNav({ game }: { game: "poe1" | "poe2" }) {
  const searchParams = useSearchParams();
  const activeView = parsePoeView(searchParams.get("view") ?? undefined);

  return (
    <nav
      aria-label={`${game === "poe1" ? "PoE 1" : "PoE 2"} sections`}
      className="border-b border-neutral-800 bg-neutral-950"
    >
      <ul className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-6 py-3">
        {sections.map((section) => {
          const href = poeViewHref(game, section.view);
          const active = activeView === section.view;

          return (
            <li key={section.view}>
              <Link
                href={href}
                scroll={false}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "text-sm text-neutral-100"
                    : "text-sm text-neutral-400 hover:text-neutral-200"
                }
              >
                {section.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
