import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { MAX_PLACE_CHARS, modelPhotoIdea, sceneKey, SCENE_KEYS, typedPlace } from "./looks";

describe("looks", () => {
  it("asks for the pose the try-on needs, in the scene", () => {
    const idea = modelPhotoIdea({ scene: "cafe" });
    assert.match(idea, /facing the camera/);
    assert.match(idea, /full length/);
    assert.match(idea, /café/);
    assert.match(idea, /Nobody else/);
  });
  it("puts a typed place in the photo and keeps the pose the try-on needs", () => {
    const idea = modelPhotoIdea({ place: "a rooftop in Lisbon at sunset" });
    assert.match(idea, /rooftop in Lisbon/);
    assert.match(idea, /facing the camera/);
    assert.match(idea, /full length/);
  });

  it("tidies a typed place and refuses one too short or too long", () => {
    assert.equal(typedPlace("  a rooftop \n in Lisbon "), "a rooftop in Lisbon");
    assert.equal(typedPlace("ab"), null);
    assert.equal(typedPlace(""), null);
    assert.equal(typedPlace(undefined), null);
    assert.equal(typedPlace("x".repeat(MAX_PLACE_CHARS + 1)), null);
  });

  it("accepts only known scenes", () => {
    assert.equal(sceneKey("beach"), "beach");
    assert.equal(sceneKey("moon"), null);
    assert.ok(SCENE_KEYS.length >= 3);
  });
});
