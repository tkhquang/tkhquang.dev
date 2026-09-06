import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

import * as simulation from "./simulation.ts";

// The app bundler resolves the renderer's extensionless import. Compile that
// boundary for Node while keeping the test on the public drawing function.
const { outputText } = ts.transpileModule(
  readFileSync(new URL("./render.ts", import.meta.url), "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }
);
const renderer = { exports: {} };
new Function("require", "module", "exports", "window", outputText)(
  (specifier) => {
    assert.equal(specifier, "./simulation");
    return simulation;
  },
  renderer,
  renderer.exports,
  { devicePixelRatio: 1 }
);
const { drawCameraView } = renderer.exports;
const { createRig, DEFAULT_SETTINGS } = simulation;
const WIDTH = 400;
const HEIGHT = 280;

function draw(state, settings) {
  const polygons = [];
  let points = [];
  const point = (x, y) => {
    assert.ok(Number.isFinite(x) && Number.isFinite(y));
    assert.ok(x >= -0.000001 && x <= WIDTH + 0.000001);
    assert.ok(y >= -0.000001 && y <= HEIGHT + 0.000001);
    points.push({ x, y });
  };
  const context = {
    setTransform() {},
    setLineDash() {},
    fillRect() {},
    stroke() {},
    fillText() {},
    closePath() {},
    beginPath() {
      points = [];
    },
    moveTo: point,
    lineTo: point,
    createLinearGradient: () => ({ addColorStop() {} }),
    measureText: () => ({ width: 0 }),
    fill() {
      polygons.push({
        points: [...points],
        color: this.fillStyle,
        opacity: this.globalAlpha,
      });
    },
  };
  drawCameraView(
    {
      width: WIDTH,
      height: HEIGHT,
      getBoundingClientRect: () => ({ width: WIDTH, height: HEIGHT }),
      getContext: () => context,
    },
    state,
    settings
  );
  return polygons;
}

function covers(polygon, x, y) {
  let sign = 0;
  for (let index = 0; index < polygon.points.length; index++) {
    const a = polygon.points[index];
    const b = polygon.points[(index + 1) % polygon.points.length];
    const cross = (b.x - a.x) * (y - a.y) - (b.y - a.y) * (x - a.x);
    if (Math.abs(cross) < 0.00000001) continue;
    if (sign && Math.sign(cross) !== sign) return false;
    sign = Math.sign(cross);
  }
  return sign !== 0;
}

function rayAt(state, settings, x, y) {
  const focal = HEIGHT / (2 * Math.tan((settings.fov * Math.PI) / 360));
  const forward = state.forward;
  const horizontal = Math.hypot(forward.x, forward.z);
  const right = { x: forward.z / horizontal, y: 0, z: -forward.x / horizontal };
  const up = {
    x: forward.y * right.z,
    y: horizontal,
    z: -forward.y * right.x,
  };
  return Object.fromEntries(
    ["x", "y", "z"].map((axis) => [
      axis,
      forward[axis] +
        (right[axis] * (x - WIDTH / 2)) / focal +
        (up[axis] * (HEIGHT / 2 - y)) / focal,
    ])
  );
}

// Ray/slab intersections choose the nearest solid independently of the
// renderer's polygon splitting and traversal order.
function rayBox(origin, direction, box) {
  let entry = -Infinity;
  let exit = Infinity;
  let face;
  for (const axis of ["x", "y", "z"]) {
    if (Math.abs(direction[axis]) < 0.00000001) {
      if (origin[axis] < box.min[axis] || origin[axis] > box.max[axis])
        return null;
      continue;
    }
    const a = (box.min[axis] - origin[axis]) / direction[axis];
    const b = (box.max[axis] - origin[axis]) / direction[axis];
    const near = Math.min(a, b);
    if (near > entry) {
      entry = near;
      face = axis;
    }
    exit = Math.min(exit, Math.max(a, b));
    if (entry > exit) return null;
  }
  return entry > 0 ? { depth: entry, color: box.colors[face] } : null;
}

test("overlapping column trim follows surface depth, including clipped faces", () => {
  const settings = { ...DEFAULT_SETTINGS, yaw: 20, fade: false };
  const state = createRig(settings);
  const polygons = draw(state, settings);
  const boxes = [
    {
      min: { x: -5.45, y: 0, z: 6.55 },
      max: { x: -4.55, y: 2.7, z: 7.45 },
      colors: { x: "#2c414c", y: "#64727b", z: "#38505b" },
    },
    {
      min: { x: -5.46, y: 2.5, z: 6.54 },
      max: { x: -4.54, y: 2.6, z: 7.46 },
      colors: { x: "#667b86", y: "#a1a8a9", z: "#82939b" },
    },
  ];
  const seen = new Set();
  for (const [x, y] of [
    [3, 103],
    [7, 103],
    [11, 103],
    [3, 107],
    [7, 107],
    [11, 107],
    [15, 107],
  ]) {
    const direction = rayAt(state, settings, x, y);
    const hits = boxes
      .map((box) => rayBox(state.camera, direction, box))
      .filter(Boolean)
      .sort((a, b) => a.depth - b.depth);
    assert.ok(hits.length > 0);
    seen.add(hits[0].color);
    const actual = polygons.findLast((polygon) => covers(polygon, x, y));
    assert.equal(actual?.color, hits[0].color, `visible surface at ${x}, ${y}`);
  }
  assert.equal(seen.size, 2, "both the trim and the column must be visible");
});

test("wall fade composites over the subject and collision clears the sightline", () => {
  const subjectColors = new Set([
    "#c5a36b",
    "#8f784f",
    "#e8c98d",
    "#efd7af",
    "#b99a77",
    "#fae7c6",
  ]);
  const wallColors = new Set(["#79535e", "#543e49", "#a6797e"]);
  for (const collision of [false, true]) {
    for (const fade of [false, true]) {
      const settings = { ...DEFAULT_SETTINGS, collision, fade };
      const state = createRig(settings);
      const layers = draw(state, settings).filter((polygon) =>
        covers(polygon, WIDTH / 2, HEIGHT / 2 + 12)
      );
      const subjectIndex = layers.findLastIndex((layer) =>
        subjectColors.has(layer.color)
      );
      const wallIndex = layers.findLastIndex((layer) =>
        wallColors.has(layer.color)
      );
      assert.ok(subjectIndex >= 0);
      if (collision) assert.equal(wallIndex, -1);
      else {
        assert.ok(wallIndex > subjectIndex);
        assert.equal(layers[wallIndex].opacity, fade ? 0.18 : 1);
      }
    }
  }
});

test("near-plane crossings and wide lenses keep drawing coordinates finite and clipped", () => {
  for (const fov of [30, 100]) {
    for (const boom of [0.6, 3.1, 7]) {
      for (const yaw of [-80, 0, 80]) {
        const settings = {
          ...DEFAULT_SETTINGS,
          collision: false,
          fade: false,
          fov,
          boom,
          yaw,
        };
        assert.ok(draw(createRig(settings), settings).length > 0);
      }
    }
  }
});
