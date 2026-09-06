import type {
  ContextEncoding,
  EncodingRole,
  HexDiffExample,
  InstructionEncoding,
  PreparedEncoding,
  PreparedHexDiffExample,
  PreparedInstructionPair,
} from "./types";

const ROLES: EncodingRole[] = [
  "prefix",
  "opcode",
  "modrm",
  "sib",
  "displacement",
  "immediate",
  "unknown",
];

function fail(location: string, message: string): never {
  throw new Error(`Hex diff ${location}: ${message}`);
}

function requireText(
  value: unknown,
  location: string
): asserts value is string {
  if (typeof value !== "string" || !value.trim()) {
    fail(location, "expected nonempty plain text.");
  }
}

function requireId(value: unknown, location: string): asserts value is string {
  requireText(value, location);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
    fail(
      location,
      "IDs must use lowercase letters, digits, and single hyphens."
    );
  }
}

function prepareEncoding(
  encoding: InstructionEncoding | ContextEncoding,
  kind: "instruction" | "context",
  instructionId: string,
  offset: number,
  location: string
): PreparedEncoding {
  if (!encoding || !Array.isArray(encoding.fields) || !encoding.fields.length) {
    fail(location, "an encoding must contain at least one field.");
  }

  const fieldIds = new Set<string>();
  let position = offset;
  const fields = encoding.fields.map((field, index) => {
    const fieldLocation = `${location}, field ${JSON.stringify(field?.id ?? index)}`;
    requireId(field?.id, fieldLocation);
    if (fieldIds.has(field.id)) fail(fieldLocation, "duplicate field ID.");
    fieldIds.add(field.id);
    if (!ROLES.includes(field.role))
      fail(fieldLocation, "unknown encoding role.");
    if (kind === "context" && field.role !== "unknown") {
      fail(
        fieldLocation,
        "unannotated context fields must use the unknown role."
      );
    }
    if (kind === "instruction" && field.role === "unknown") {
      fail(fieldLocation, "unknown roles belong in a separate context pair.");
    }
    requireText(field.description, `${fieldLocation}, description`);
    requireText(field.hex, `${fieldLocation}, hex`);
    const tokens = field.hex.trim().split(/\s+/);
    for (const token of tokens) {
      if (!/^[0-9a-f]{2}$/i.test(token)) {
        fail(
          fieldLocation,
          `invalid hex token ${JSON.stringify(token)}; use complete two-digit bytes without wildcards.`
        );
      }
    }
    const bytes = tokens.map((token) => ({
      hex: token.toUpperCase(),
      offset: position++,
      changed: false,
    }));
    return {
      id: field.id,
      key: `${instructionId}:${field.id}`,
      role: field.role,
      hex: bytes.map((byte) => byte.hex).join(" "),
      description: field.description,
      bytes,
    };
  });

  const hex = fields.map((field) => field.hex).join(" ");
  if (kind === "context") {
    requireText(encoding.contextLabel, `${location}, context label`);
    if (encoding.assembly !== undefined) {
      fail(
        location,
        "unannotated context must use a label, not decoded assembly."
      );
    }
    return { fields, assembly: [], hex, contextLabel: encoding.contextLabel };
  }

  if (position - offset > 15) {
    fail(location, "a decoded x86-64 instruction cannot exceed 15 bytes.");
  }
  if (encoding.contextLabel !== undefined) {
    fail(
      location,
      "decoded instructions must use assembly, not a context label."
    );
  }
  if (!Array.isArray(encoding.assembly) || !encoding.assembly.length) {
    fail(location, "a decoded instruction must contain assembly text.");
  }
  const assembly = encoding.assembly.map((part, index) => {
    const partLocation = `${location}, assembly part ${index}`;
    if (!part || typeof part.text !== "string" || !part.text.length) {
      fail(partLocation, "expected nonempty assembly text.");
    }
    if (part.fieldIds !== undefined && !Array.isArray(part.fieldIds)) {
      fail(partLocation, "field associations must be an array of field IDs.");
    }
    const fieldKeys = (part.fieldIds ?? []).map((fieldId) => {
      if (!fieldIds.has(fieldId)) {
        fail(
          partLocation,
          `unknown field association ${JSON.stringify(fieldId)}.`
        );
      }
      return `${instructionId}:${fieldId}`;
    });
    return { text: part.text, fieldKeys };
  });
  requireText(
    assembly.map((part) => part.text).join(""),
    `${location}, assembly`
  );
  return { fields, assembly, hex };
}

export function prepareExample(
  example: HexDiffExample
): PreparedHexDiffExample {
  const location = `example ${JSON.stringify(example?.id ?? "(missing)")}`;
  requireId(example?.id, location);
  requireText(example.title, `${location}, title`);
  requireText(example.caption, `${location}, caption`);
  if (example.architecture !== "x86-64") {
    fail(location, 'architecture must be explicitly set to "x86-64".');
  }
  if (!Array.isArray(example.pairs) || !example.pairs.length) {
    fail(
      location,
      "an example must contain at least one instruction or context pair."
    );
  }
  if (example.notes !== undefined && !Array.isArray(example.notes)) {
    fail(location, "notes must be an array of plain text annotations.");
  }
  const notes = (example.notes ?? []).map((note, index) => {
    requireText(note, `${location}, note ${index}`);
    return note;
  });

  const instructionIds = new Set<string>();
  const fieldKeys = new Set<string>();
  const presentRoles = new Set<EncodingRole>();
  let offset = 0;
  const pairs: PreparedInstructionPair[] = example.pairs.map((pair, index) => {
    const pairLocation = `${location}, instruction ${JSON.stringify(pair?.id ?? index)}`;
    requireId(pair?.id, pairLocation);
    if (instructionIds.has(pair.id))
      fail(pairLocation, "duplicate instruction ID.");
    instructionIds.add(pair.id);
    requireText(pair.label, `${pairLocation}, label`);
    if (pair.kind !== "instruction" && pair.kind !== "context") {
      fail(pairLocation, 'kind must be "instruction" or "context".');
    }
    const before = prepareEncoding(
      pair.before,
      pair.kind,
      pair.id,
      offset,
      `${pairLocation}, before`
    );
    const after = prepareEncoding(
      pair.after,
      pair.kind,
      pair.id,
      offset,
      `${pairLocation}, after`
    );
    if (before.fields.length !== after.fields.length) {
      fail(
        pairLocation,
        "before/after field counts differ; only matching field structures are supported."
      );
    }
    before.fields.forEach((field, fieldIndex) => {
      const counterpart = after.fields[fieldIndex];
      const fieldLocation = `${pairLocation}, field ${JSON.stringify(field.id)}`;
      if (field.id !== counterpart.id || field.role !== counterpart.role) {
        fail(
          fieldLocation,
          "before/after field IDs, order, and roles must match; structure changes are unsupported."
        );
      }
      if (field.bytes.length !== counterpart.bytes.length) {
        fail(
          fieldLocation,
          "before/after field byte counts must match; length changes are unsupported."
        );
      }
      field.bytes.forEach((byte, byteIndex) => {
        const otherByte = counterpart.bytes[byteIndex];
        byte.changed = otherByte.changed = byte.hex !== otherByte.hex;
      });
      fieldKeys.add(field.key);
      presentRoles.add(field.role);
      offset += field.bytes.length;
    });
    return { id: pair.id, label: pair.label, kind: pair.kind, before, after };
  });

  requireId(
    example.defaultField?.instructionId,
    `${location}, default instruction`
  );
  requireId(example.defaultField?.fieldId, `${location}, default field`);
  const defaultFieldKey = `${example.defaultField.instructionId}:${example.defaultField.fieldId}`;
  if (!fieldKeys.has(defaultFieldKey)) {
    fail(
      location,
      `default selection references unknown field ${JSON.stringify(defaultFieldKey)}.`
    );
  }

  return {
    id: example.id,
    title: example.title,
    architecture: example.architecture,
    caption: example.caption,
    defaultFieldKey,
    notes,
    pairs,
    roles: ROLES.filter((role) => presentRoles.has(role)),
    copy: {
      before: pairs.map((pair) => pair.before.hex).join(" "),
      after: pairs.map((pair) => pair.after.hex).join(" "),
    },
  };
}
