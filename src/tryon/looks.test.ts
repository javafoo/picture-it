import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { modelPhotoIdea, sceneKey, SCENE_KEYS } from "./looks";

describe("looks", () => {
  it("asks for the pose the try-on needs, in the scene", () => {
    const idea = modelPhotoIdea("cafe");
    assert.match(idea, /facing the camera/);
    assert.match(idea, /full length/);
    assert.match(idea, /café/);
    assert.match(idea, /Nobody else/);
  });
  it("accepts only known scenes", () => {
    assert.equal(sceneKey("beach"), "beach");
    assert.equal(sceneKey("moon"), null);
    assert.ok(SCENE_KEYS.length >= 3);
  });
});
