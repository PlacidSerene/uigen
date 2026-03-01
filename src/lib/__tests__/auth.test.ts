// @vitest-environment node
import { describe, test, expect, vi, beforeEach } from "vitest";
import { jwtVerify } from "jose";

// vi.hoisted ensures these are available inside the hoisted vi.mock() factory
const { mockSet, mockGet, mockDelete } = vi.hoisted(() => ({
  mockSet: vi.fn(),
  mockGet: vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    set: mockSet,
    get: mockGet,
    delete: mockDelete,
  })),
}));

import { createSession } from "@/lib/auth";

// Matches the fallback secret used when JWT_SECRET env var is not set
const TEST_SECRET = new TextEncoder().encode("development-secret-key");

describe("createSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("sets a cookie named auth-token", async () => {
    await createSession("user-123", "test@example.com");

    expect(mockSet).toHaveBeenCalledOnce();
    const [name] = mockSet.mock.calls[0];
    expect(name).toBe("auth-token");
  });

  test("token is a valid signed JWT", async () => {
    await createSession("user-123", "test@example.com");

    const [, token] = mockSet.mock.calls[0];
    // jwtVerify throws if the token is invalid or the signature doesn't match
    await expect(jwtVerify(token, TEST_SECRET)).resolves.toBeDefined();
  });

  test("JWT payload contains the correct userId and email", async () => {
    await createSession("user-123", "test@example.com");

    const [, token] = mockSet.mock.calls[0];
    const { payload } = await jwtVerify(token, TEST_SECRET);

    expect(payload.userId).toBe("user-123");
    expect(payload.email).toBe("test@example.com");
  });

  test("JWT expires in 7 days", async () => {
    const before = Math.floor(Date.now() / 1000);
    await createSession("user-123", "test@example.com");
    const after = Math.floor(Date.now() / 1000);

    const [, token] = mockSet.mock.calls[0];
    const { payload } = await jwtVerify(token, TEST_SECRET);

    const sevenDays = 7 * 24 * 60 * 60;
    expect(payload.exp).toBeGreaterThanOrEqual(before + sevenDays);
    // Allow 1s tolerance for test execution time
    expect(payload.exp).toBeLessThanOrEqual(after + sevenDays + 1);
  });

  test("JWT uses HS256 algorithm", async () => {
    await createSession("user-123", "test@example.com");

    const [, token] = mockSet.mock.calls[0];
    const { protectedHeader } = await jwtVerify(token, TEST_SECRET);

    expect(protectedHeader.alg).toBe("HS256");
  });

  test("cookie is httpOnly", async () => {
    await createSession("user-123", "test@example.com");

    const [, , options] = mockSet.mock.calls[0];
    expect(options.httpOnly).toBe(true);
  });

  test("cookie sameSite is lax", async () => {
    await createSession("user-123", "test@example.com");

    const [, , options] = mockSet.mock.calls[0];
    expect(options.sameSite).toBe("lax");
  });

  test("cookie path is /", async () => {
    await createSession("user-123", "test@example.com");

    const [, , options] = mockSet.mock.calls[0];
    expect(options.path).toBe("/");
  });

  test("cookie is not secure outside of production", async () => {
    await createSession("user-123", "test@example.com");

    const [, , options] = mockSet.mock.calls[0];
    expect(options.secure).toBe(false);
  });

  test("cookie is secure in production", async () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    try {
      await createSession("user-123", "test@example.com");
      const [, , options] = mockSet.mock.calls[0];
      expect(options.secure).toBe(true);
    } finally {
      process.env.NODE_ENV = original;
    }
  });

  test("cookie expiry matches the JWT expiry", async () => {
    await createSession("user-123", "test@example.com");

    const [, token, options] = mockSet.mock.calls[0];
    const { payload } = await jwtVerify(token, TEST_SECRET);

    const jwtExpMs = (payload.exp as number) * 1000;
    const cookieExpMs = (options.expires as Date).getTime();
    // Allow 2s tolerance — both are derived from Date.now() at nearly the same instant
    expect(Math.abs(jwtExpMs - cookieExpMs)).toBeLessThan(2000);
  });

  test("encodes arbitrary userId and email values", async () => {
    await createSession("abc-xyz-789", "another@example.org");

    const [, token] = mockSet.mock.calls[0];
    const { payload } = await jwtVerify(token, TEST_SECRET);

    expect(payload.userId).toBe("abc-xyz-789");
    expect(payload.email).toBe("another@example.org");
  });
});
