import test from "node:test";
import assert from "node:assert/strict";
import {
  countryRecords,
  addTierPngMetadata,
  decodeTierShare,
  defaultTiers,
  encodeTierShare,
  readTierPngMetadata,
  sanitizeTierState,
  tierStatesEqual,
} from "./tierList.js";

test("share links round-trip titles, colors, and country names", () => {
  const state = {
    title: "Côte d'Ivoire ranks",
    tiers: [
      {
        id: "s",
        label: "S",
        color: "#ff6b6b",
        ids: ["Côte d'Ivoire", "São Tomé and Príncipe"],
      },
      { id: "a", label: "A", color: "#ffa94d", ids: ["Japan"] },
    ],
  };

  const back = decodeTierShare(encodeTierShare(state));
  assert.equal(back.title, state.title);
  assert.equal(back.tiers[0].label, "S");
  assert.equal(back.tiers[0].color, "#ff6b6b");
  assert.deepEqual(back.tiers[0].ids, state.tiers[0].ids);
  assert.deepEqual(back.tiers[1].ids, ["Japan"]);
  assert.equal(tierStatesEqual(state, back), true);
});

test("PNG metadata round-trips the tier list", () => {
  const pngEnd = Uint8Array.from([
    137, 80, 78, 71, 13, 10, 26, 10,
    0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130,
  ]);
  const state = {
    title: "Flags of the world",
    tiers: [
      { id: "top", label: "Top", color: "#ff6b6b", ids: ["Japan", "Côte d'Ivoire"] },
      { id: "later", label: "Later", color: "#74c0fc", ids: [] },
    ],
  };

  const restored = readTierPngMetadata(addTierPngMetadata(pngEnd, state));
  assert.equal(restored.title, state.title);
  assert.deepEqual(
    restored.tiers.map(({ label, color, ids }) => ({ label, color, ids })),
    state.tiers.map(({ label, color, ids }) => ({ label, color, ids })),
  );
});

test("PNG import ignores images without valid tier metadata", () => {
  assert.equal(readTierPngMetadata(new Uint8Array([1, 2, 3])), null);
});

test("bad share links are ignored", () => {
  assert.equal(decodeTierShare(""), null);
  assert.equal(decodeTierShare("%%%"), null);
  assert.equal(decodeTierShare("a".repeat(100001)), null);
});

test("saved lists drop unknown countries and bad colors", () => {
  const clean = sanitizeTierState(
    {
      title: "x".repeat(200),
      tiers: [
        {
          id: "s",
          label: "  love  ",
          color: "red",
          ids: ["Japan", "Japan", "Atlantis"],
        },
      ],
    },
    new Set(["Japan"]),
  );

  assert.equal(clean.title.length, 80);
  assert.equal(clean.tiers[0].label, "love");
  assert.equal(clean.tiers[0].color, defaultTiers()[0].color);
  assert.deepEqual(clean.tiers[0].ids, ["Japan"]);
});

test("country records are current countries, sorted, with stable ids", () => {
  const records = countryRecords([
    { name: "Flag of Zambia", category: "Country", svgUrl: "http://example.com/zm.svg" },
    { name: "Flag of Old Empire", category: "Historical State", svgUrl: "http://example.com/old.svg" },
    { name: "Flag of Albania", category: "Country", svgUrl: "http://example.com/al.svg" },
  ]);

  assert.deepEqual(
    records.map((country) => country.name),
    ["Albania", "Zambia"],
  );
  assert.equal(records[0].id, "Albania");
});
