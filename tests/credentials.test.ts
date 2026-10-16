import { describe, expect, it } from "vitest";
import {
  hashPassword,
  loginSchema,
  normalizeEmail,
  registerSchema,
  verifyPassword,
} from "@/lib/credentials";

describe("normalizeEmail", () => {
  it.each([
    ["User@Example.COM ", "user@example.com"],
    ["  A@b.co  ", "a@b.co"],
  ])("maps %o to %o", (input, expected) => {
    expect(normalizeEmail(input)).toBe(expected);
  });
});

describe("registerSchema", () => {
  it("accepts valid input", () => {
    const parsed = registerSchema.safeParse({
      name: "Roby",
      email: "Roby@Example.com",
      password: "s3cret-pass",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.email).toBe("roby@example.com");
  });

  it.each([
    [{ email: "a@b.co", password: "short" }],
    [{ email: "not-an-email", password: "long-enough-password" }],
    [{ email: "", password: "long-enough-password" }],
    [{ email: "a@b.co", password: "" }],
  ])("rejects %o", (input) => {
    expect(registerSchema.safeParse(input).success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts valid input and lowercases email", () => {
    const parsed = loginSchema.safeParse({ email: "A@B.co", password: "x" });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.email).toBe("a@b.co");
  });

  it("rejects bad email", () => {
    expect(loginSchema.safeParse({ email: "nope", password: "x" }).success).toBe(false);
  });
});

describe("password hashing", () => {
  it("hashes and verifies, rejects wrong password", async () => {
    const hashed = await hashPassword("s3cret-pass");
    expect(hashed).not.toBe("s3cret-pass");
    expect(await verifyPassword("s3cret-pass", hashed)).toBe(true);
    expect(await verifyPassword("wrong-pass", hashed)).toBe(false);
  });

  it("rejects empty inputs without throwing", async () => {
    expect(await verifyPassword("", "whatever")).toBe(false);
    expect(await verifyPassword("x", "")).toBe(false);
  });
});
