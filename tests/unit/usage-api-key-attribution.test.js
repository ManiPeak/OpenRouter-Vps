import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

let tempDir;
let db;

beforeEach(async () => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "9router-api-key-"));
  process.env.DATA_DIR = tempDir;
  vi.resetModules();
  db = await import("@/lib/db/index.js");
  await db.initDb();
});

afterEach(() => {
  delete process.env.DATA_DIR;
});

describe("Usage stats API key attribution", () => {
  it("keeps colliding display masks separate without serializing raw keys", async () => {
    const apiKeyA = "sk-machine-aaaaaa-11111111";
    const apiKeyB = "sk-machine-bbbbbb-22221111";

    await db.saveRequestUsage({
      provider: "openai",
      model: "gpt-4",
      connectionId: "c1",
      apiKey: apiKeyA,
      tokens: { prompt_tokens: 10, completion_tokens: 5 },
      endpoint: "/v1/chat",
      status: "ok",
    });

    await db.saveRequestUsage({
      provider: "openai",
      model: "gpt-4",
      connectionId: "c1",
      apiKey: apiKeyB,
      tokens: { prompt_tokens: 20, completion_tokens: 10 },
      endpoint: "/v1/chat",
      status: "ok",
    });

    for (const period of ["24h", "all"]) {
      const stats = await db.getUsageStats(period);
      const apiKeyEntries = Object.values(stats.byApiKey);
      const serialized = JSON.stringify(stats);

      expect(apiKeyEntries).toHaveLength(2);
      expect(new Set(apiKeyEntries.map((entry) => entry.apiKeyMasked))).toEqual(
        new Set(["sk-machi***1111"])
      );
      expect(
        apiKeyEntries
          .map((entry) => entry.promptTokens)
          .sort((a, b) => a - b)
      ).toEqual([10, 20]);

      for (const groupKey of Object.keys(stats.byApiKey)) {
        expect(groupKey).toMatch(/^key-[a-f0-9]{64}\|gpt-4\|openai$/);
      }
      expect(serialized).not.toContain(apiKeyA);
      expect(serialized).not.toContain(apiKeyB);
    }
  });
});
