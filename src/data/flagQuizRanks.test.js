import test from "node:test";
import assert from "node:assert/strict";
import { rankFlagQuizScores } from "./flagQuizRanks.js";

test("flag quiz ranks by correct answers, then percentage, one best run per name", () => {
  const rows = rankFlagQuizScores([
    {
      id: 1,
      name: "ada",
      score: 1,
      total: 1,
      percentage: 100,
      created_at: "2026-10-01T00:00:00Z",
    },
    {
      id: 2,
      name: "ada",
      score: 49,
      total: 50,
      percentage: 98,
      created_at: "2026-10-02T00:00:00Z",
    },
    {
      id: 3,
      name: "Ada",
      score: 40,
      total: 50,
      percentage: 80,
      created_at: "2026-10-03T00:00:00Z",
    },
    {
      id: 4,
      name: "bea",
      score: 49,
      total: 49,
      percentage: 100,
      created_at: "2026-10-04T00:00:00Z",
    },
  ]);

  assert.deepEqual(
    rows.map((row) => row.id),
    [4, 2],
  );
});
