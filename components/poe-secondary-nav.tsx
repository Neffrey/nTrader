"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const sections = [
  { segment: "", label: "Prices" },
  { segment: "flipping", label: "Flipping" },
  { segment: "assembly", label: "Assembly" },
  { segment: "investing", label: "Investing" },
  { segment: "crafts", label: "Crafts" },
] as const;

export function PoeSecondaryNav({ game }: { game: "poe1" | "poe2" }) {
  const pathname = usePathname();
  const base = `/${game}`;

  return (
    <nav
      aria-label={`${game === "poe1" ? "PoE 1" : "PoE 2"} sections`}
      className="border-b border-neutral-800 bg-neutral-950"
    >
      <ul className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-6 py-3">
        {sections.map((section) => {
          const href = section.segment ? `${base}/${section.segment}` : base;
          const active =
            section.segment === ""
              ? pathname === base || pathname === `${base}/`
              : pathname === href || pathname.startsWith(`${href}/`);

          return (
            <li key={section.label}>
              <Link
                href={href}
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
