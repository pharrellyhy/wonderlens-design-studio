import type { RunRecord } from "@/lib/runs-repository";

// ---------------------------------------------------------------------------
// Pair grouping
// ---------------------------------------------------------------------------
//
// Both library tabs (table + grid) need to render opposite siblings adjacent
// to their parent. The runs-repository returns a flat list sorted by
// timestamp; this helper restructures that list into parent/child groups.
//
// Algorithm:
//   1. Build a Set of every designId in the input — used to detect orphans.
//   2. Walk the input. Non-opposite runs become groups. Opposite runs whose
//      `parentRunId` (= parent designId, see runs-repository.ts comment) is
//      present in the input attach to that parent. Opposites whose parent is
//      missing are flagged as orphans and rendered in their natural slot.
//   3. The output preserves the input order for parents and orphans, with
//      each parent's children appended immediately after the parent group.
//
// The function is pure — sorting happens upstream by the caller. If the
// caller re-sorts groups by score, parents and children stay attached
// because the unit of sorting is the group, not the individual run.

export interface RunGroup {
  parent: RunRecord;
  /** Empty for non-parents; contains opposites attached to this parent. */
  children: RunRecord[];
  /**
   * True iff this group represents an opposite whose parent is not in the
   * input list (so it is rendered standalone with an "orphan" marker).
   */
  isOrphanedOpposite: boolean;
}

export function groupRunsWithOpposites(runs: readonly RunRecord[]): RunGroup[] {
  const designIdsInList = new Set<string>();
  for (const run of runs) {
    designIdsInList.add(run.designId);
  }

  // First pass: bucket children by their parent designId.
  const childrenByParent = new Map<string, RunRecord[]>();
  for (const run of runs) {
    if (run.isOpposite && run.parentRunId && designIdsInList.has(run.parentRunId)) {
      const bucket = childrenByParent.get(run.parentRunId);
      if (bucket) {
        bucket.push(run);
      } else {
        childrenByParent.set(run.parentRunId, [run]);
      }
    }
  }

  // Second pass: walk in input order, emitting parents (with attached
  // children) and orphaned opposites in their natural position. Skip any
  // opposite that has already been attached to a parent.
  const attachedChildIds = new Set<string>();
  for (const bucket of childrenByParent.values()) {
    for (const child of bucket) {
      attachedChildIds.add(child.runId);
    }
  }

  const groups: RunGroup[] = [];
  for (const run of runs) {
    if (run.isOpposite) {
      if (attachedChildIds.has(run.runId)) {
        continue; // already emitted under its parent
      }
      // Orphan: parent not in this list (deleted, filtered, etc.)
      groups.push({ parent: run, children: [], isOrphanedOpposite: true });
      continue;
    }
    const children = childrenByParent.get(run.designId) ?? [];
    groups.push({ parent: run, children, isOrphanedOpposite: false });
  }

  return groups;
}

// ---------------------------------------------------------------------------
// Flatten a grouped list back into a row-by-row sequence the table can render
// ---------------------------------------------------------------------------

export interface FlatRow {
  run: RunRecord;
  /** True for child rows (rendered indented under their parent). */
  isChild: boolean;
  /** True for orphaned opposites with no parent in the current list. */
  isOrphan: boolean;
}

export function flattenGroups(groups: readonly RunGroup[]): FlatRow[] {
  const rows: FlatRow[] = [];
  for (const group of groups) {
    rows.push({
      run: group.parent,
      isChild: false,
      isOrphan: group.isOrphanedOpposite,
    });
    for (const child of group.children) {
      rows.push({ run: child, isChild: true, isOrphan: false });
    }
  }
  return rows;
}
