import Link from "next/link";
import { SelectedLeagueProvider } from "@/components/game-league-select";
import { AddItem } from "./add-item";
import { AddPricing } from "./add-pricing";

export default function Poe2Page() {
  return (
    <SelectedLeagueProvider game="poe2">
      <main className="flex flex-1 flex-col items-center bg-neutral-950 px-6 py-16 text-neutral-100">
        <div className="flex w-full max-w-6xl flex-col items-center gap-8 text-center">
          <h1 className="text-4xl font-semibold tracking-tight">PoE 2</h1>
          <AddPricing />
          <AddItem />
          <Link
            href="/"
            className="text-sm text-neutral-400 underline underline-offset-4 hover:text-neutral-200"
          >
            PoE 2 Trade Tools
          </Link>
        </div>
      </main>
    </SelectedLeagueProvider>
  );
}
