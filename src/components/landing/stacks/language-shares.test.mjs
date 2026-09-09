import assert from "node:assert/strict";
import test from "node:test";

import { getLanguageShares } from "./language-shares.ts";

const language = (name, size) => ({ id: name, name, size });

const shapeOf = (shares) =>
  shares.map(({ name, size, percentage }) => ({ name, size, percentage }));

test("shares use language bytes and retain the complete total", () => {
  const shares = getLanguageShares([
    language("TypeScript", 250),
    language("C++", 745),
    language("Lua", 3),
    language("CSS", 2),
  ]);
  assert.deepEqual(shapeOf(shares), [
    { name: "C++", size: 745, percentage: 74.5 },
    { name: "TypeScript", size: 250, percentage: 25 },
    { name: "Other", size: 5, percentage: 0.5 },
  ]);
});

test("an excluded language leaves neither the total nor Other behind", () => {
  /* C++ dominates the unfiltered total, while Lua would be merged into
     Other. Both must disappear before the selected denominator is set. */
  const shares = getLanguageShares(
    [
      language("C++", 9900),
      language("TypeScript", 99.5),
      language("CSS", 0.5),
      language("Lua", 1),
    ],
    ["C++", "Lua"]
  );
  assert.deepEqual(shapeOf(shares), [
    { name: "TypeScript", size: 99.5, percentage: 99.5 },
    { name: "Other", size: 0.5, percentage: 0.5 },
  ]);
});

test("a language neither persona names survives in both views", () => {
  const stats = [
    language("C++", 500),
    language("TypeScript", 400),
    language("Shell", 100),
  ];
  assert.deepEqual(
    getLanguageShares(stats, ["C++"]).map(({ name }) => name),
    ["TypeScript", "Shell"]
  );
  assert.deepEqual(
    getLanguageShares(stats, ["TypeScript"]).map(({ name }) => name),
    ["C++", "Shell"]
  );
});

test("a small language can become the whole view once the other side goes", () => {
  assert.deepEqual(
    shapeOf(
      getLanguageShares([language("C++", 999), language("Lua", 1)], ["C++"])
    ),
    [{ name: "Lua", size: 1, percentage: 100 }]
  );
});

test("Other below 0.05% stays in the denominator when its row is hidden", () => {
  const shares = getLanguageShares([
    language("C++", 6000),
    language("TypeScript", 3996),
    language("Lua", 4),
  ]);
  assert.deepEqual(shapeOf(shares), [
    { name: "C++", size: 6000, percentage: 60 },
    { name: "TypeScript", size: 3996, percentage: 39.96 },
  ]);
});

test("Other at exactly 0.05% retains the combined bytes of small languages", () => {
  const shares = getLanguageShares([
    language("C++", 9995),
    language("Lua", 3),
    language("CSS", 2),
  ]);
  assert.deepEqual(shapeOf(shares), [
    { name: "C++", size: 9995, percentage: 99.95 },
    { name: "Other", size: 5, percentage: 0.05 },
  ]);
  assert.equal(shares[1].percentage.toFixed(1), "0.1");
});

test("Other above 0.05% retains the combined bytes of small languages", () => {
  const shares = getLanguageShares([
    language("C++", 9994),
    language("Lua", 3),
    language("CSS", 3),
  ]);
  assert.deepEqual(shapeOf(shares), [
    { name: "C++", size: 9994, percentage: 99.94 },
    { name: "Other", size: 6, percentage: 0.06 },
  ]);
});

test("languages at one percent keep their identity", () => {
  assert.deepEqual(
    getLanguageShares([language("C++", 99), language("C", 1)]).map(
      ({ name }) => name
    ),
    ["C++", "C"]
  );
});

test("empty selections and unavailable byte counts produce no shares", () => {
  assert.deepEqual(getLanguageShares([]), []);
  assert.deepEqual(getLanguageShares([language("C++", 100)], ["C++"]), []);
  assert.deepEqual(
    getLanguageShares([
      language("C++", 0),
      language("CSS", -1),
      language("Lua", NaN),
      language("C", Infinity),
    ]),
    []
  );
});
