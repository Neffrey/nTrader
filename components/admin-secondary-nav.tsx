"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  adminViewHref,
  parseAdminView,
  type AdminView,
} from "@/lib/admin-view";

const sections: Array<{ view: AdminView; label: string }> = [
  { view: "items", label: "Items" },
  { view: "categories", label: "Categories" },
  { view: "leagues", label: "Leagues" },
];

export function AdminSecondaryNav() {
  const searchParams = useSearchParams();
  const activeView = parseAdminView(searchParams.get("view"));

  return (
    <nav
      aria-label="Admin sections"
      className="border-b border-neutral-800 bg-neutral-950"
    >
      <ul className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-6 py-3">
        {sections.map((section) => {
          const href = adminViewHref(section.view);
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
