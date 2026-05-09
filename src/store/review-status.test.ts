import assert from "node:assert/strict";
import { test } from "node:test";

import { useDesignStore } from "./design-store";

test("review status state is tracked per imported activity", () => {
  useDesignStore.getState().clearImportedBundles();

  useDesignStore
    .getState()
    .setReviewStatus("asset_rescue_leaf", "needs_product_decision");
  assert.equal(
    useDesignStore.getState().reviewStatuses.asset_rescue_leaf,
    "needs_product_decision",
  );

  useDesignStore.getState().setReviewStatus("asset_rescue_leaf", "ready_to_edit");
  assert.equal(
    useDesignStore.getState().reviewStatuses.asset_rescue_leaf,
    "ready_to_edit",
  );

  useDesignStore.getState().clearImportedBundles();
  assert.deepEqual(useDesignStore.getState().reviewStatuses, {});
});
