import { SelectedLeagueProvider } from "@/components/game-league-select";
import type { Id } from "@/convex/_generated/dataModel";
import { ItemDetail } from "./item-detail";

export default async function Poe1ItemPage({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  const { itemId } = await params;

  return (
    <SelectedLeagueProvider game="poe1">
      <main className="flex flex-1 flex-col items-center bg-neutral-950 px-6 py-16 text-neutral-100">
        <div className="flex w-full max-w-4xl flex-col items-center gap-8">
          <ItemDetail itemId={itemId as Id<"items1">} />
        </div>
      </main>
    </SelectedLeagueProvider>
  );
}
