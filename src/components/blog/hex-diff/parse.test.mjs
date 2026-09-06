import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import remarkParse from "remark-parse";
import ts from "typescript";
import { unified } from "unified";
import { parseDocument, stringify } from "yaml";

import * as preparation from "./prepare.ts";

// Node needs the bundler's extensionless preparation import resolved explicitly.
const { outputText } = ts.transpileModule(
  readFileSync(new URL("./parse.ts", import.meta.url), "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }
);
const require = createRequire(import.meta.url);
const parser = { exports: {} };
new Function("require", "module", "exports", outputText)(
  (specifier) => (specifier === "./prepare" ? preparation : require(specifier)),
  parser,
  parser.exports
);
const { parseHexDiff } = parser.exports;

function authoredSource(relativePath) {
  const markdown = readFileSync(new URL(relativePath, import.meta.url), "utf8");
  const markdownParser = unified().use(remarkParse);
  const blocks = markdownParser.parse(markdown).children;
  const fence = blocks.find(
    (node) => node.type === "code" && node.lang === "hex-diff"
  );
  assert.ok(fence, `${relativePath} must contain a hex-diff fence.`);
  return fence.value;
}

const source = authoredSource(
  "../../../../content/posts/the-object-already-knows-its-own-name.md"
);

function changedSource(change) {
  const example = parseDocument(source, { schema: "failsafe" }).toJS({
    maxAliasCount: 0,
  });
  change(example);
  return stringify(example);
}

test("the article's self-contained YAML prepares the exact published comparison", () => {
  const prepared = parseHexDiff(source);
  assert.equal(prepared.id, "equip-hide-offset");
  assert.deepEqual(prepared.copy, {
    before: "48 8B 45 5F 0F B6 40 1C 3C 03",
    after: "48 8B 45 5F 0F B6 40 20 3C 03",
  });
  assert.equal(prepared.defaultFieldKey, "visibility-load:field-offset");
  assert.deepEqual(JSON.parse(JSON.stringify(prepared)), prepared);
});

test("unquoted numeric-looking hex and assembly text remain strings", () => {
  const unquoted = source
    .replace(/hex: ["']?(03|20)["']?(?=\s*$)/gm, "hex: $1")
    .replace(/text: ["']3["'](?=\s*$)/gm, "text: 3");
  const prepared = parseHexDiff(unquoted);
  assert.ok(prepared.copy.before.endsWith("3C 03"));
  assert.ok(prepared.copy.after.includes("40 20"));
  const compare = prepared.pairs.find(
    (pair) => pair.id === "visibility-compare"
  );
  assert.equal(
    compare.before.assembly.map((part) => part.text).join(""),
    "cmp al, 3"
  );
});

test("empty fences and non-object roots fail with useful diagnostics", () => {
  for (const empty of [undefined, "", " \n\t"]) {
    assert.throws(
      () => parseHexDiff(empty),
      /Hex diff YAML.*fence must contain an example/
    );
  }
  for (const invalid of ["just text", "[]", "# only a comment", "42"]) {
    assert.throws(
      () => parseHexDiff(invalid),
      /Hex diff example.*expected object/i
    );
  }
});

test("YAML syntax errors, duplicate keys, and multiple documents are rejected", () => {
  for (const invalid of [
    "id: [unfinished",
    `${source}\nid: duplicate`,
    `${source}\n---\nid: second`,
  ]) {
    assert.throws(() => parseHexDiff(invalid), /Hex diff YAML:/);
  }
  assert.throws(
    () => parseHexDiff(`${source}\nid: duplicate`),
    /Map keys must be unique/
  );
});

test("YAML warnings and custom or explicit tags cannot silently change data", () => {
  assert.throws(
    () => parseHexDiff(`%UNKNOWN ignored\n---\n${source}`),
    /Hex diff YAML:/
  );
  for (const tag of ["!custom", "!!str", "!!int", "!<tag:example.com,data>"]) {
    const tagged = source.replace(/^title:.*$/m, `title: ${tag} 20`);
    assert.throws(() => parseHexDiff(tagged), /Hex diff YAML:.*(tag|Tag)/);
  }
});

test("aliases, including recursive references, are rejected before conversion", () => {
  for (const title of ["*missing", "&cycle [*cycle]"]) {
    assert.throws(
      () => parseHexDiff(source.replace(/^title:.*$/m, `title: ${title}`)),
      /Hex diff YAML: aliases are unsupported/
    );
  }
  const shared = source
    .replace(/^id:.*$/m, "id: &shared equip-hide-offset")
    .replace(/^title:.*$/m, "title: *shared");
  assert.throws(() => parseHexDiff(shared), /aliases are unsupported/);
});

test("misspelled properties fail at each authored object boundary", () => {
  for (const change of [
    (example) => {
      example.capiton = "misspelled";
    },
    (example) => {
      example.defaultField.field = "field-offset";
    },
    (example) => {
      example.pairs[1].lable = "misspelled";
    },
    (example) => {
      example.pairs[1].before.raw = "0F B6 40 1C";
    },
    (example) => {
      example.pairs[1].before.fields[0].bytes = "0F B6";
    },
    (example) => {
      example.pairs[1].before.assembly[0].fieldId = "opcode";
    },
  ]) {
    assert.throws(
      () => parseHexDiff(changedSource(change)),
      /Hex diff example "equip-hide-offset".*Unrecognized key/
    );
  }
});

test("wrong field types identify the example, instruction, field, and property", () => {
  const invalid = changedSource((example) => {
    example.pairs[1].before.fields[0].hex = ["0F", "B6"];
  });
  assert.throws(
    () => parseHexDiff(invalid),
    /equip-hide-offset.*pairs\.1.*visibility-load.*fields\.0.*opcode.*hex.*expected string/i
  );
});

test("missing properties, arrays, and objects cannot bypass the authoring schema", () => {
  for (const change of [
    (example) => {
      delete example.title;
    },
    (example) => {
      delete example.defaultField;
    },
    (example) => {
      example.notes = "a single note";
    },
    (example) => {
      example.pairs = {};
    },
    (example) => {
      example.pairs[1].before = "0F B6 40 1C";
    },
    (example) => {
      example.pairs[1].before.fields = {};
    },
    (example) => {
      example.pairs[1].before.fields[0] = null;
    },
    (example) => {
      example.pairs[1].before.assembly = {};
    },
    (example) => {
      example.pairs[1].before.assembly[0].fieldIds = "opcode";
    },
  ]) {
    assert.throws(
      () => parseHexDiff(changedSource(change)),
      /Hex diff example "equip-hide-offset".*(Invalid input|expected)/i
    );
  }
});

test("instruction and context structures cannot silently exchange semantics", () => {
  for (const change of [
    (example) => {
      example.pairs[1].kind = "automatic";
    },
    (example) => {
      example.pairs[1].before.contextLabel = "not decoded";
    },
    (example) => {
      example.pairs[0].before.assembly = [{ text: "mov rax, [rbp+0x5f]" }];
    },
    (example) => {
      delete example.pairs[0].before.contextLabel;
    },
  ]) {
    assert.throws(
      () => parseHexDiff(changedSource(change)),
      /Hex diff example "equip-hide-offset"/
    );
  }
});

test("semantic validation still reports malformed bytes and dangling associations", () => {
  const malformed = changedSource((example) => {
    example.pairs[1].before.fields[0].hex = "??";
  });
  assert.throws(
    () => parseHexDiff(malformed),
    /visibility-load.*before.*opcode.*invalid hex token/
  );
  const dangling = changedSource((example) => {
    example.pairs[1].after.assembly[0].fieldIds = ["missing"];
  });
  assert.throws(
    () => parseHexDiff(dangling),
    /visibility-load.*after.*unknown field association "missing"/
  );
});

test("HTML-looking annotation text remains plain authored data", () => {
  const text = '<img src=x onerror="alert(1)">';
  const prepared = parseHexDiff(
    changedSource((example) => {
      example.caption = text;
      example.pairs[1].before.fields[0].description = text;
    })
  );
  assert.equal(prepared.caption, text);
  assert.equal(prepared.pairs[1].before.fields[0].description, text);
});
