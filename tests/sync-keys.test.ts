import { describe, expect, it } from "vitest";
import { generateSyncKey, isSyncKey, slugifyTitle } from "@/lib/sync-keys";

describe("generateSyncKey", () => {
  it("produces pk_ + 32 hex chars and passes validation", () => {
    const key = generateSyncKey();
    expect(key).toMatch(/^pk_[0-9a-f]{32}$/);
    expect(isSyncKey(key)).toBe(true);
  });

  it("generates unique keys", () => {
    expect(generateSyncKey()).not.toBe(generateSyncKey());
  });
});

describe("isSyncKey", () => {
  it.each([
    ["pk_" + "a".repeat(32), true],
    ["pk_5925f19d4946b581cdfaecff679f742a", true],
    ["pk_123", false],
    ["pk_" + "G".repeat(32), false],
    ["", false],
    ["  pk_" + "b".repeat(32) + "  ", true],
  ])("maps %o to %o", (input, expected) => {
    expect(isSyncKey(input)).toBe(expected);
  });
});

describe("slugifyTitle", () => {
  it.each([
    ["Kominfo Super Aman", "kominfo-super-aman"],
    ["  Pekanbaru AMAN & API  ", "pekanbaru-aman-api"],
    ["Kafé Über", "kafe-uber"],
    ["a/b\\c", "a-b-c"],
    ["", ""],
  ])("maps %o to %o", (input, expected) => {
    expect(slugifyTitle(input)).toBe(expected);
  });
});
