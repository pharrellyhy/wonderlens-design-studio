import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { z } from "zod";

import {
  gameDesignSchema,
  generationModeSchema,
  rubricScoresSchema,
} from "@/lib/design-schema";

// ---------------------------------------------------------------------------
// RunRecord schema + type
// ---------------------------------------------------------------------------

export const runRecordSchema = z.object({
  runId: z.string().min(1),
  timestamp: z.string().min(1),
  entity: z.string().min(1),
  entityDisplayName: z.string().min(1),
  category: z.enum(["cat1", "cat5"]),
  gameStyle: z.string().min(1),
  generationMode: generationModeSchema,
  isOpposite: z.boolean(),
  parentRunId: z.string().nullable(),
  rubric: rubricScoresSchema,
  totalScore: z.number().int().min(0).max(9),
  designId: z.string().min(1),
  design: gameDesignSchema,
  durationMs: z.number().int().nonnegative(),
});

export type RunRecord = z.infer<typeof runRecordSchema>;

// ---------------------------------------------------------------------------
// Constants & helpers
// ---------------------------------------------------------------------------

const RUNS_DIR_NAME = path.join("data", "runs");

function runsDir(): string {
  return path.join(process.cwd(), RUNS_DIR_NAME);
}

/**
 * Replace `:` and `.` in an ISO timestamp with `-` so the value is a safe
 * filename component on all filesystems (including Windows). Example:
 *   "2026-04-14T10:30:22.123Z" -> "2026-04-14T10-30-22-123Z"
 */
function sanitizeTimestampForFilename(isoTimestamp: string): string {
  return isoTimestamp.replace(/[:.]/g, "-");
}

/**
 * Lowercase a slug and collapse any non-alphanumeric run into a single dash.
 * Used for deriving a filesystem-safe entity slug.
 */
export function slugifyEntity(raw: string): string {
  const slug = raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug.length > 0 ? slug : "entity";
}

/**
 * Build the 6-char run id used in filenames. Strips dashes from a UUID and
 * returns the first 6 characters.
 */
export function createRunId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 6);
}

function buildFileName(run: RunRecord): string {
  const tsPart = sanitizeTimestampForFilename(run.timestamp);
  const entityPart = slugifyEntity(run.entity);
  return `${tsPart}-${entityPart}-${run.category}-${run.runId}.json`;
}

/**
 * Ensure `data/runs/` exists; safe to call repeatedly.
 */
async function ensureRunsDir(): Promise<void> {
  await fs.mkdir(runsDir(), { recursive: true });
}

function isNodeErrnoException(error: unknown): error is NodeJS.ErrnoException {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
  );
}

// ---------------------------------------------------------------------------
// saveRun
// ---------------------------------------------------------------------------

/**
 * Persist a run record to `data/runs/` atomically.
 *
 * Writes to a `.tmp` sibling first, then `fs.rename()` to the final path.
 * This guarantees readers never observe a half-written JSON file.
 */
export async function saveRun(run: RunRecord): Promise<void> {
  // Defensive: validate the caller-provided record before we touch disk.
  const validated = runRecordSchema.parse(run);

  await ensureRunsDir();

  const fileName = buildFileName(validated);
  const finalPath = path.join(runsDir(), fileName);
  const tmpPath = `${finalPath}.tmp`;

  const serialized = JSON.stringify(validated, null, 2);
  await fs.writeFile(tmpPath, serialized, "utf8");
  await fs.rename(tmpPath, finalPath);

  console.log(`[runs-repository] saved run ${validated.runId}`);
}

// ---------------------------------------------------------------------------
// listRuns
// ---------------------------------------------------------------------------

/**
 * List every valid run record on disk. Skips:
 * - non-JSON files (e.g. `.gitkeep`)
 * - `.tmp` sidecars from in-flight writes
 * - files that fail to parse or validate (logged with console.warn)
 *
 * Results are sorted descending by `timestamp`.
 */
export async function listRuns(): Promise<RunRecord[]> {
  let entries: string[];
  try {
    entries = await fs.readdir(runsDir());
  } catch (error) {
    if (isNodeErrnoException(error) && error.code === "ENOENT") {
      return [];
    }
    throw error;
  }

  const jsonFiles = entries.filter(
    (name) => name.endsWith(".json") && !name.endsWith(".tmp"),
  );

  const records: RunRecord[] = [];
  for (const fileName of jsonFiles) {
    const filePath = path.join(runsDir(), fileName);
    try {
      const raw = await fs.readFile(filePath, "utf8");
      const parsed: unknown = JSON.parse(raw);
      const record = runRecordSchema.parse(parsed);
      records.push(record);
    } catch (error) {
      console.warn(
        "[runs-repository] skipping unreadable run file",
        fileName,
        error,
      );
    }
  }

  records.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
  return records;
}

// ---------------------------------------------------------------------------
// getRun / getRunByDesignId / findOppositeOf
// ---------------------------------------------------------------------------

export async function getRun(runId: string): Promise<RunRecord | null> {
  const all = await listRuns();
  return all.find((r) => r.runId === runId) ?? null;
}

export async function getRunByDesignId(
  designId: string,
): Promise<RunRecord | null> {
  const all = await listRuns();
  return all.find((r) => r.designId === designId) ?? null;
}

export async function findOppositeOf(
  parentRunId: string,
): Promise<RunRecord | null> {
  const all = await listRuns();
  return (
    all.find((r) => r.isOpposite && r.parentRunId === parentRunId) ?? null
  );
}

// ---------------------------------------------------------------------------
// deleteRun
// ---------------------------------------------------------------------------

/**
 * Remove the file for `runId`. Idempotent: missing file is a no-op.
 * Any other filesystem error (permissions, etc.) is re-thrown.
 */
export async function deleteRun(runId: string): Promise<void> {
  // Find the actual filename via listRuns so we don't have to parse suffix
  // conventions in two places.
  const all = await listRuns();
  const target = all.find((r) => r.runId === runId);
  if (!target) {
    return;
  }

  const fileName = buildFileName(target);
  const finalPath = path.join(runsDir(), fileName);
  try {
    await fs.unlink(finalPath);
  } catch (error) {
    if (isNodeErrnoException(error) && error.code === "ENOENT") {
      return;
    }
    throw error;
  }
}
