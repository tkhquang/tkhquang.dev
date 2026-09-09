import assert from "node:assert/strict";
import test from "node:test";

import { renderPostMarkdown } from "./index.ts";

const author = { alias: "Aleks", handle: "tkhquang", name: "Quang Trinh Khac" };

const render = (content, post = {}) =>
  renderPostMarkdown(
    {
      category_slug: "technical",
      category_title: "Technical",
      content,
      created_at: "2026-03-01T00:00:00.000Z",
      description: "One sentence of lede.",
      slug: "a-post",
      tags: ["Fonts"],
      title: "A Post",
      updated_at: "",
      ...post,
    },
    { author, baseUrl: "https://example.test" }
  );

/* Frontmatter, header, article, each pair parted by a rule. The article can
   hold rules of its own, so only the first two splits count. */
const partsOf = (rendered) => {
  const [frontmatter, header, ...body] = rendered.split("\n---\n\n");
  return { frontmatter, header, body: body.join("\n---\n\n").trimEnd() };
};

const bodyOf = (content, post) => partsOf(render(content, post)).body;

test("the header carries the identity, the date and the canonical address", () => {
  const { frontmatter, header } = partsOf(render("Body."));

  assert.ok(
    frontmatter.includes("author: Aleks (Quang Trinh Khac, online as tkhquang)")
  );
  assert.ok(frontmatter.includes("published: 2026-03-01"));
  assert.ok(
    frontmatter.includes("canonical: https://example.test/blog/posts/a-post")
  );
  assert.ok(header.startsWith("# A Post\n"));
  assert.ok(header.includes("<https://example.test/llms.txt>"));
});

test("an update date is printed when there is one and dropped when there is not", () => {
  assert.ok(!partsOf(render("Body.")).frontmatter.includes("updated:"));
  assert.ok(
    partsOf(
      render("Body.", { updated_at: "2026-08-20T00:00:00.000Z" })
    ).frontmatter.includes("updated: 2026-08-20")
  );
});

test("the cover reaches the frontmatter and stays out of the article", () => {
  const { frontmatter, body } = partsOf(
    render("The first paragraph.", { cover_image: "/uploads/images/c.webp" })
  );

  assert.ok(
    frontmatter.includes("cover: https://example.test/uploads/images/c.webp")
  );
  assert.equal(body, "The first paragraph.");
});

test("a serial says which instalment it is and how many there are", () => {
  const { frontmatter } = partsOf(
    render("Body.", { series: "The devlog", series_part: 2, series_total: 3 })
  );

  assert.ok(frontmatter.includes("series: The devlog"));
  assert.ok(frontmatter.includes("series_part: 2"));
  assert.ok(frontmatter.includes("series_total: 3"));
});

test("a mermaid plate becomes a fence, opening on the diagram's own config", () => {
  const body = bodyOf(
    [
      '<pre class="mermaid flex justify-center">',
      "---",
      "config:",
      "  flowchart:",
      "    nodeSpacing: 30",
      "---",
      "graph TD",
      '    A["One<br/>Two"] --> B;',
      "</pre>",
    ].join("\n")
  );

  /* Mermaid only reads its config block when the block starts at the first
     character, so the newline after the opening tag has to go */
  assert.equal(
    body,
    [
      "```mermaid",
      "---",
      "config:",
      "  flowchart:",
      "    nodeSpacing: 30",
      "---",
      "graph TD",
      '    A["One<br/>Two"] --> B;',
      "```",
    ].join("\n")
  );
});

test("a diagram loses the icon tokens the page never draws", () => {
  const body = bodyOf(
    [
      '<pre class="mermaid">',
      'graph TD; A["fa:fa-camera Lens"];',
      "</pre>",
    ].join("\n")
  );

  assert.equal(body, '```mermaid\ngraph TD; A["Lens"];\n```');
});

test("a diagram that quotes a fence gets a longer one", () => {
  const body = bodyOf(
    ['<pre class="mermaid">', 'graph TD; A["```"];', "</pre>"].join("\n")
  );

  assert.ok(body.startsWith("````mermaid\n"));
  assert.ok(body.endsWith("\n````"));
});

test("a camera plate becomes a note saying where it runs", () => {
  /* The note describes the plate rather than naming the lesson attribute,
     whose ids are not the labels the widget shows */
  const body = bodyOf(
    '<camera-explorable lesson="collision">\n</camera-explorable>'
  );

  assert.ok(body.startsWith("> An interactive figure stands here: a camera"));
  assert.ok(body.endsWith("<https://example.test/blog/posts/a-post>"));
});

test("a hex diff keeps its fence whole and gains an introduction", () => {
  const fence = ["```hex-diff", "id: a-diff", "title: One byte.", "```"].join(
    "\n"
  );
  const body = bodyOf(fence);

  assert.ok(body.startsWith("> An annotated byte diff stands here."));
  assert.ok(body.endsWith(`\n\n${fence}`));
});

test("a style block leaves nothing behind, on either line terminator", () => {
  assert.equal(
    bodyOf("Before.\n\n<style>\n  .a { color: red; }\n</style>\n\nAfter."),
    "Before.\n\nAfter."
  );
  assert.equal(
    bodyOf(
      "Before.\r\n\r\n<style>\r\n  .a { color: red; }\r\n</style>\r\n\r\nAfter."
    ),
    "Before.\r\n\r\nAfter."
  );
});

test("a plate nested in a container is left as the author wrote it", () => {
  /* The replacement runs to several lines, and only its first would sit
     inside the list item */
  const nested = [
    "- The rig:",
    "",
    '  <pre class="mermaid">',
    "  graph TD; A --> B;",
    "  </pre>",
  ].join("\n");

  assert.equal(bodyOf(nested), nested);
});

test("a nested address is rehomed without losing its container's prefix", () => {
  /* Rebuilt from node.value, the continuation lines would lose their marker
     and end the quote in the middle of the element */
  assert.equal(
    bodyOf(
      [
        "> Some pull quote.",
        ">",
        '> <cite><a href="/blog/posts/b"',
        '>   rel="noopener">The other post</a></cite>',
      ].join("\n")
    ),
    [
      "> Some pull quote.",
      ">",
      '> <cite><a href="https://example.test/blog/posts/b"',
      '>   rel="noopener">The other post</a></cite>',
    ].join("\n")
  );

  assert.equal(
    bodyOf(
      [
        "- A point:",
        "",
        "  <div>",
        '    <a href="/blog/posts/b">b</a>',
        "  </div>",
      ].join("\n")
    ),
    [
      "- A point:",
      "",
      "  <div>",
      '    <a href="https://example.test/blog/posts/b">b</a>',
      "  </div>",
    ].join("\n")
  );
});

test("a nested style block is left alone rather than taking its container's end with it", () => {
  /* The drop takes the separator behind the block, which inside a list is
     what closes the item */
  const nested = [
    "- A point:",
    "",
    "  <style>",
    "  .a { color: red; }",
    "  </style>",
    "",
    "- Another point.",
  ].join("\n");

  assert.equal(bodyOf(nested), nested);
});

test("an opening plate tag with no close is not mistaken for a whole one", () => {
  /* A blank line inside the element ends the raw HTML node, so answering the
     opening tag would strand the closing one further down the file */
  const split = [
    '<camera-explorable lesson="rig">',
    "",
    "A caption between the tags.",
    "",
    "</camera-explorable>",
  ].join("\n");

  assert.equal(bodyOf(split), split);
});

test("a caption or a target that needs escaping keeps it", () => {
  assert.equal(
    bodyOf("![One page, two ways to say [Q]](/uploads/images/a.svg)"),
    "![One page, two ways to say \\[Q\\]](https://example.test/uploads/images/a.svg)"
  );
  assert.equal(
    bodyOf("![A shot](</uploads/images/a shot.png>)"),
    "![A shot](<https://example.test/uploads/images/a shot.png>)"
  );
});

test("links and images leave the file with the site in front of them", () => {
  assert.equal(
    bodyOf("![A caption](/uploads/images/blog/a.svg)"),
    "![A caption](https://example.test/uploads/images/blog/a.svg)"
  );
  assert.equal(
    bodyOf("Read [the **other** post](/blog/posts/b) first."),
    "Read [the **other** post](https://example.test/blog/posts/b) first."
  );
  assert.equal(
    bodyOf(
      'Related: <a href="/blog/posts/b" target="_blank">The other post</a>'
    ),
    'Related: <a href="https://example.test/blog/posts/b" target="_blank">The other post</a>'
  );
});

test("a figure used as a link has both of its addresses moved", () => {
  /* The two rewrites nest: replacing the whole link would splice at offsets
     the image rewrite had already shifted */
  assert.equal(
    bodyOf("[![A caption](/uploads/images/a.png)](/blog/posts/b)"),
    "[![A caption](https://example.test/uploads/images/a.png)](https://example.test/blog/posts/b)"
  );
});

test("a self-closing plate is given the same note as a paired one", () => {
  assert.equal(
    bodyOf('<camera-explorable lesson="lens" />'),
    bodyOf('<camera-explorable lesson="lens">\n</camera-explorable>')
  );
});

test("an address that is already absolute is left alone", () => {
  const source =
    'See [the spec](https://example.com/a) and <a href="//cdn.example.com/b">a mirror</a>.';

  assert.equal(bodyOf(source), source);
});

test("a construct quoted inside a code fence is not rewritten", () => {
  /* Found on the syntax tree rather than in the raw text, which is what keeps
     a post explaining the site's own markup intact */
  const source = [
    "How a diagram is written:",
    "",
    "````markdown",
    '<pre class="mermaid flex justify-center">',
    "graph TD; A --> B;",
    "</pre>",
    "",
    "![local](/uploads/images/a.png)",
    "````",
  ].join("\n");

  assert.equal(bodyOf(source), source);
});

test("prose, tables and footnotes come across as they were typed", () => {
  const source = [
    "A paragraph with `code`, **bold** and a [link](https://example.com).",
    "",
    "| the face | /Type3 |",
    "| --- | --- |",
    "| variable woff2 | 2 |",
    "",
    "A claim that needs a note.[^one]",
    "",
    "[^one]: The note itself.",
  ].join("\n");

  assert.equal(bodyOf(source), source);
});
