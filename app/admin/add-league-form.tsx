"use client";

import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type Game = "poe1" | "poe2";

const gameGroups: { game: Game; label: string }[] = [
  { game: "poe1", label: "PoE 1" },
  { game: "poe2", label: "PoE 2" },
];

function internalIdFromName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, "-");
}

function errorMessage(err: unknown, fallback: string) {
  if (err instanceof ConvexError) {
    return String(err.data);
  }
  if (err instanceof Error) {
    return err.message;
  }
  return fallback;
}

function GameRadios({
  name,
  game,
  onChange,
}: {
  name: string;
  game: Game;
  onChange: (game: Game) => void;
}) {
  return (
    <fieldset className="flex items-center justify-center gap-6 py-1">
      <legend className="sr-only">Game</legend>
      <label className="flex items-center gap-2 text-sm text-neutral-100">
        <input
          type="radio"
          name={name}
          value="poe1"
          checked={game === "poe1"}
          onChange={() => {
            onChange("poe1");
          }}
        />
        PoE 1
      </label>
      <label className="flex items-center gap-2 text-sm text-neutral-100">
        <input
          type="radio"
          name={name}
          value="poe2"
          checked={game === "poe2"}
          onChange={() => {
            onChange("poe2");
          }}
        />
        PoE 2
      </label>
    </fieldset>
  );
}

export function AddLeagueForm() {
  const leagues = useQuery(api.gameLeague.list);
  const addLeague = useMutation(api.gameLeague.add);
  const updateLeague = useMutation(api.gameLeague.update);
  const removeLeague = useMutation(api.gameLeague.remove);
  const [name, setName] = useState("");
  const [internalId, setInternalId] = useState("");
  const [internalIdTouched, setInternalIdTouched] = useState(false);
  const [game, setGame] = useState<Game>("poe1");
  const [editingId, setEditingId] = useState<Id<"gameLeague"> | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingInternalId, setEditingInternalId] = useState("");
  const [editingGame, setEditingGame] = useState<Game>("poe1");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);

  const groups = gameGroups
    .map((group) => ({
      ...group,
      leagues: (leagues ?? []).filter((league) => league.game === group.game),
    }))
    .filter((group) => group.leagues.length > 0);

  return (
    <div className="flex w-full flex-col gap-4 text-left">
      <form
        className="flex w-full flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setAdding(true);
          setError(null);
          setSaved(false);
          void addLeague({ name, internalId, game })
            .then(() => {
              setName("");
              setInternalId("");
              setInternalIdTouched(false);
              setSaved(true);
            })
            .catch((err: unknown) => {
              setError(errorMessage(err, "Could not add league"));
            })
            .finally(() => {
              setAdding(false);
            });
        }}
      >
        <GameRadios
          name="league-game"
          game={game}
          onChange={(next) => {
            setGame(next);
            setSaved(false);
          }}
        />
        <input
          value={name}
          placeholder="Name"
          required
          aria-label="League name"
          className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
          onChange={(event) => {
            const nextName = event.target.value;
            setName(nextName);
            if (!internalIdTouched) {
              setInternalId(internalIdFromName(nextName));
            }
            setSaved(false);
          }}
        />
        <input
          value={internalId}
          placeholder="Internal id"
          required
          aria-label="League internal id"
          className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
          onChange={(event) => {
            const nextId = event.target.value;
            setInternalId(nextId);
            setInternalIdTouched(nextId !== internalIdFromName(name));
            setSaved(false);
          }}
        />
        <button
          type="submit"
          disabled={adding}
          className="rounded-md bg-white px-5 py-2.5 text-sm font-medium text-neutral-900 hover:bg-neutral-200 disabled:opacity-60"
        >
          {adding ? "Adding..." : "Add league"}
        </button>
        {saved && (
          <p className="text-center text-sm text-neutral-400">League added</p>
        )}
      </form>
      {leagues === undefined ? null : leagues.length === 0 ? (
        <p className="text-sm text-neutral-400">No leagues yet</p>
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map((group) => (
            <section key={group.game} className="flex flex-col gap-2">
              <h3 className="text-sm font-medium text-neutral-300">
                {group.label}
              </h3>
              <ul className="flex flex-col gap-2">
                {group.leagues.map((league) => (
                  <li
                    key={league._id}
                    className="flex items-center justify-between gap-2 rounded-md border border-neutral-800 px-3 py-2"
                  >
                    {editingId === league._id ? (
                      <form
                        className="flex w-full flex-col gap-2"
                        onSubmit={(event) => {
                          event.preventDefault();
                          setEditing(true);
                          setError(null);
                          void updateLeague({
                            id: league._id,
                            name: editingName,
                            internalId: editingInternalId,
                            game: editingGame,
                          })
                            .then(() => {
                              setEditingId(null);
                            })
                            .catch((err: unknown) => {
                              setError(
                                errorMessage(err, "Could not update league"),
                              );
                            })
                            .finally(() => {
                              setEditing(false);
                            });
                        }}
                      >
                        <GameRadios
                          name={`edit-league-game-${league._id}`}
                          game={editingGame}
                          onChange={setEditingGame}
                        />
                        <input
                          value={editingName}
                          required
                          aria-label={`Edit ${league.name}`}
                          placeholder="Name"
                          className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
                          onChange={(event) => {
                            setEditingName(event.target.value);
                          }}
                        />
                        <input
                          value={editingInternalId}
                          required
                          aria-label={`Edit internal id for ${league.name}`}
                          placeholder="Internal id"
                          className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
                          onChange={(event) => {
                            setEditingInternalId(event.target.value);
                          }}
                        />
                        <div className="flex w-full items-center gap-2">
                          <button
                            type="submit"
                            disabled={editing}
                            className="rounded-md bg-white px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-200 disabled:opacity-60"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            className="rounded-md border border-neutral-700 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-900"
                            onClick={() => {
                              setEditingId(null);
                              setError(null);
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <span className="min-w-0 flex-1 truncate text-sm text-neutral-100">
                          {league.name}
                        </span>
                        <button
                          type="button"
                          className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-200 hover:bg-neutral-900"
                          onClick={() => {
                            setEditingId(league._id);
                            setEditingName(league.name);
                            setEditingInternalId(league.internalId);
                            setEditingGame(league.game);
                            setError(null);
                            setSaved(false);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-200 hover:bg-neutral-900"
                          onClick={() => {
                            setError(null);
                            setSaved(false);
                            void removeLeague({ id: league._id }).catch(
                              (err: unknown) => {
                                setError(
                                  errorMessage(err, "Could not delete league"),
                                );
                              },
                            );
                          }}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
