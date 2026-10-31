import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { thinkingFor } from "./text";

describe("thinkingFor", () => {
  it("thinks less only on the fast tier", () => {
    assert.equal(thinkingFor({ tier: "fast" }), "low");
    assert.equal(thinkingFor({ tier: "standard", thinking: "low" }), "default");
    assert.equal(thinkingFor({ tier: "deep" }), "default");
  });
  it("falls back to the caller's thinking", () => {
    assert.equal(thinkingFor({ thinking: "low" }), "low");
    assert.equal(thinkingFor({}), "default");
  });
});
