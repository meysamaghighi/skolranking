import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeMessage,
  buildLabel,
  createErrorBudget,
  buildResourceMessage,
  buildRejectionMessage,
  MAX_LABEL_LENGTH,
} from "../app/lib/errorReporter.ts";

test("normalizeMessage strips absolute URLs", () => {
  const out = normalizeMessage("Failed at https://doodlelab.fun/_next/x.js oops");
  assert.equal(out.includes("https://"), false);
  assert.equal(out.includes("oops"), true);
});

test("normalizeMessage strips hashed bundle names but keeps ordinary filenames", () => {
  assert.equal(normalizeMessage("boom in main-a1b2c3d4e5.js"), "boom in");
  assert.equal(normalizeMessage("boom in pop.mp3"), "boom in pop.mp3");
});

test("normalizeMessage strips line:col so one bug is one label", () => {
  const a = normalizeMessage("TypeError: x is not a function:12:44");
  const b = normalizeMessage("TypeError: x is not a function:98:3");
  assert.equal(a, b);
});

test("buildLabel puts path first and stays within the GA4 limit", () => {
  const label = buildLabel("/spiral-draw", "TypeError: " + "y".repeat(300));
  assert.equal(label.startsWith("/spiral-draw|"), true);
  assert.equal(label.length <= MAX_LABEL_LENGTH, true);
});

test("buildLabel truncates a very long path so the message still survives", () => {
  const label = buildLabel("/" + "a".repeat(200), "TypeError: boom");
  assert.equal(label.includes("TypeError: boom"), true);
  assert.equal(label.length <= MAX_LABEL_LENGTH, true);
});

test("buildLabel marks a truncated path with a trailing ellipsis", () => {
  const label = buildLabel("/" + "a".repeat(200), "TypeError: boom");
  const path = label.split("|")[0];
  assert.equal(path.endsWith("…"), true);
});

test("buildLabel does not add an ellipsis to a path that fits", () => {
  const label = buildLabel("/spiral-draw", "TypeError: boom");
  const path = label.split("|")[0];
  assert.equal(path.endsWith("…"), false);
  assert.equal(path, "/spiral-draw");
});

test("budget sends the first occurrence and suppresses duplicates", () => {
  const b = createErrorBudget();
  assert.equal(b.shouldSend("/a|boom"), true);
  assert.equal(b.shouldSend("/a|boom"), false);
});

test("budget allows exactly five distinct labels then stops", () => {
  const b = createErrorBudget();
  for (let i = 0; i < 5; i++) {
    assert.equal(b.shouldSend(`/a|boom${i}`), true, `label ${i} should send`);
  }
  assert.equal(b.shouldSend("/a|boom5"), false);
});

test("buildResourceMessage reduces an absolute URL to its pathname", () => {
  const message = buildResourceMessage(
    "img",
    "https://benchmybrain.com/definitely-missing-asset-xyz.png",
  );
  assert.equal(message, "resource-failed img /definitely-missing-asset-xyz.png");
  assert.equal(
    buildLabel("/", message),
    "/|resource-failed img /definitely-missing-asset-xyz.png",
  );
});

test("buildResourceMessage falls back to the raw string when the URL can't be parsed", () => {
  const message = buildResourceMessage("script", "not-a-valid-url");
  assert.equal(message, "resource-failed script not-a-valid-url");
});

test("buildRejectionMessage uses the message when reason is an Error", () => {
  const message = buildRejectionMessage(new Error("deliberate rejection gamma"));
  assert.equal(message, "deliberate rejection gamma");
  assert.equal(buildLabel("/", message), "/|deliberate rejection gamma");
});

test("buildRejectionMessage stringifies a non-Error reason (string)", () => {
  assert.equal(buildRejectionMessage("deliberate rejection gamma"), "deliberate rejection gamma");
});

test("buildRejectionMessage stringifies a non-Error reason (object)", () => {
  assert.equal(buildRejectionMessage({ code: 42 }), "[object Object]");
});
