import assert from "node:assert/strict";
import test from "node:test";

import { getAnnotationFileName } from "./cache.ts";
import { classifyLink } from "./parse.ts";

test("a bare repository link is a repository", () => {
  assert.deepEqual(classifyLink("https://github.com/tkhquang/DetourModKit"), {
    kind: "github-repo",
    url: "https://github.com/tkhquang/DetourModKit",
    owner: "tkhquang",
    repo: "DetourModKit",
  });
});

test("issues, pull requests and their comments", () => {
  assert.equal(
    classifyLink("https://github.com/tkhquang/CrimsonDesertTools/issues/46")
      .kind,
    "github-issue"
  );
  assert.deepEqual(
    classifyLink(
      "https://github.com/tkhquang/CrimsonDesertTools/issues/46#issuecomment-4363919777"
    ),
    {
      kind: "github-comment",
      url: "https://github.com/tkhquang/CrimsonDesertTools/issues/46#issuecomment-4363919777",
      owner: "tkhquang",
      repo: "CrimsonDesertTools",
      number: 46,
      commentId: 4363919777,
    }
  );
  const pull = classifyLink("https://github.com/tkhquang/KCD2Tools/pull/32");
  assert.equal(pull.kind, "github-issue");
  assert.equal(pull.number, 32);
});

test("commits, under a pull request too", () => {
  assert.deepEqual(
    classifyLink(
      "https://github.com/tkhquang/KCD2Tools/commit/20e6394fb378ded7c273e4021306c6635b4996cc"
    ),
    {
      kind: "github-commit",
      url: "https://github.com/tkhquang/KCD2Tools/commit/20e6394fb378ded7c273e4021306c6635b4996cc",
      owner: "tkhquang",
      repo: "KCD2Tools",
      sha: "20e6394fb378ded7c273e4021306c6635b4996cc",
    }
  );
  assert.equal(
    classifyLink(
      "https://github.com/tkhquang/KCD2Tools/pull/32/commits/f284c4ddc4a4fd148d5cde508d0ffecc9fff0038"
    ).sha,
    "f284c4ddc4a4fd148d5cde508d0ffecc9fff0038"
  );
});

test("a file with a line range, a file without, and a directory", () => {
  assert.deepEqual(
    classifyLink(
      "https://github.com/tkhquang/CrimsonDesertTools/blob/7c6d764ab3e81e54bce32a92eae2aac33446a960/CrimsonDesertEquipHide/src/aob_resolver.hpp#L168-L224"
    ),
    {
      kind: "github-blob",
      url: "https://github.com/tkhquang/CrimsonDesertTools/blob/7c6d764ab3e81e54bce32a92eae2aac33446a960/CrimsonDesertEquipHide/src/aob_resolver.hpp#L168-L224",
      owner: "tkhquang",
      repo: "CrimsonDesertTools",
      ref: "7c6d764ab3e81e54bce32a92eae2aac33446a960",
      path: "CrimsonDesertEquipHide/src/aob_resolver.hpp",
      startLine: 168,
      endLine: 224,
    }
  );
  const single = classifyLink("https://github.com/o/r/blob/main/src/a.ts#L10");
  assert.equal(single.startLine, 10);
  assert.equal(single.endLine, 10);
  const whole = classifyLink(
    "https://github.com/tkhquang/DetourModKit/blob/main/docs/guides/rtti/rtti-self-heal.md"
  );
  assert.equal(whole.kind, "github-blob");
  assert.equal(whole.startLine, undefined);
  assert.deepEqual(
    classifyLink("https://github.com/tkhquang/KCD2Tools/tree/main/TPVToggle"),
    {
      kind: "github-tree",
      url: "https://github.com/tkhquang/KCD2Tools/tree/main/TPVToggle",
      owner: "tkhquang",
      repo: "KCD2Tools",
      ref: "main",
      path: "TPVToggle",
    }
  );
});

test("the rest of GitHub reads as a page", () => {
  assert.equal(
    classifyLink("https://github.com/tkhquang/DetourModKit/discussions/34")
      .kind,
    "page"
  );
  assert.equal(classifyLink("https://github.com/FransBouma").kind, "page");
});

test("Wikipedia articles and YouTube videos", () => {
  assert.deepEqual(
    classifyLink(
      "https://en.wikipedia.org/wiki/Spherical_linear_interpolation"
    ),
    {
      kind: "wikipedia",
      url: "https://en.wikipedia.org/wiki/Spherical_linear_interpolation",
      title: "Spherical_linear_interpolation",
    }
  );
  assert.equal(
    classifyLink("https://www.youtube.com/watch?v=NuCQHDoQnVE").id,
    "NuCQHDoQnVE"
  );
  assert.equal(classifyLink("https://youtu.be/NuCQHDoQnVE").id, "NuCQHDoQnVE");
  assert.equal(classifyLink("https://www.youtube.com/@channel").kind, "page");
});

test("anything else public is a page; local, own and non-http links are left alone", () => {
  assert.equal(
    classifyLink("https://www.nexusmods.com/kingdomcomedeliverance2/mods/3263")
      .kind,
    "page"
  );
  assert.equal(classifyLink("http://127.0.0.1:3000/blog"), null);
  assert.equal(classifyLink("http://localhost:3999/x"), null);
  assert.equal(classifyLink("https://tkhquang.dev/blog/posts/x"), null);
  assert.equal(classifyLink("mailto:someone@example.com"), null);
  assert.equal(classifyLink("/blog/posts/x"), null);
  assert.equal(classifyLink("#a-section"), null);
});

test("cache file names are readable, bounded and unique per url", () => {
  const name = getAnnotationFileName(
    "https://github.com/tkhquang/CrimsonDesertTools/issues/46#issuecomment-4363919777"
  );
  assert.match(
    name,
    /^github\.com-tkhquang-CrimsonDesertTools-issues-46-[0-9a-f]{8}\.json$/
  );
  assert.notEqual(
    name,
    getAnnotationFileName(
      "https://github.com/tkhquang/CrimsonDesertTools/issues/46"
    )
  );
  const long = getAnnotationFileName(
    `https://example.com/${"segment/".repeat(30)}`
  );
  assert.ok(long.length <= 80 + 1 + 8 + 5);
});
