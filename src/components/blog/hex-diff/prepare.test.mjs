import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { parseDocument } from "yaml";

import { prepareExample } from "./prepare.ts";

const article = readFileSync(
  new URL(
    "../../../../content/posts/the-object-already-knows-its-own-name.md",
    import.meta.url
  ),
  "utf8"
);
const fence = unified()
  .use(remarkParse)
  .parse(article)
  .children.find((node) => node.type === "code" && node.lang === "hex-diff");
assert.ok(fence, "The article must contain its authored hex-diff fence.");
const equipHideOffset = parseDocument(fence.value, { schema: "failsafe" }).toJS(
  { maxAliasCount: 0 }
);

function example() {
  return structuredClone(equipHideOffset);
}

function loadPair(value) {
  return value.pairs.find((pair) => pair.id === "visibility-load");
}

function bytes(value, side) {
  return value.pairs.flatMap((pair) =>
    pair[side].fields.flatMap((field) => field.bytes)
  );
}

test("EquipHide preserves both exact byte strings and changes only stream offset 7", () => {
  const prepared = prepareExample(equipHideOffset);
  assert.deepEqual(prepared.copy, {
    before: "48 8B 45 5F 0F B6 40 1C 3C 03",
    after: "48 8B 45 5F 0F B6 40 20 3C 03",
  });
  for (const side of ["before", "after"]) {
    const stream = bytes(prepared, side);
    assert.equal(stream.length, 10);
    assert.deepEqual(
      stream.map((byte) => byte.offset),
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    );
    assert.deepEqual(
      stream.filter((byte) => byte.changed).map((byte) => byte.offset),
      [7]
    );
  }
});

test("the selected displacement connects corresponding fields and assembly operands", () => {
  const prepared = prepareExample(equipHideOffset);
  const pair = loadPair(prepared);
  assert.equal(prepared.defaultFieldKey, "visibility-load:field-offset");
  for (const side of ["before", "after"]) {
    const field = pair[side].fields.find(
      (entry) => entry.key === prepared.defaultFieldKey
    );
    assert.equal(field.role, "displacement");
    assert.equal(field.bytes[0].offset, 7);
    assert.equal(field.bytes[0].changed, true);
    const operand = pair[side].assembly
      .filter((part) => part.fieldKeys.includes(field.key))
      .map((part) => part.text)
      .join("");
    assert.equal(operand, side === "before" ? "0x1c" : "0x20");
  }
});

test("case and ordinary whitespace normalize without creating differences", () => {
  const authored = example();
  for (const pair of authored.pairs) {
    pair.after = structuredClone(pair.before);
    for (const field of pair.before.fields) {
      field.hex = ` \t${field.hex.toLowerCase().replaceAll(" ", "\r\n  ")} \n`;
    }
  }
  const prepared = prepareExample(authored);
  assert.equal(prepared.copy.before, "48 8B 45 5F 0F B6 40 1C 3C 03");
  assert.equal(prepared.copy.after, prepared.copy.before);
  assert.ok(bytes(prepared, "before").every((byte) => !byte.changed));
  assert.ok(bytes(prepared, "after").every((byte) => !byte.changed));
});

test("multi-byte fields stay grouped while each changed byte is marked separately", () => {
  const authored = example();
  loadPair(authored).after.fields[0].hex = "0E B7";
  const prepared = prepareExample(authored);
  const pair = loadPair(prepared);
  assert.equal(pair.after.fields.length, 3);
  assert.equal(pair.after.fields[0].hex, "0E B7");
  assert.equal(pair.after.fields[0].bytes.length, 2);
  for (const side of ["before", "after"]) {
    assert.deepEqual(
      bytes(prepared, side)
        .filter((byte) => byte.changed)
        .map((byte) => byte.offset),
      [4, 5, 7]
    );
  }
});

test("reused field IDs are qualified by their instruction", () => {
  const prepared = prepareExample(equipHideOffset);
  const loadOpcode = loadPair(prepared).before.fields[0];
  const compareOpcode = prepared.pairs.find(
    (pair) => pair.id === "visibility-compare"
  ).before.fields[0];
  assert.equal(loadOpcode.id, compareOpcode.id);
  assert.notEqual(loadOpcode.key, compareOpcode.key);
});

test("preparation produces serializable data without mutating the authored fixture", () => {
  const authored = example();
  const original = structuredClone(authored);
  const prepared = prepareExample(authored);
  assert.deepEqual(authored, original);
  assert.deepEqual(JSON.parse(JSON.stringify(prepared)), prepared);
  assert.deepEqual(
    new Set(prepared.roles),
    new Set(
      prepared.pairs.flatMap((pair) =>
        pair.before.fields.map((field) => field.role)
      )
    )
  );
  assert.equal(new Set(prepared.roles).size, prepared.roles.length);
  assert.ok(!prepared.roles.includes("prefix"));
  assert.ok(!prepared.roles.includes("sib"));
});

test("malformed hex is rejected with the example, instruction, and field", () => {
  for (const hex of ["0", "0FB6", "0F B", "??", "0x0F", "GG", "0F,B6", "-1"]) {
    const authored = example();
    loadPair(authored).before.fields[0].hex = hex;
    assert.throws(
      () => prepareExample(authored),
      /equip-hide-offset.*visibility-load.*before.*opcode.*invalid hex token/
    );
  }
});

test("empty fields, encodings, and examples fail clearly", () => {
  const emptyHex = example();
  loadPair(emptyHex).before.fields[0].hex = " \n\t";
  assert.throws(
    () => prepareExample(emptyHex),
    /visibility-load.*opcode.*hex.*nonempty/
  );
  const emptyEncoding = example();
  loadPair(emptyEncoding).before.fields = [];
  assert.throws(
    () => prepareExample(emptyEncoding),
    /visibility-load.*before.*at least one field/
  );
  const emptyExample = example();
  emptyExample.pairs = [];
  assert.throws(
    () => prepareExample(emptyExample),
    /equip-hide-offset.*at least one/
  );
});

test("decoded instructions have a 15-byte limit while context remains explicitly unannotated", () => {
  const authored = example();
  for (const side of ["before", "after"]) {
    loadPair(authored)[side].fields[0].hex = Array(13).fill("0F").join(" ");
  }
  assert.equal(bytes(prepareExample(authored), "before").length, 21);
  loadPair(authored).before.fields[0].hex += " 0F";
  assert.throws(
    () => prepareExample(authored),
    /visibility-load.*before.*cannot exceed 15 bytes/
  );

  const context = example();
  for (const side of ["before", "after"]) {
    context.pairs[0][side].fields[0].hex = Array(16).fill("48").join(" ");
  }
  const prepared = prepareExample(context);
  assert.equal(prepared.pairs[0].kind, "context");
  assert.deepEqual(prepared.pairs[0].before.assembly, []);
  assert.ok(prepared.pairs[0].before.contextLabel);
});

test("unequal field lengths and field counts reject unsupported comparison structures", () => {
  const lengthChange = example();
  loadPair(lengthChange).after.fields[2].hex = "20 00";
  assert.throws(
    () => prepareExample(lengthChange),
    /visibility-load.*field-offset.*byte counts must match.*length changes are unsupported/
  );
  const countChange = example();
  const after = loadPair(countChange).after;
  after.fields.pop();
  after.assembly = [{ text: "movzx eax, byte ptr [rax]" }];
  assert.throws(
    () => prepareExample(countChange),
    /visibility-load.*field counts differ.*matching field structures/
  );
});

test("field IDs, order, and roles must correspond across each authored pair", () => {
  for (const change of [
    (encoding) => {
      encoding.fields[0].id = "other-opcode";
      encoding.assembly = [{ text: "movzx eax, byte ptr [rax+0x20]" }];
    },
    (encoding) => {
      [encoding.fields[0], encoding.fields[1]] = [
        encoding.fields[1],
        encoding.fields[0],
      ];
    },
    (encoding) => {
      encoding.fields[0].role = "prefix";
    },
  ]) {
    const authored = example();
    change(loadPair(authored).after);
    assert.throws(
      () => prepareExample(authored),
      /visibility-load.*opcode.*field IDs, order, and roles must match/
    );
  }
});

test("duplicate instruction and field IDs identify the offending location", () => {
  const instructionDuplicate = example();
  instructionDuplicate.pairs.push(
    structuredClone(loadPair(instructionDuplicate))
  );
  assert.throws(
    () => prepareExample(instructionDuplicate),
    /equip-hide-offset.*visibility-load.*duplicate instruction ID/
  );
  for (const side of ["before", "after"]) {
    const fieldDuplicate = example();
    loadPair(fieldDuplicate)[side].fields[1].id = "opcode";
    assert.throws(
      () => prepareExample(fieldDuplicate),
      new RegExp(`visibility-load.*${side}.*opcode.*duplicate field ID`)
    );
  }
});

test("dangling assembly associations and default selections fail before rendering", () => {
  const assembly = example();
  loadPair(assembly).after.assembly[0].fieldIds = ["missing"];
  assert.throws(
    () => prepareExample(assembly),
    /visibility-load.*after.*assembly part 0.*unknown field association "missing"/
  );
  for (const defaultField of [
    { instructionId: "visibility-load", fieldId: "missing" },
    { instructionId: "missing", fieldId: "field-offset" },
  ]) {
    const authored = example();
    authored.defaultField = defaultField;
    assert.throws(
      () => prepareExample(authored),
      /equip-hide-offset.*default selection references unknown field.*missing/
    );
  }
  const missing = example();
  delete missing.defaultField;
  assert.throws(
    () => prepareExample(missing),
    /equip-hide-offset.*default instruction/
  );
});

test("mode, encoding roles, and instruction kinds must be explicit", () => {
  const architecture = example();
  architecture.architecture = "x86";
  assert.throws(() => prepareExample(architecture), /architecture.*x86-64/);
  const role = example();
  loadPair(role).before.fields[0].role = "data";
  assert.throws(
    () => prepareExample(role),
    /visibility-load.*opcode.*unknown encoding role/
  );
  const kind = example();
  loadPair(kind).kind = "automatic";
  assert.throws(() => prepareExample(kind), /visibility-load.*kind must be/);
});

test("context cannot acquire decoded claims and instructions require assembly", () => {
  const contextRole = example();
  contextRole.pairs[0].before.fields[0].role = "prefix";
  assert.throws(
    () => prepareExample(contextRole),
    /context fields must use the unknown role/
  );
  const contextAssembly = example();
  contextAssembly.pairs[0].before.assembly = [
    { text: "mov rax, qword ptr [rbp+0x5f]" },
  ];
  assert.throws(
    () => prepareExample(contextAssembly),
    /context must use a label/
  );
  const missingLabel = example();
  delete missingLabel.pairs[0].before.contextLabel;
  assert.throws(() => prepareExample(missingLabel), /context label.*nonempty/);
  const unknownInstruction = example();
  loadPair(unknownInstruction).before.fields[0].role = "unknown";
  assert.throws(
    () => prepareExample(unknownInstruction),
    /unknown roles belong in a separate context/
  );
  for (const assembly of [undefined, [], [{ text: "   " }]]) {
    const missingAssembly = example();
    loadPair(missingAssembly).before.assembly = assembly;
    assert.throws(
      () => prepareExample(missingAssembly),
      /visibility-load.*assembly/
    );
  }
});

test("IDs cannot collide with instruction-qualified field keys", () => {
  for (const id of ["", " ", "field:offset", "MixedCase", "field--offset"]) {
    const authored = example();
    loadPair(authored).before.fields[0].id = id;
    assert.throws(
      () => prepareExample(authored),
      /visibility-load.*field.*(IDs must|nonempty)/
    );
  }
});
