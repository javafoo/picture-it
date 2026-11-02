import assert from "node:assert/strict";
import { test } from "node:test";

import { setupComplete, setupSteps } from "./setup";

const nothing = { profileComplete: false, references: 0 };
const everything = { profileComplete: true, keyword: "KIT", references: 3 };

test("a new account has two things to set up, in the order she meets them", () => {
  const steps = setupSteps(nothing);
  assert.deepEqual(
    steps.map((step) => step.href),
    ["/brand", "/avatar"],
  );
  assert.ok(steps.every((step) => !step.done));
  assert.equal(setupComplete(steps), false);
});

test("setup is complete only when every step is done", () => {
  assert.equal(setupComplete(setupSteps(everything)), true);
  assert.equal(setupComplete(setupSteps({ ...everything, references: 0 })), false);
});

test("the status lines use her own numbers", () => {
  const steps = setupSteps(everything);
  assert.equal(steps[0].status, "Keyword KIT");
  assert.equal(steps[1].status, "3 reference photos");
});
