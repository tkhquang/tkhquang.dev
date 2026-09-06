import assert from "node:assert/strict";
import test from "node:test";

import {
  CAMERA_MARGIN,
  DEFAULT_SETTINGS,
  WALL,
  createRig,
  settleRig,
  stepRig,
} from "./simulation.ts";

function distance(first, second) {
  return Math.hypot(first.x - second.x, first.y - second.y, first.z - second.z);
}

function run(
  settings,
  seconds,
  rate,
  initial = createRig(settings),
  moving = true
) {
  let state = initial;
  for (let frame = 0; frame < Math.round(seconds * rate); frame += 1) {
    state = stepRig(state, settings, 1 / rate, moving);
  }
  return state;
}

test("yaw rotates the boom and shoulder together, independent of field of view", () => {
  const settings = { ...DEFAULT_SETTINGS, collision: false, yaw: 90 };
  const state = createRig(settings);
  assert.ok(Math.abs(state.desired.x + settings.boom) < 1e-10);
  assert.ok(Math.abs(state.desired.z + settings.shoulder) < 1e-10);
  assert.equal(state.pivot.y, settings.pivotHeight);
  assert.deepEqual(createRig({ ...settings, fov: 90 }).camera, state.camera);
});

test("settled edits preserve the subject and clock while solving the new rig", () => {
  const moving = run(DEFAULT_SETTINGS, 2, 60);
  const settled = settleRig(moving, {
    ...DEFAULT_SETTINGS,
    boom: 1,
    shoulder: -0.4,
  });
  assert.equal(settled.time, moving.time);
  assert.deepEqual(settled.subject, moving.subject);
  assert.deepEqual(settled.velocity, { x: 0, y: 0, z: 0 });
  assert.equal(settled.desired.x, moving.subject.x - 0.4);
  assert.equal(settled.desired.z, moving.subject.z - 1);
});

test("a stationary subject still lets the spring settle", () => {
  const settings = { ...DEFAULT_SETTINGS, collision: false, damping: 1 };
  const initial = createRig({ ...settings, boom: 1 });
  const state = run(settings, 4, 60, initial, false);
  assert.equal(state.time, 0);
  assert.deepEqual(state.subject, { x: 0, y: 0, z: 0 });
  assert.ok(distance(state.camera, state.desired) < 0.00001);
});

test("low damping overshoots while critical damping approaches a static target", () => {
  const base = { ...DEFAULT_SETTINGS, collision: false };
  for (const damping of [0.1, 1]) {
    const settings = { ...base, damping };
    let state = createRig({ ...settings, boom: 1 });
    let minimum = state.camera.z;
    for (let frame = 0; frame < 180; frame += 1) {
      state = stepRig(state, settings, 1 / 60, false);
      minimum = Math.min(minimum, state.camera.z);
    }
    if (damping === 0.1) assert.ok(minimum < -4.5);
    else assert.ok(minimum >= -4);
  }
});

test("collision projects onto the near face and preserves shoulder displacement", () => {
  const state = createRig(DEFAULT_SETTINGS);
  assert.equal(state.colliding, true);
  assert.equal(state.camera.x, state.desired.x);
  assert.equal(state.camera.y, state.desired.y);
  assert.ok(state.camera.z >= WALL.max.z + CAMERA_MARGIN);
  const disabled = createRig({ ...DEFAULT_SETTINGS, collision: false });
  assert.equal(disabled.camera.z, -4);
  const enabled = stepRig(disabled, DEFAULT_SETTINGS, 0, false);
  assert.ok(enabled.camera.z >= WALL.max.z + CAMERA_MARGIN);
});

test("the finite wall permits unobstructed cameras beyond its side and top", () => {
  const side = createRig({ ...DEFAULT_SETTINGS, shoulder: 6 });
  const above = createRig({ ...DEFAULT_SETTINGS, pivotHeight: 4 });
  assert.equal(side.colliding, false);
  assert.deepEqual(side.camera, side.desired);
  assert.equal(above.colliding, false);
  assert.deepEqual(above.camera, above.desired);
});

test("a fast corner crossing cannot tunnel through the collider", () => {
  const settings = {
    ...DEFAULT_SETTINGS,
    shoulder: 6,
    stiffness: 200,
    damping: 0.1,
  };
  const initial = {
    ...createRig(settings),
    camera: { x: -4, y: 1.4, z: -3.1 },
    velocity: { x: 1600, y: 0, z: 0 },
  };
  const state = stepRig(initial, settings, 1 / 240, false);
  assert.ok(state.camera.x > WALL.max.x);
  assert.ok(state.camera.z >= WALL.max.z + CAMERA_MARGIN);
  assert.equal(state.colliding, true);
});

test("aggressive spring motion remains finite and in front of an obstructing wall", () => {
  for (const damping of [0.1, 2]) {
    const settings = {
      ...DEFAULT_SETTINGS,
      stiffness: 200,
      damping,
      shoulder: 0,
    };
    let state = createRig(settings);
    for (let frame = 0; frame < 1800; frame += 1) {
      state = stepRig(state, settings, 1 / 60, true);
      for (const vector of [state.camera, state.velocity, state.forward]) {
        for (const value of Object.values(vector))
          assert.ok(Number.isFinite(value));
      }
      assert.ok(state.camera.z >= WALL.max.z + CAMERA_MARGIN);
      assert.ok(state.subject.z > WALL.max.z + CAMERA_MARGIN);
      assert.ok(state.opacity >= 0.16 && state.opacity <= 1);
      assert.equal(state.occluded, false);
      assert.ok(state.wallOpacity >= 0.18 && state.wallOpacity <= 1);
    }
  }
});

test("30, 60, 120, and 144 Hz produce comparable moving spring states", () => {
  for (const collision of [false, true]) {
    const settings = { ...DEFAULT_SETTINGS, collision, damping: 0.4 };
    const reference = run(settings, 8, 120);
    for (const rate of [30, 60, 144]) {
      const state = run(settings, 8, rate);
      assert.ok(
        distance(state.camera, reference.camera) < 0.008,
        `${rate} Hz camera differs`
      );
      assert.ok(distance(state.subject, reference.subject) < 1e-10);
      assert.ok(Math.abs(state.opacity - reference.opacity) < 0.008);
      assert.ok(Math.abs(state.wallOpacity - reference.wallOpacity) < 0.008);
    }
  }
});

test("look-at points to the pivot, locked yaw stays independent of shoulder offset", () => {
  const state = createRig(DEFAULT_SETTINGS);
  const lookDistance = distance(state.camera, state.pivot);
  assert.ok(Math.abs(Math.hypot(...Object.values(state.forward)) - 1) < 1e-10);
  assert.ok(
    Math.abs(
      state.forward.x - (state.pivot.x - state.camera.x) / lookDistance
    ) < 1e-10
  );
  const locked = createRig({ ...DEFAULT_SETTINGS, yaw: 30, lookAt: false });
  assert.ok(Math.abs(locked.forward.x - 0.5) < 1e-10);
  assert.equal(locked.forward.y, 0);
});

test("near-subject fade eases over time and disabling it restores full opacity", () => {
  const settings = {
    ...DEFAULT_SETTINGS,
    boom: 0.5,
    shoulder: 0,
    pivotHeight: 1,
  };
  const settled = createRig(settings);
  assert.ok(settled.opacity < 0.2);
  const initial = { ...settled, opacity: 1 };
  const first = stepRig(initial, settings, 1 / 60, false);
  assert.ok(first.opacity < 1 && first.opacity > settled.opacity);
  const later = run(settings, 1, 60, first, false);
  assert.ok(later.opacity < first.opacity);
  assert.equal(
    stepRig(later, { ...settings, fade: false }, 0, false).opacity,
    1
  );
});

test("long or invalid frame durations cannot jump the simulation clock", () => {
  const state = createRig(DEFAULT_SETTINGS);
  const longFrame = stepRig(state, DEFAULT_SETTINGS, 30, true);
  assert.ok(longFrame.time <= 0.100000001);
  for (const dt of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
    const invalid = stepRig(state, DEFAULT_SETTINGS, dt, true);
    assert.equal(invalid.time, 0);
    assert.deepEqual(invalid.camera, state.camera);
  }
});

test("an obstructing wall fades independently of the distant subject", () => {
  const settings = { ...DEFAULT_SETTINGS, collision: false };
  const state = createRig(settings);
  assert.equal(state.occluded, true);
  assert.equal(state.wallOpacity, 0.18);
  assert.equal(state.opacity, 1);
  assert.equal(state.camera.z, -settings.boom);
  const aroundWall = createRig({ ...settings, shoulder: 6 });
  assert.equal(aroundWall.occluded, false);
  assert.equal(aroundWall.wallOpacity, 1);
});

test("camera clearance does not fade a wall that misses the sightline", () => {
  for (const patch of [{ boom: 2.9 }, { yaw: 51 }]) {
    const settings = { ...DEFAULT_SETTINGS, ...patch, collision: false };
    const clear = createRig(settings);
    assert.equal(clear.occluded, false);
    assert.equal(clear.wallOpacity, 1);
    const protectedRig = createRig({ ...settings, collision: true });
    assert.equal(protectedRig.colliding, true);
    assert.ok(protectedRig.camera.z >= WALL.max.z + CAMERA_MARGIN);
  }
});

test("collision removes wall occlusion and paused edits immediately resolve opacity", () => {
  const obstructed = createRig({ ...DEFAULT_SETTINGS, collision: false });
  const protectedRig = settleRig(obstructed, DEFAULT_SETTINGS);
  assert.equal(protectedRig.occluded, false);
  assert.equal(protectedRig.wallOpacity, 1);
  const nextFrame = stepRig(obstructed, DEFAULT_SETTINGS, 1 / 60, false);
  assert.equal(nextFrame.occluded, false);
  assert.ok(nextFrame.wallOpacity > 0.18 && nextFrame.wallOpacity < 1);
  const restored = run(DEFAULT_SETTINGS, 1, 60, nextFrame, false);
  assert.ok(restored.wallOpacity > 0.9999);
});

test("wall fade eases consistently and disabling fade restores an opaque obstruction", () => {
  const settings = { ...DEFAULT_SETTINGS, collision: false };
  const initial = { ...createRig(settings), wallOpacity: 1 };
  const first = stepRig(initial, settings, 1 / 60, false);
  assert.ok(first.wallOpacity > 0.18 && first.wallOpacity < 1);
  const at30 = run(settings, 0.5, 30, initial, false);
  const at144 = run(settings, 0.5, 144, initial, false);
  assert.ok(Math.abs(at30.wallOpacity - at144.wallOpacity) < 1e-10);
  assert.ok(at30.wallOpacity < 0.19);
  const disabled = stepRig(first, { ...settings, fade: false }, 0, false);
  assert.equal(disabled.occluded, true);
  assert.equal(disabled.wallOpacity, 1);
  assert.equal(settleRig(first, { ...settings, fade: false }).wallOpacity, 1);
});
