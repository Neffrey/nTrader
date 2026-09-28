"use client";

import { useQuery } from "convex/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type Game = "poe1" | "poe2";

type SelectedLeague = {
  leagueId: Id<"gameLeague"> | "";
  setLeagueId: (leagueId: Id<"gameLeague"> | "") => void;
};

const SelectedLeagueContext = createContext<SelectedLeague | null>(null);

export function SelectedLeagueProvider({
  game,
  children,
}: {
  game: Game;
  children: ReactNode;
}) {
  const storageKey = `ntrader.league.${game}`;
  const [leagueId, setLeagueIdState] = useState<Id<"gameLeague"> | "">("");

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (stored) {
      setLeagueIdState(stored as Id<"gameLeague">);
    }
  }, [storageKey]);

  const setLeagueId = useCallback(
    (next: Id<"gameLeague"> | "") => {
      setLeagueIdState(next);
      if (next === "") {
        window.localStorage.removeItem(storageKey);
      } else {
        window.localStorage.setItem(storageKey, next);
      }
    },
    [storageKey],
  );

  const value = useMemo(
    () => ({ leagueId, setLeagueId }),
    [leagueId, setLeagueId],
  );

  return (
    <SelectedLeagueContext.Provider value={value}>
      {children}
    </SelectedLeagueContext.Provider>
  );
}

export function useSelectedLeague() {
  const value = useContext(SelectedLeagueContext);
  if (value === null) {
    throw new Error("League selection is unavailable");
  }
  return value;
}

export function GameLeagueSelect({ game }: { game: Game }) {
  const leagues = useQuery(api.gameLeague.listByGame, { game });
  const { leagueId, setLeagueId } = useSelectedLeague();

  useEffect(() => {
    if (leagues === undefined || leagueId === "") {
      return;
    }
    if (!leagues.some((league) => league._id === leagueId)) {
      setLeagueId("");
    }
  }, [leagues, leagueId, setLeagueId]);

  return (
    <label className="flex w-56 shrink-0 flex-col gap-1 text-left text-sm text-neutral-300">
      <span className="sr-only">League</span>
      <select
        value={leagueId}
        aria-label="Game league"
        className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
        onChange={(event) => {
          setLeagueId(event.target.value as Id<"gameLeague"> | "");
        }}
      >
        <option value="">Select a league</option>
        {(leagues ?? []).map((league) => (
          <option key={league._id} value={league._id}>
            {league.name}
          </option>
        ))}
      </select>
      {leagues !== undefined && leagues.length === 0 ? (
        <span className="text-neutral-500">No leagues for this game</span>
      ) : null}
    </label>
  );
}
