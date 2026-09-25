"use client";

import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { useState } from "react";
import { api } from "@/convex/_generated/api";

type Game = "poe1" | "poe2";

export function AddItemForm() {
  const addItem1 = useMutation(api.items1.add);
  const addItem2 = useMutation(api.items2.add);
  const [game, setGame] = useState<Game>("poe1");
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [internalId, setInternalId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [savedGame, setSavedGame] = useState<Game | null>(null);
  const [saving, setSaving] = useState(false);

  return (
    <form
      className="flex w-full flex-col gap-3 text-left"
      onSubmit={(event) => {
        event.preventDefault();
        setSaving(true);
        setError(null);
        setSavedGame(null);
        const save =
          game === "poe1"
            ? addItem1({ name, image, internalId })
            : addItem2({ name, image });
        void save
          .then(() => {
            setName("");
            setImage("");
            setInternalId("");
            setSavedGame(game);
          })
          .catch((err: unknown) => {
            if (err instanceof ConvexError) {
              setError(String(err.data));
            } else if (err instanceof Error) {
              setError(err.message);
            } else {
              setError("Could not add item");
            }
          })
          .finally(() => {
            setSaving(false);
          });
      }}
    >
      <fieldset className="flex items-center justify-center gap-6 py-1">
        <legend className="sr-only">Game</legend>
        <label className="flex items-center gap-2 text-sm text-neutral-100">
          <input
            type="radio"
            name="game"
            value="poe1"
            checked={game === "poe1"}
            onChange={() => {
              setGame("poe1");
              setSavedGame(null);
            }}
          />
          PoE 1
        </label>
        <label className="flex items-center gap-2 text-sm text-neutral-100">
          <input
            type="radio"
            name="game"
            value="poe2"
            checked={game === "poe2"}
            onChange={() => {
              setGame("poe2");
              setSavedGame(null);
            }}
          />
          PoE 2
        </label>
      </fieldset>
      <input
        value={name}
        placeholder="Name"
        required
        className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
        onChange={(event) => {
          setName(event.target.value);
          setSavedGame(null);
        }}
      />
      <input
        value={image}
        placeholder="Image"
        required
        className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
        onChange={(event) => {
          setImage(event.target.value);
          setSavedGame(null);
        }}
      />
      {game === "poe1" && (
        <input
          value={internalId}
          placeholder="Internal id"
          className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
          onChange={(event) => {
            setInternalId(event.target.value);
            setSavedGame(null);
          }}
        />
      )}
      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-white px-5 py-2.5 text-sm font-medium text-neutral-900 hover:bg-neutral-200 disabled:opacity-60"
      >
        {saving ? "Adding..." : "Add item"}
      </button>
      {savedGame && (
        <p className="text-center text-sm text-neutral-400">
          Added to {savedGame === "poe1" ? "PoE 1" : "PoE 2"}
        </p>
      )}
      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
