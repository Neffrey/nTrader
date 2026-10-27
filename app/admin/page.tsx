import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { convexUrlForHost } from "@/lib/convex-deployment";
import { isLocalHostRequest } from "@/lib/local-request";
import { AddItemForm } from "./add-item-form";
import { AddLeagueForm } from "./add-league-form";
import { CategoryAdmin } from "./category-admin";
import { ImportPoeNinjaCatalog } from "./import-poe-ninja-catalog";
import { ImportPoeNinjaCurrency } from "./import-poe-ninja-currency";
import { ImportPoeNinjaFragments } from "./import-poe-ninja-fragments";
import { ImportPoeNinjaTattoos } from "./import-poe-ninja-tattoos";

export default async function AdminPage() {
  const localHost = await isLocalHostRequest();
  const token = await convexAuthNextjsToken();
  if (!token && !localHost) {
    redirect("/");
  }
  if (!localHost) {
    const user = await fetchQuery(api.users.current, {}, {
      token,
      url: convexUrlForHost((await headers()).get("host")),
    });
    if (user === null || user.role !== "admin") {
      redirect("/");
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center bg-neutral-950 px-6 py-16 text-neutral-100">
      <div className="flex w-full max-w-md flex-col items-center gap-12 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">Admin</h1>
        <section className="flex w-full flex-col items-center gap-4">
          <h2 className="text-lg font-medium text-neutral-100">Add item</h2>
          <AddItemForm />
        </section>
        <section className="flex w-full flex-col items-center gap-4">
          <h2 className="text-lg font-medium text-neutral-100">
            Import poe.ninja currency
          </h2>
          <ImportPoeNinjaCurrency />
        </section>
        <section className="flex w-full flex-col items-center gap-4">
          <h2 className="text-lg font-medium text-neutral-100">
            Import poe.ninja fragments
          </h2>
          <ImportPoeNinjaFragments />
        </section>
        <section className="flex w-full flex-col items-center gap-4">
          <h2 className="text-lg font-medium text-neutral-100">
            Import poe.ninja tattoos
          </h2>
          <ImportPoeNinjaTattoos />
        </section>
        <section className="flex w-full flex-col items-center gap-4">
          <h2 className="text-lg font-medium text-neutral-100">
            Import poe.ninja omens
          </h2>
          <ImportPoeNinjaCatalog type="Omen" label="Omens" />
        </section>
        <section className="flex w-full flex-col items-center gap-4">
          <h2 className="text-lg font-medium text-neutral-100">
            Import poe.ninja divination cards
          </h2>
          <ImportPoeNinjaCatalog
            type="DivinationCard"
            label="Divination Cards"
          />
        </section>
        <section className="flex w-full flex-col items-center gap-4">
          <h2 className="text-lg font-medium text-neutral-100">
            Import poe.ninja oils
          </h2>
          <ImportPoeNinjaCatalog type="Oil" label="Oils" />
        </section>
        <section className="flex w-full flex-col items-center gap-4">
          <h2 className="text-lg font-medium text-neutral-100">
            Import poe.ninja delirium orbs
          </h2>
          <ImportPoeNinjaCatalog type="DeliriumOrb" label="Delirium Orbs" />
        </section>
        <section className="flex w-full flex-col items-center gap-4">
          <h2 className="text-lg font-medium text-neutral-100">
            Import poe.ninja scarabs
          </h2>
          <ImportPoeNinjaCatalog type="Scarab" label="Scarabs" />
        </section>
        <section className="flex w-full flex-col items-center gap-4">
          <h2 className="text-lg font-medium text-neutral-100">
            Import poe.ninja fossils
          </h2>
          <ImportPoeNinjaCatalog type="Fossil" label="Fossils" />
        </section>
        <section className="flex w-full flex-col items-center gap-4">
          <h2 className="text-lg font-medium text-neutral-100">
            Import poe.ninja scrying orbs
          </h2>
          <ImportPoeNinjaCatalog type="ScryingOrb" label="Scrying Orbs" />
        </section>
        <section className="flex w-full flex-col items-center gap-4">
          <h2 className="text-lg font-medium text-neutral-100">
            Import poe.ninja enshrouding crystals
          </h2>
          <ImportPoeNinjaCatalog
            type="EnshroudingCrystal"
            label="Enshrouding Crystals"
          />
        </section>
        <section className="flex w-full flex-col items-center gap-4">
          <h2 className="text-lg font-medium text-neutral-100">
            Import poe.ninja astrolabes
          </h2>
          <ImportPoeNinjaCatalog type="Astrolabe" label="Astrolabes" />
        </section>
        <section className="flex w-full flex-col items-center gap-4">
          <h2 className="text-lg font-medium text-neutral-100">Categories</h2>
          <CategoryAdmin />
        </section>
        <section className="flex w-full flex-col items-center gap-4">
          <h2 className="text-lg font-medium text-neutral-100">Add league</h2>
          <AddLeagueForm />
        </section>
        <Link
          href="/"
          className="text-sm text-neutral-400 underline underline-offset-4 hover:text-neutral-200"
        >
          Home
        </Link>
      </div>
    </main>
  );
}
