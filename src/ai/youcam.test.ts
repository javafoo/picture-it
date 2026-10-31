import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { garmentCategory, plainTryOnError, readTryOnStatus, tryOnBody } from "./youcam";

describe("youcam try-on", () => {
  it("builds the task body, swapping shoes only for shoes", () => {
    assert.deepEqual(tryOnBody({ personFileId: "p", garmentFileId: "g", category: "full_body" }), {
      src_file_id: "p", ref_file_id: "g", garment_category: "full_body", change_shoes: false, filter_multi_person: "off",
    });
    assert.equal(tryOnBody({ personFileId: "p", garmentFileId: "g", category: "shoes" }).change_shoes, true);
  });

  it("reads the three states, as the live API answered them", () => {
    assert.deepEqual(readTryOnStatus({ status: 200, data: { task_status: "running" } }), { state: "pending", status: "running" });
    assert.deepEqual(readTryOnStatus({ status: 200, data: { error: null, results: { url: "https://x/y.jpg" }, task_status: "success" } }), { state: "completed", url: "https://x/y.jpg" });
    assert.deepEqual(readTryOnStatus({ status: 200, data: { error: "error_pose", task_status: "error" } }), { state: "failed", code: "error_pose" });
  });

  it("treats a success without a usable link as a failure", () => {
    assert.deepEqual(readTryOnStatus({ data: { task_status: "success", results: {} } }), { state: "failed", code: "no_result" });
    assert.deepEqual(readTryOnStatus({ data: { task_status: "success", results: { url: "http://plain" } } }), { state: "failed", code: "no_result" });
  });

  it("says a known error plainly and anything else generally", () => {
    assert.match(plainTryOnError("error_pose"), /facing the camera/);
    assert.match(plainTryOnError("something_new"), /could not finish/);
  });

  it("only accepts the documented categories", () => {
    assert.equal(garmentCategory("outer"), "outer");
    assert.equal(garmentCategory("hat"), "auto");
    assert.equal(garmentCategory(undefined), "auto");
  });
});
