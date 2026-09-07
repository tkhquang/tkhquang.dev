import assert from "node:assert/strict";
import test from "node:test";

import { countSections, findSection, listSections } from "./sections.ts";

const post = `
Opening words.

## The two-binary split

Body.

### Inside \`DllMain\`

More.

## The two-binary split

Repeated on purpose.

## Knowing what the game is doing
`;

test("headings slug the way rehype-slug slugs them, duplicates numbered", () => {
  assert.deepEqual(listSections(post), [
    { id: "the-two-binary-split", title: "The two-binary split" },
    { id: "inside-dllmain", title: "Inside DllMain" },
    { id: "the-two-binary-split-1", title: "The two-binary split" },
    {
      id: "knowing-what-the-game-is-doing",
      title: "Knowing what the game is doing",
    },
  ]);
});

test("sections are counted at the shallowest depth, none without headings", () => {
  assert.equal(countSections(post), 3);
  assert.equal(countSections("Only an opening.\n\nAnd a second paragraph."), 0);
  assert.equal(countSections("### Deep\n\n#### Deeper\n\n### Deep again"), 2);
});

test("a section link finds its heading, or nothing", () => {
  assert.deepEqual(findSection(post, "the-two-binary-split-1"), {
    id: "the-two-binary-split-1",
    title: "The two-binary split",
  });
  assert.equal(findSection(post, "no-such-section"), null);
});
