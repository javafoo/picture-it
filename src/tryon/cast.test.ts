import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { CAST_SHOTS, castDescription, castPrompt, MAX_DESCRIPTION } from "./cast";

describe("casting a model", () => {
  it("makes as many shots as setup needs at least", () => {
    assert.ok(CAST_SHOTS.length >= 5);
  });
  it("uses her words only for the first shot, and keeps the face after that", () => {
    assert.match(castPrompt("late twenties, short red hair", 0), /short red hair/);
    assert.match(castPrompt("late twenties, short red hair", 0), /no real or famous person/);
    assert.doesNotMatch(castPrompt("late twenties, short red hair", 2), /short red hair/);
    assert.match(castPrompt("late twenties, short red hair", 2), /same face/);
  });
  it("refuses a description too short to use and trims a long one", () => {
    assert.equal(castDescription("tall"), null);
    assert.equal(castDescription(42), null);
    assert.equal(castDescription("x".repeat(MAX_DESCRIPTION + 50))?.length, MAX_DESCRIPTION);
    assert.equal(castDescription("  short   red hair, freckles  "), "short red hair, freckles");
  });
});
