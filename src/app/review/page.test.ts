import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const pageSource = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

test("review import intro aligns with the importer card width", () => {
  assert.match(
    pageSource,
    /className="mx-auto mb-8 flex max-w-2xl flex-wrap items-start justify-between gap-4"/,
  );
});
