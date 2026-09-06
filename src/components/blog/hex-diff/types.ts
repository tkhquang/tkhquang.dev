export type EncodingRole =
  | "prefix"
  | "opcode"
  | "modrm"
  | "sib"
  | "displacement"
  | "immediate"
  | "unknown";

export type EncodingField = {
  id: string;
  role: EncodingRole;
  hex: string;
  description: string;
};

export type AssemblyPart = {
  text: string;
  fieldIds?: string[];
};

export type InstructionEncoding = {
  fields: EncodingField[];
  assembly: AssemblyPart[];
  contextLabel?: never;
};

export type ContextEncoding = {
  fields: EncodingField[];
  contextLabel: string;
  assembly?: never;
};

export type InstructionPair = {
  id: string;
  label: string;
} & (
  | {
      kind: "instruction";
      before: InstructionEncoding;
      after: InstructionEncoding;
    }
  | {
      kind: "context";
      before: ContextEncoding;
      after: ContextEncoding;
    }
);

export type HexDiffExample = {
  id: string;
  title: string;
  architecture: "x86-64";
  caption: string;
  defaultField: { instructionId: string; fieldId: string };
  notes?: string[];
  pairs: InstructionPair[];
};

export type PreparedByte = {
  hex: string;
  /** Zero-based position in the complete before or after byte stream. */
  offset: number;
  changed: boolean;
};

export type PreparedField = {
  id: string;
  /** The instruction-qualified key is shared by corresponding fields. */
  key: string;
  role: EncodingRole;
  hex: string;
  description: string;
  bytes: PreparedByte[];
};

export type PreparedAssemblyPart = {
  text: string;
  fieldKeys: string[];
};

export type PreparedEncoding = {
  fields: PreparedField[];
  assembly: PreparedAssemblyPart[];
  hex: string;
  contextLabel?: string;
};

export type PreparedInstructionPair = {
  id: string;
  label: string;
  kind: "instruction" | "context";
  before: PreparedEncoding;
  after: PreparedEncoding;
};

export type PreparedHexDiffExample = {
  id: string;
  title: string;
  architecture: "x86-64";
  caption: string;
  defaultFieldKey: string;
  notes: string[];
  pairs: PreparedInstructionPair[];
  roles: EncodingRole[];
  copy: { before: string; after: string };
};
