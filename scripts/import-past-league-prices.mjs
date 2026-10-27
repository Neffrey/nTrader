/**
 * Import historic PoE1 prices from `past league data/<League>/*.csv` into Convex.
 *
 * Currency CSV: League;Date;Get;Pay;Value;Confidence
 *   → 1 Get for Value Pay (both items must exist)
 * Items CSV: League;Date;Id;Type;Name;BaseType;Variant;Links;Value;Confidence
 *   → 1 Name for Value Chaos Orb (both must exist)
 *
 * Usage:
 *   node scripts/import-past-league-prices.mjs
 *   node scripts/import-past-league-prices.mjs --prod
 *
 * Defaults to destin (personal/dev deployment). Pass --prod only with consent.
 */
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_ROOT = path.join(ROOT, "past league data");
const BATCH = 40;
const CHAOS_NAME = "Chaos Orb";
const useProd = process.argv.includes("--prod");

function runConvex(args) {
  const convexJs = path.join(ROOT, "node_modules", "convex", "bin", "main.js");
  const env = { ...process.env };
  if (useProd) {
    delete env.CONVEX_DEPLOY_KEY;
  }
  return spawnSync(process.execPath, [convexJs, ...args], {
    encoding: "utf8",
    cwd: ROOT,
    env,
    maxBuffer: 32 * 1024 * 1024,
  });
}

function convexRun(fn, argsObj) {
  const args = ["run", fn, JSON.stringify(argsObj)];
  if (useProd) args.push("--prod");
  const r = runConvex(args);
  if (r.status !== 0) {
    throw new Error(
      `convex run ${fn} failed:\n${r.stderr || ""}\n${r.stdout || ""}`,
    );
  }
  const out = (r.stdout || "").trim();
  if (!out) return null;
  try {
    return JSON.parse(out);
  } catch {
    return out;
  }
}

function inlineQuery(source) {
  const args = ["run", "--inline-query", source];
  if (useProd) args.push("--prod");
  const r = runConvex(args);
  if (r.status !== 0) {
    throw new Error(`inline-query failed:\n${r.stderr || ""}\n${r.stdout || ""}`);
  }
  return JSON.parse((r.stdout || "").trim());
}

function dateToPostTime(dateStr) {
  // YYYY-MM-DD → UTC noon
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  if (!m) return null;
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0);
}

async function* readCsvLines(filePath) {
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });
  let header = true;
  for await (const line of rl) {
    if (header) {
      header = false;
      continue;
    }
    if (line.trim().length === 0) continue;
    yield line;
  }
}

function splitRow(line) {
  return line.split(";");
}

async function flushBatch(ctx, batch, stats) {
  if (batch.length === 0) return;
  const result = convexRun("priceTicks1:importHistoricBatch", {
    userId: ctx.userId,
    gameLeagueId: ctx.leagueId,
    ticks: batch,
  });
  stats.imported += result?.written ?? 0;
  stats.skippedExisting += result?.skippedExisting ?? 0;
  batch.length = 0;
}

async function importCurrencyCsv(filePath, nameToId, ctx, stats) {
  const batch = [];
  for await (const line of readCsvLines(filePath)) {
    stats.rows += 1;
    const parts = splitRow(line);
    if (parts.length < 5) {
      stats.skipped += 1;
      continue;
    }
    const [, date, getName, payName, valueRaw] = parts;
    const value = Number(valueRaw);
    const postTime = dateToPostTime(date);
    const itemAId = nameToId.get(getName);
    const itemBId = nameToId.get(payName);
    if (
      itemAId === undefined ||
      itemBId === undefined ||
      itemAId === itemBId ||
      postTime === null ||
      !Number.isFinite(value) ||
      value <= 0
    ) {
      stats.skipped += 1;
      continue;
    }
    batch.push({
      itemAId,
      itemBId,
      amountA: 1,
      amountB: value,
      postTime,
    });
    if (batch.length >= BATCH) {
      await flushBatch(ctx, batch, stats);
      if (stats.rows % 2000 === 0) {
        process.stdout.write(
          `  currency progress rows=${stats.rows} imported=${stats.imported} skipped=${stats.skipped}\r`,
        );
      }
    }
  }
  await flushBatch(ctx, batch, stats);
  process.stdout.write("\n");
}

async function importItemsCsv(filePath, nameToId, ctx, stats) {
  const chaosId = nameToId.get(CHAOS_NAME);
  if (chaosId === undefined) {
    throw new Error(`${CHAOS_NAME} missing from items1 — cannot import items CSV`);
  }
  const batch = [];
  for await (const line of readCsvLines(filePath)) {
    stats.rows += 1;
    const parts = splitRow(line);
    // League;Date;Id;Type;Name;BaseType;Variant;Links;Value;Confidence
    if (parts.length < 9) {
      stats.skipped += 1;
      continue;
    }
    const [, date, , , name, , , , valueRaw] = parts;
    const value = Number(valueRaw);
    const postTime = dateToPostTime(date);
    const itemAId = nameToId.get(name);
    if (
      itemAId === undefined ||
      itemAId === chaosId ||
      postTime === null ||
      !Number.isFinite(value) ||
      value <= 0
    ) {
      stats.skipped += 1;
      continue;
    }
    batch.push({
      itemAId,
      itemBId: chaosId,
      amountA: 1,
      amountB: value,
      postTime,
    });
    if (batch.length >= BATCH) {
      await flushBatch(ctx, batch, stats);
      if (stats.rows % 100000 === 0) {
        process.stdout.write(
          `  items progress rows=${stats.rows} imported=${stats.imported} skipped=${stats.skipped}\r`,
        );
      }
    }
  }
  await flushBatch(ctx, batch, stats);
  process.stdout.write("\n");
}

async function main() {
  const target = useProd
    ? "prod (clean-warthog-990)"
    : "destin (adjoining-meerkat-656)";
  console.log(`target: ${target} — historic PoE1 price import from past league data`);

  if (!fs.existsSync(DATA_ROOT)) {
    throw new Error(`Missing folder: ${DATA_ROOT}`);
  }

  const meta = inlineQuery(`
    const items = await ctx.db.query("items1").take(2000);
    const leagues = await ctx.db.query("gameLeague").withIndex("by_game", q => q.eq("game", "poe1")).take(50);
    const users = await ctx.db.query("users").take(20);
    const admin = users.find(u => u.role === "admin");
    return {
      items: items.map(i => ({ name: i.name, _id: i._id })),
      leagues: leagues.map(l => ({ name: l.name, internalId: l.internalId, _id: l._id })),
      adminId: admin?._id ?? null,
    };
  `);

  if (!meta.adminId) {
    throw new Error("No admin user found to attribute historic ticks");
  }

  const nameToId = new Map(meta.items.map((i) => [i.name, i._id]));
  console.log(`Loaded ${nameToId.size} items1 names; admin=${meta.adminId}`);

  const leagueDirs = fs
    .readdirSync(DATA_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  const totals = {
    imported: 0,
    skipped: 0,
    skippedExisting: 0,
    rows: 0,
    byFile: [],
  };

  for (const leagueName of leagueDirs) {
    const league =
      meta.leagues.find(
        (l) =>
          l.name.toLowerCase() === leagueName.toLowerCase() ||
          l.internalId.toLowerCase() === leagueName.toLowerCase(),
      ) ?? null;
    if (league === null) {
      console.warn(
        `Skipping folder "${leagueName}" — no matching poe1 gameLeague (create it in admin first)`,
      );
      continue;
    }

    const dir = path.join(DATA_ROOT, leagueName);
    const files = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith(".csv"));
    const ctx = { userId: meta.adminId, leagueId: league._id };

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = {
        imported: 0,
        skipped: 0,
        skippedExisting: 0,
        rows: 0,
      };
      console.log(`\nImporting ${leagueName}/${file} → league ${league.name} (${league._id})`);
      const lower = file.toLowerCase();
      if (lower.includes("currency")) {
        await importCurrencyCsv(filePath, nameToId, ctx, stats);
      } else if (lower.includes("items")) {
        await importItemsCsv(filePath, nameToId, ctx, stats);
      } else {
        console.warn(`  Unknown CSV shape, skipped: ${file}`);
        continue;
      }
      console.log(
        `  done rows=${stats.rows} imported=${stats.imported} skippedMissingOrInvalid=${stats.skipped} skippedExisting=${stats.skippedExisting}`,
      );
      totals.imported += stats.imported;
      totals.skipped += stats.skipped;
      totals.skippedExisting += stats.skippedExisting;
      totals.rows += stats.rows;
      totals.byFile.push({ file: `${leagueName}/${file}`, ...stats });
    }
  }

  console.log("\n=== summary ===");
  console.log(JSON.stringify(totals, null, 2));
  fs.writeFileSync(
    path.join(process.env.TEMP || "/tmp", "ntrader-past-league-import-summary.json"),
    JSON.stringify({ target, ...totals }, null, 2),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
