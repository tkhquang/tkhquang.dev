import { prepareExample } from "./prepare";
import type { HexDiffExample, PreparedHexDiffExample } from "./types";
import { parseDocument, visit } from "yaml";
import { z } from "zod";

const fieldSchema = z.strictObject({
  id: z.string(),
  role: z.enum([
    "prefix",
    "opcode",
    "modrm",
    "sib",
    "displacement",
    "immediate",
    "unknown",
  ]),
  hex: z.string(),
  description: z.string(),
});

const instructionSchema = z.strictObject({
  fields: z.array(fieldSchema),
  assembly: z.array(
    z.strictObject({
      text: z.string(),
      fieldIds: z.array(z.string()).optional(),
    })
  ),
});

const contextSchema = z.strictObject({
  fields: z.array(fieldSchema),
  contextLabel: z.string(),
});

const exampleSchema: z.ZodType<HexDiffExample> = z.strictObject({
  id: z.string(),
  title: z.string(),
  architecture: z.literal("x86-64"),
  caption: z.string(),
  defaultField: z.strictObject({
    instructionId: z.string(),
    fieldId: z.string(),
  }),
  notes: z.array(z.string()).optional(),
  pairs: z.array(
    z.discriminatedUnion("kind", [
      z.strictObject({
        id: z.string(),
        label: z.string(),
        kind: z.literal("instruction"),
        before: instructionSchema,
        after: instructionSchema,
      }),
      z.strictObject({
        id: z.string(),
        label: z.string(),
        kind: z.literal("context"),
        before: contextSchema,
        after: contextSchema,
      }),
    ])
  ),
});

function recordId(value: unknown): string | undefined {
  if (value && typeof value === "object" && "id" in value) {
    return typeof value.id === "string" ? value.id : undefined;
  }
}

function schemaLocation(value: unknown, path: PropertyKey[]): string {
  let location = `example ${JSON.stringify(recordId(value) ?? "(missing)")}`;
  let current = value;
  for (const key of path) {
    location += `.${String(key)}`;
    if (current && typeof current === "object" && key in current) {
      current = (current as Record<PropertyKey, unknown>)[key];
      const id = recordId(current);
      if (id !== undefined) location += ` (${JSON.stringify(id)})`;
    } else {
      current = undefined;
    }
  }
  return location;
}

export function parseHexDiff(source: string): PreparedHexDiffExample {
  if (typeof source !== "string" || !source.trim()) {
    throw new Error(
      "Hex diff YAML: the hex-diff fence must contain an example."
    );
  }

  // Byte strings such as 03 and 20 must keep their written values, not become numbers.
  const document = parseDocument(source, {
    schema: "failsafe",
    customTags: [],
    resolveKnownTags: false,
    merge: false,
    strict: true,
    stringKeys: true,
    uniqueKeys: true,
  });
  const diagnostic = document.errors[0] ?? document.warnings[0];
  if (diagnostic) throw new Error(`Hex diff YAML: ${diagnostic.message}`);
  visit(document, {
    Alias() {
      throw new Error(
        "Hex diff YAML: aliases are unsupported; write each encoding explicitly."
      );
    },
    Value(_key, node) {
      if (node.tag) {
        throw new Error(
          "Hex diff YAML: explicit tags are unsupported; use plain strings, maps, and sequences."
        );
      }
    },
  });
  const value: unknown = document.toJS({ maxAliasCount: 0 });
  const result = exampleSchema.safeParse(value);
  if (!result.success) {
    const issue = result.error.issues[0];
    throw new Error(
      `Hex diff ${schemaLocation(value, issue.path)}: ${issue.message}`
    );
  }
  return prepareExample(result.data);
}
