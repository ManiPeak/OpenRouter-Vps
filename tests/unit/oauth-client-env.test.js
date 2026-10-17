import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import fs from "node:fs";

const TEST_ENV = {
  ANTIGRAVITY_OAUTH_CLIENT_ID: "test-antigravity-client-id",
  ANTIGRAVITY_OAUTH_CLIENT_SECRET: "test-antigravity-client-secret",
  GOOGLE_OAUTH_CLIENT_ID: "test-google-client-id",
  GOOGLE_OAUTH_CLIENT_SECRET: "test-google-client-secret",
};

beforeAll(() => {
  Object.assign(process.env, TEST_ENV);
  vi.resetModules();
});

afterAll(() => {
  for (const name of Object.keys(TEST_ENV)) delete process.env[name];
  vi.resetModules();
});

describe("deployment-owned Google OAuth clients", () => {
  it("loads Antigravity credentials from the environment", async () => {
    const { ANTIGRAVITY_OAUTH_CLIENT } = await import("../../open-sse/providers/shared.js");
    expect(ANTIGRAVITY_OAUTH_CLIENT).toEqual({
      clientId: TEST_ENV.ANTIGRAVITY_OAUTH_CLIENT_ID,
      clientSecret: TEST_ENV.ANTIGRAVITY_OAUTH_CLIENT_SECRET,
    });
  });

  it("loads shared Gemini credentials from the environment", async () => {
    const { GOOGLE_OAUTH_CLIENT } = await import("../../open-sse/providers/shared.js");
    expect(GOOGLE_OAUTH_CLIENT).toEqual({
      clientId: TEST_ENV.GOOGLE_OAUTH_CLIENT_ID,
      clientSecret: TEST_ENV.GOOGLE_OAUTH_CLIENT_SECRET,
    });
  });

  it("threads the shared clients into provider transports", async () => {
    const antigravity = (await import("../../open-sse/providers/registry/antigravity.js")).default;
    const gemini = (await import("../../open-sse/providers/registry/gemini.js")).default;
    const geminiCli = (await import("../../open-sse/providers/registry/gemini-cli.js")).default;

    expect(antigravity.transport.clientId).toBe(TEST_ENV.ANTIGRAVITY_OAUTH_CLIENT_ID);
    expect(antigravity.transport.clientSecret).toBe(TEST_ENV.ANTIGRAVITY_OAUTH_CLIENT_SECRET);
    expect(gemini.transport.clientId).toBe(TEST_ENV.GOOGLE_OAUTH_CLIENT_ID);
    expect(geminiCli.transport.clientSecret).toBe(TEST_ENV.GOOGLE_OAUTH_CLIENT_SECRET);
  });

  it("fails clearly when a required deployment-owned client is absent", async () => {
    for (const name of Object.keys(TEST_ENV)) delete process.env[name];
    vi.resetModules();

    try {
      const { generateAuthData } = await import("../../src/lib/oauth/providers/index.js");
      await expect(generateAuthData("antigravity", "http://localhost/callback")).rejects.toThrow(
        "ANTIGRAVITY_OAUTH_CLIENT_ID"
      );
      await expect(generateAuthData("gemini-cli", "http://localhost/callback")).rejects.toThrow(
        "GOOGLE_OAUTH_CLIENT_ID"
      );
    } finally {
      Object.assign(process.env, TEST_ENV);
      vi.resetModules();
    }
  });

  it("contains no embedded Google OAuth secret pattern", () => {
    for (const file of [
      "open-sse/providers/shared.js",
      "open-sse/providers/registry/antigravity.js",
      "open-sse/providers/registry/gemini.js",
      "open-sse/providers/registry/gemini-cli.js",
    ]) {
      expect(fs.readFileSync(file, "utf8")).not.toMatch(/GOCSPX-[A-Za-z0-9_-]+/);
    }
  });
});
