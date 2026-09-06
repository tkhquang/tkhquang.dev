import assert from "node:assert/strict";
import test from "node:test";

import {
  activeFieldKey,
  initialInspection,
  inspectionReducer,
} from "./inspection.ts";

const offset = "load/field-offset";
const opcode = "load/opcode";
const addressing = "load/addressing";

function inspect(...events) {
  return events.reduce(inspectionReducer, initialInspection);
}

test("the default change returns after an unpinned hover ends", () => {
  assert.equal(activeFieldKey(initialInspection, offset), offset);

  const preview = inspect({ type: "hover", key: opcode });
  assert.equal(activeFieldKey(preview, offset), opcode);
  assert.equal(
    activeFieldKey(inspectionReducer(preview, { type: "leave" }), offset),
    offset
  );
});

test("a pin keeps its explanation while the pointer crosses other fields", () => {
  const pinned = inspect(
    { type: "select", key: opcode },
    { type: "hover", key: addressing }
  );
  assert.equal(activeFieldKey(pinned, offset), opcode);
  assert.equal(
    activeFieldKey(inspectionReducer(pinned, { type: "leave" }), offset),
    opcode
  );
});

test("keyboard focus outranks a stationary pointer and an existing pin", () => {
  const focused = inspect(
    { type: "hover", key: addressing },
    { type: "select", key: opcode },
    { type: "focus", key: offset }
  );
  assert.equal(activeFieldKey(focused, addressing), offset);

  const moved = inspectionReducer(focused, {
    type: "hover",
    key: addressing,
  });
  assert.equal(activeFieldKey(moved, addressing), offset);
  assert.equal(
    activeFieldKey(inspectionReducer(moved, { type: "blur" }), offset),
    opcode
  );
});

test("activating a paired field toggles the shared pin without dropping focus", () => {
  const selected = inspect(
    { type: "focus", key: opcode },
    { type: "select", key: opcode }
  );
  assert.equal(selected.pinned, opcode);

  const toggled = inspectionReducer(selected, { type: "select", key: opcode });
  assert.equal(toggled.pinned, null);
  assert.equal(activeFieldKey(toggled, offset), opcode);
  assert.equal(
    activeFieldKey(inspectionReducer(toggled, { type: "blur" }), offset),
    offset
  );
});

test("pointer selection can replace an explanation left by keyboard focus", () => {
  const focused = inspect(
    { type: "focus", key: addressing },
    { type: "select", key: addressing }
  );
  const selected = [{ type: "blur" }, { type: "select", key: opcode }].reduce(
    inspectionReducer,
    focused
  );

  assert.equal(activeFieldKey(selected, offset), opcode);
  assert.equal(selected.pinned, opcode);
});

test("clear dismisses a pin and stale hover while preserving keyboard inspection", () => {
  const selected = inspect(
    { type: "hover", key: addressing },
    { type: "select", key: opcode },
    { type: "focus", key: opcode }
  );
  const cleared = inspectionReducer(selected, { type: "clear" });

  assert.deepEqual(cleared, {
    focused: opcode,
    pinned: null,
    hovered: null,
  });
  assert.equal(activeFieldKey(cleared, offset), opcode);
  assert.equal(
    activeFieldKey(inspectionReducer(cleared, { type: "blur" }), offset),
    offset
  );
});

test("two figures can share the initial state without sharing later selections", () => {
  const initial = Object.freeze({ ...initialInspection });
  const first = inspectionReducer(initial, { type: "select", key: opcode });
  const second = inspectionReducer(initial, { type: "hover", key: addressing });

  assert.equal(activeFieldKey(first, offset), opcode);
  assert.equal(activeFieldKey(second, offset), addressing);
  assert.deepEqual(initial, { focused: null, pinned: null, hovered: null });
});
