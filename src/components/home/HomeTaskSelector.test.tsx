import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { HOME_TASKS, HomeTaskSelector } from "./HomeTaskSelector";

test("home task selector prioritizes review without showing upload controls", () => {
  const html = renderToStaticMarkup(<HomeTaskSelector />);

  assert.equal(HOME_TASKS[0].title, "Review Existing Activities");
  assert.equal(HOME_TASKS[0].href, "/review");
  assert.match(html, /href="\/review"/);
  assert.match(html, /href="\/generate"/);
  assert.match(html, /href="\/library"/);
  assert.ok(
    html.indexOf("Review Existing Activities") <
      html.indexOf("Generate From Entity Mapping"),
  );
  assert.doesNotMatch(html, /Generation mode/i);
  assert.doesNotMatch(html, /Drop your entity YAML file/i);
  assert.doesNotMatch(html, />\s*or\s*</i);
});
