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

export function CategoryAdmin() {
  const categories = useQuery(api.itemCategory.list);
  const addCategory = useMutation(api.itemCategory.add);
  const updateCategory = useMutation(api.itemCategory.update);
  const removeCategory = useMutation(api.itemCategory.remove);
  const [name, setName] = useState("");
  const [game, setGame] = useState<Game>("poe1");
  const [editingId, setEditingId] = useState<Id<"itemCategory"> | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingGame, setEditingGame] = useState<Game>("poe1");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);

  const groups = gameGroups
    .map((group) => ({
      ...group,
      categories: (categories ?? []).filter((category) => category.game === group.game),
    }))
    .filter((group) => group.categories.length > 0);

  return (
    <div className="flex w-full flex-col gap-4 text-left">
      <form
        className="flex w-full flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setAdding(true);
          setError(null);
          setSaved(false);
          void addCategory({ name, game })
            .then(() => {
              setName("");
              setSaved(true);
            })
            .catch((err: unknown) => {
              setError(errorMessage(err, "Could not add category"));
            })
            .finally(() => {
              setAdding(false);
            });
        }}
      >
        <GameRadios
          name="category-game"
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
          aria-label="Category name"
          className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
          onChange={(event) => {
            setName(event.target.value);
            setSaved(false);
          }}
        />
        <button
          type="submit"
          disabled={adding}
          className="rounded-md bg-white px-5 py-2.5 text-sm font-medium text-neutral-900 hover:bg-neutral-200 disabled:opacity-60"
        >
          {adding ? "Adding..." : "Add category"}
        </button>
        {saved && (
          <p className="text-center text-sm text-neutral-400">Category added</p>
        )}
      </form>
      {categories === undefined ? null : categories.length === 0 ? (
        <p className="text-sm text-neutral-400">No categories yet</p>
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map((group) => (
            <section key={group.game} className="flex flex-col gap-2">
              <h3 className="text-sm font-medium text-neutral-300">{group.label}</h3>
              <ul className="flex flex-col gap-2">
                {group.categories.map((category) => (
                  <li
                    key={category._id}
                    className="flex items-center justify-between gap-2 rounded-md border border-neutral-800 px-3 py-2"
                  >
                    {editingId === category._id ? (
                      <form
                        className="flex w-full flex-col gap-2"
                        onSubmit={(event) => {
                          event.preventDefault();
                          setEditing(true);
                          setError(null);
                          void updateCategory({
                            id: category._id,
                            name: editingName,
                            game: editingGame,
                          })
                            .then(() => {
                              setEditingId(null);
                            })
                            .catch((err: unknown) => {
                              setError(errorMessage(err, "Could not update category"));
                            })
                            .finally(() => {
                              setEditing(false);
                            });
                        }}
                      >
                        <GameRadios
                          name={`edit-category-game-${category._id}`}
                          game={editingGame}
                          onChange={setEditingGame}
                        />
                        <div className="flex w-full items-center gap-2">
                          <input
                            value={editingName}
                            required
                            aria-label={`Edit ${category.name}`}
                            className="min-w-0 flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
                            onChange={(event) => {
                              setEditingName(event.target.value);
                            }}
                          />
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
                          {category.name}
                        </span>
                        <button
                          type="button"
                          className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-200 hover:bg-neutral-900"
                          onClick={() => {
                            setEditingId(category._id);
                            setEditingName(category.name);
                            setEditingGame(category.game);
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
                            void removeCategory({ id: category._id }).catch(
                              (err: unknown) => {
                                setError(errorMessage(err, "Could not delete category"));
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
