import { type RigSettings, type RigState, type Vec3, WALL } from "./simulation";

const INK = "#101a25";
const GRID = "#253643";
const MUTED = "#8a9aa6";
const GOLD = "#e8c98d";
const CYAN = "#7dc9ce";
const ROSE = "#ce8e96";
const LABEL_FONT = '11px "Source Code Pro", monospace';

type Point = { x: number; y: number };
type Surface = {
  points: Vec3[];
  color: string;
  opacity: number;
  doubleSided: boolean;
};
type CameraSurface = Surface & { normal: Vec3; distance: number };

function prepare(canvas: HTMLCanvasElement) {
  const { width, height } = canvas.getBoundingClientRect();
  if (width < 1 || height < 1) return null;
  const context = canvas.getContext("2d");
  if (!context) return null;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const pixelWidth = Math.round(width * ratio);
  const pixelHeight = Math.round(height * ratio);
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }
  context.setTransform(pixelWidth / width, 0, 0, pixelHeight / height, 0, 0);
  context.globalAlpha = 1;
  context.setLineDash([]);
  context.fillStyle = INK;
  context.fillRect(0, 0, width, height);
  context.lineWidth = 1;
  context.lineJoin = "round";
  context.font = LABEL_FONT;
  return { context, width, height };
}

function path(context: CanvasRenderingContext2D, points: Point[]) {
  context.beginPath();
  points.forEach((point, index) => {
    if (index === 0) context.moveTo(point.x, point.y);
    else context.lineTo(point.x, point.y);
  });
}

function label(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color = MUTED,
  align: CanvasTextAlign = "left"
) {
  const width = context.measureText(text).width;
  const left = align === "right" ? x - width : x;
  context.fillStyle = "rgba(16, 26, 37, .88)";
  context.fillRect(left - 4, y - 11, width + 8, 16);
  context.fillStyle = color;
  context.textAlign = align;
  context.fillText(text, x, y);
  context.textAlign = "left";
}

function cameraGlyph(
  context: CanvasRenderingContext2D,
  point: Point,
  heading: number,
  ghost: boolean
) {
  context.save();
  context.translate(point.x, point.y);
  context.rotate(heading);
  context.strokeStyle = CYAN;
  context.fillStyle = ghost ? INK : CYAN;
  context.globalAlpha = ghost ? 0.55 : 1;
  context.setLineDash(ghost ? [2, 2] : []);
  path(context, [
    { x: -5, y: -3 },
    { x: -3, y: -7 },
    { x: 3, y: -7 },
    { x: 5, y: -3 },
  ]);
  context.closePath();
  context.fill();
  context.stroke();
  context.fillRect(-6, -3, 12, 9);
  context.strokeRect(-6, -3, 12, 9);
  context.restore();
}

export function drawRigMap(
  canvas: HTMLCanvasElement,
  state: RigState,
  settings: RigSettings
) {
  const frame = prepare(canvas);
  if (!frame) return;
  const { context, width, height } = frame;
  const halfWidth = Math.max(
    8,
    Math.abs(state.camera.x) + 2,
    Math.abs(state.desired.x) + 2
  );
  const minZ = Math.min(-7.5, state.camera.z - 1.7, state.desired.z - 1.7);
  const maxZ = Math.max(4.5, state.camera.z + 1.7, state.desired.z + 1.7);
  const scale = Math.min(width / (halfWidth * 2), height / (maxZ - minZ));
  const originY = (height - (maxZ - minZ) * scale) / 2 + maxZ * scale;
  const project = (point: Vec3): Point => ({
    x: width / 2 + point.x * scale,
    y: originY - point.z * scale,
  });

  context.strokeStyle = GRID;
  context.lineWidth = 0.6;
  for (let index = -14; index <= 14; index++) {
    path(context, [
      project({ x: index, y: 0, z: -14 }),
      project({ x: index, y: 0, z: 14 }),
    ]);
    context.stroke();
    path(context, [
      project({ x: -14, y: 0, z: index }),
      project({ x: 14, y: 0, z: index }),
    ]);
    context.stroke();
  }

  const pivot = project(state.pivot);
  const actual = project(state.camera);
  const desired = project(state.desired);
  const heading = Math.atan2(state.forward.x, state.forward.z);
  const horizontalHalfFov = Math.atan(
    Math.tan((settings.fov * Math.PI) / 360) * (width / height)
  );
  const frustumLength = scale * 4.5;
  const frustum = [
    actual,
    {
      x: actual.x + Math.sin(heading - horizontalHalfFov) * frustumLength,
      y: actual.y - Math.cos(heading - horizontalHalfFov) * frustumLength,
    },
    {
      x: actual.x + Math.sin(heading + horizontalHalfFov) * frustumLength,
      y: actual.y - Math.cos(heading + horizontalHalfFov) * frustumLength,
    },
  ];
  path(context, frustum);
  context.closePath();
  context.fillStyle = "rgba(125, 201, 206, .06)";
  context.fill();
  context.strokeStyle = "rgba(125, 201, 206, .3)";
  context.lineWidth = 1;
  context.stroke();

  path(context, [pivot, desired]);
  context.setLineDash([4, 5]);
  context.strokeStyle = "rgba(125, 201, 206, .45)";
  context.stroke();
  context.setLineDash([]);

  const wallStart = project({ ...WALL.min, z: WALL.max.z });
  const wallEnd = project({ ...WALL.max, z: WALL.min.z });
  const wallHeight = Math.max(7, wallEnd.y - wallStart.y);
  context.globalAlpha = 0.35 + 0.65 * state.wallOpacity;
  context.fillStyle = "#563c45";
  context.fillRect(
    wallStart.x,
    wallStart.y,
    wallEnd.x - wallStart.x,
    wallHeight
  );
  context.strokeStyle = ROSE;
  context.strokeRect(
    wallStart.x,
    wallStart.y,
    wallEnd.x - wallStart.x,
    wallHeight
  );
  context.save();
  context.beginPath();
  context.rect(wallStart.x, wallStart.y, wallEnd.x - wallStart.x, wallHeight);
  context.clip();
  context.globalAlpha = 0.5;
  for (let x = wallStart.x - wallHeight; x < wallEnd.x; x += 7) {
    path(context, [
      { x, y: wallStart.y + wallHeight },
      { x: x + wallHeight, y: wallStart.y },
    ]);
    context.stroke();
  }
  context.restore();
  context.globalAlpha = 1;
  label(context, "Wall", wallStart.x - 9, wallStart.y + 8, ROSE, "right");

  path(context, [pivot, actual]);
  context.lineWidth = 1.7;
  context.strokeStyle = state.colliding ? ROSE : CYAN;
  context.stroke();

  if (Math.hypot(actual.x - desired.x, actual.y - desired.y) > 8) {
    cameraGlyph(context, desired, heading, true);
    label(
      context,
      "Desired",
      Math.min(width - 57, desired.x + 13),
      Math.min(height - 17, desired.y + 4)
    );
  }
  if (state.colliding) {
    context.beginPath();
    context.arc(actual.x, actual.y, 12, 0, Math.PI * 2);
    context.strokeStyle = ROSE;
    context.lineWidth = 1;
    context.stroke();
  }
  cameraGlyph(context, actual, heading, false);
  label(
    context,
    "Camera",
    Math.max(52, actual.x - 16),
    Math.min(height - 18, actual.y + 5),
    CYAN,
    "right"
  );

  context.beginPath();
  context.arc(pivot.x, pivot.y, 9, 0, Math.PI * 2);
  context.fillStyle = INK;
  context.fill();
  context.strokeStyle = GOLD;
  context.lineWidth = 1;
  context.stroke();
  context.beginPath();
  context.arc(pivot.x, pivot.y, 4, 0, Math.PI * 2);
  context.fillStyle = GOLD;
  context.fill();
  path(context, [
    { x: pivot.x, y: pivot.y - 12 },
    { x: pivot.x, y: pivot.y - 23 },
    { x: pivot.x - 3, y: pivot.y - 19 },
  ]);
  context.stroke();
  label(
    context,
    "Subject / pivot",
    Math.min(width - 122, pivot.x + 16),
    pivot.y - 12,
    GOLD
  );

  context.strokeStyle = MUTED;
  context.lineWidth = 1;
  path(context, [
    { x: 20, y: height - 23 },
    { x: 20 + scale, y: height - 23 },
  ]);
  context.stroke();
  label(context, "1 m", 20, height - 32);
  label(context, "+Z ↑", width - 22, 27, MUTED, "right");
  label(context, "X →", width - 22, 44, MUTED, "right");
}

function subtract(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function dot(a: Vec3, b: Vec3) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function mix(a: Vec3, b: Vec3, amount: number): Vec3 {
  return {
    x: a.x + (b.x - a.x) * amount,
    y: a.y + (b.y - a.y) * amount,
    z: a.z + (b.z - a.z) * amount,
  };
}

// Clip in camera space before dividing by depth. All projected coordinates
// stay in the viewport even when the camera enters or crosses a surface.
function clipPolygon(points: Vec3[], planes: ((point: Vec3) => number)[]) {
  let result = points;
  for (const plane of planes) {
    const input = result;
    result = [];
    if (input.length === 0) break;
    let previous = input[input.length - 1];
    let previousDistance = plane(previous);
    for (const current of input) {
      const distance = plane(current);
      if (distance >= 0 !== previousDistance >= 0) {
        result.push(
          mix(
            previous,
            current,
            previousDistance / (previousDistance - distance)
          )
        );
      }
      if (distance >= 0) result.push(current);
      previous = current;
      previousDistance = distance;
    }
  }
  return result;
}

/* A wide wall and a narrow subject can overlap on screen while their mean
   depths put them in the wrong order. Partition polygons by face planes,
   splitting any polygon that crosses a plane, then visit the far side first.
   The camera is at the origin in this space, so the plane's signed distance
   identifies its near side. This also keeps translucent faces behind or in
   front of the geometry they actually overlap. */
function orderSurfaces(surfaces: CameraSurface[]): CameraSurface[] {
  if (surfaces.length < 2) return surfaces;
  const [divider, ...remaining] = surfaces;
  const front: CameraSurface[] = [];
  const back: CameraSurface[] = [];
  const coplanar = [divider];
  const plane = (point: Vec3) => dot(divider.normal, point) - divider.distance;

  for (const surface of remaining) {
    const distances = surface.points.map(plane);
    const hasFront = distances.some((distance) => distance > 0.000001);
    const hasBack = distances.some((distance) => distance < -0.000001);
    if (hasFront && hasBack) {
      front.push({
        ...surface,
        points: clipPolygon(surface.points, [plane]),
      });
      back.push({
        ...surface,
        points: clipPolygon(surface.points, [(point) => -plane(point)]),
      });
    } else if (hasFront) front.push(surface);
    else if (hasBack) back.push(surface);
    else coplanar.push(surface);
  }

  const cameraInFront = divider.distance < 0;
  return [
    ...orderSurfaces(cameraInFront ? back : front),
    ...coplanar,
    ...orderSurfaces(cameraInFront ? front : back),
  ];
}

function box(
  surfaces: Surface[],
  min: Vec3,
  max: Vec3,
  colors: [string, string, string],
  opacity = 1,
  doubleSided = false
) {
  const corners = [
    { x: min.x, y: min.y, z: min.z },
    { x: max.x, y: min.y, z: min.z },
    { x: max.x, y: max.y, z: min.z },
    { x: min.x, y: max.y, z: min.z },
    { x: min.x, y: min.y, z: max.z },
    { x: max.x, y: min.y, z: max.z },
    { x: max.x, y: max.y, z: max.z },
    { x: min.x, y: max.y, z: max.z },
  ];
  const faces = [
    [0, 3, 2, 1],
    [4, 5, 6, 7],
    [0, 4, 7, 3],
    [1, 2, 6, 5],
    [3, 7, 6, 2],
    [0, 1, 5, 4],
  ];
  faces.forEach((face, index) => {
    surfaces.push({
      points: face.map((corner) => corners[corner]),
      color: colors[index < 2 ? 0 : index < 4 ? 1 : 2],
      opacity,
      doubleSided,
    });
  });
}

export function drawCameraView(
  canvas: HTMLCanvasElement,
  state: RigState,
  settings: RigSettings
) {
  const frame = prepare(canvas);
  if (!frame) return;
  const { context, width, height } = frame;
  const forward = state.forward;
  const horizontal = Math.max(0.0001, Math.hypot(forward.x, forward.z));
  const right = { x: forward.z / horizontal, y: 0, z: -forward.x / horizontal };
  const up = {
    x: forward.y * right.z,
    y: forward.z * right.x - forward.x * right.z,
    z: -forward.y * right.x,
  };
  const cameraSpace = (point: Vec3): Vec3 => {
    const relative = subtract(point, state.camera);
    return {
      x: dot(relative, right),
      y: dot(relative, up),
      z: dot(relative, forward),
    };
  };
  const tangentY = Math.tan((settings.fov * Math.PI) / 360);
  const tangentX = tangentY * (width / height);
  const focal = height / (2 * tangentY);
  const project = (point: Vec3): Point => ({
    x: width / 2 + (focal * point.x) / point.z,
    y: height / 2 - (focal * point.y) / point.z,
  });
  const planes = [
    (point: Vec3) => point.z - 0.08,
    (point: Vec3) => point.x + point.z * tangentX,
    (point: Vec3) => point.z * tangentX - point.x,
    (point: Vec3) => point.y + point.z * tangentY,
    (point: Vec3) => point.z * tangentY - point.y,
  ];

  const sky = context.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#132332");
  sky.addColorStop(1, INK);
  context.fillStyle = sky;
  context.fillRect(0, 0, width, height);
  const horizon = Math.max(
    0,
    Math.min(height, height / 2 + (focal * forward.y) / horizontal)
  );
  context.fillStyle = "#17232b";
  context.fillRect(0, horizon, width, height - horizon);

  const line = (a: Vec3, b: Vec3) => {
    let start = cameraSpace(a);
    let end = cameraSpace(b);
    for (const plane of planes) {
      const da = plane(start);
      const db = plane(end);
      if (da < 0 && db < 0) return;
      if (da >= 0 && db >= 0) continue;
      const intersection = mix(start, end, da / (da - db));
      if (da < 0) start = intersection;
      else end = intersection;
    }
    path(context, [project(start), project(end)]);
    context.stroke();
  };
  context.strokeStyle = "#2b3c46";
  context.lineWidth = 0.7;
  for (let index = -24; index <= 24; index += 2) {
    line({ x: index, y: 0, z: -24 }, { x: index, y: 0, z: 30 });
    line({ x: -24, y: 0, z: index }, { x: 24, y: 0, z: index });
  }

  const surfaces: Surface[] = [];
  for (const [x, z, height] of [
    [-5, 7, 2.7],
    [0, 10, 3.6],
    [5, 7, 2.7],
    [-8, -1, 2],
    [8, -1, 2],
    [-5, -9, 2.7],
    [5, -9, 2.7],
  ]) {
    box(
      surfaces,
      { x: x - 0.45, y: 0, z: z - 0.45 },
      { x: x + 0.45, y: height, z: z + 0.45 },
      ["#38505b", "#2c414c", "#64727b"]
    );
    box(
      surfaces,
      { x: x - 0.46, y: height - 0.2, z: z - 0.46 },
      { x: x + 0.46, y: height - 0.1, z: z + 0.46 },
      ["#82939b", "#667b86", "#a1a8a9"]
    );
  }
  const insideWall =
    state.camera.x >= WALL.min.x &&
    state.camera.x <= WALL.max.x &&
    state.camera.y >= WALL.min.y &&
    state.camera.y <= WALL.max.y &&
    state.camera.z >= WALL.min.z &&
    state.camera.z <= WALL.max.z;
  box(
    surfaces,
    WALL.min,
    WALL.max,
    ["#79535e", "#543e49", "#a6797e"],
    state.wallOpacity,
    insideWall
  );

  const subjectBox = (
    min: Vec3,
    max: Vec3,
    colors: [string, string, string]
  ) => {
    const move = (point: Vec3) => ({
      x: point.x + state.subject.x,
      y: point.y + state.subject.y,
      z: point.z + state.subject.z,
    });
    box(surfaces, move(min), move(max), colors, state.opacity);
  };
  const cloth: [string, string, string] = ["#c5a36b", "#8f784f", "#e8c98d"];
  const skin: [string, string, string] = ["#efd7af", "#b99a77", "#fae7c6"];
  subjectBox(
    { x: -0.22, y: 0.72, z: -0.14 },
    { x: 0.22, y: 1.38, z: 0.18 },
    cloth
  );
  subjectBox(
    { x: -0.15, y: 1.42, z: -0.13 },
    { x: 0.15, y: 1.76, z: 0.17 },
    skin
  );
  for (const side of [-1, 1]) {
    const x = side * 0.29;
    subjectBox(
      { x: x - 0.065, y: 0.76, z: -0.08 },
      { x: x + 0.065, y: 1.31, z: 0.12 },
      cloth
    );
    const leg = side * 0.12;
    subjectBox(
      { x: leg - 0.075, y: 0.04, z: -0.1 },
      { x: leg + 0.075, y: 0.74, z: 0.14 },
      cloth
    );
  }

  const visible: CameraSurface[] = [];
  for (const surface of surfaces) {
    if (surface.opacity < 0.01) continue;
    const points = surface.points.map(cameraSpace);
    const a = subtract(points[1], points[0]);
    const b = subtract(points[2], points[0]);
    const normal = {
      x: a.y * b.z - a.z * b.y,
      y: a.z * b.x - a.x * b.z,
      z: a.x * b.y - a.y * b.x,
    };
    const length = Math.hypot(normal.x, normal.y, normal.z);
    normal.x /= length;
    normal.y /= length;
    normal.z /= length;
    const distance = dot(normal, points[0]);
    if (!surface.doubleSided && distance >= 0) continue;
    const drawn = clipPolygon(points, planes);
    if (drawn.length < 3) continue;
    visible.push({
      ...surface,
      normal,
      distance,
      points: drawn,
    });
  }
  // Fill fragments without outlines so partition cuts stay invisible.
  for (const surface of orderSurfaces(visible)) {
    context.globalAlpha = surface.opacity;
    path(context, surface.points.map(project));
    context.closePath();
    context.fillStyle = surface.color;
    context.fill();
  }
  context.globalAlpha = 1;

  context.strokeStyle = "rgba(230, 225, 210, .4)";
  context.lineWidth = 1;
  for (const offset of [-1, 1]) {
    path(context, [
      { x: width / 2 + offset * 4, y: height / 2 },
      { x: width / 2 + offset * 10, y: height / 2 },
    ]);
    context.stroke();
    path(context, [
      { x: width / 2, y: height / 2 + offset * 4 },
      { x: width / 2, y: height / 2 + offset * 10 },
    ]);
    context.stroke();
  }
  label(context, `${Math.round(settings.fov)}° vertical FOV`, 17, height - 18);
  label(context, "2 m grid", width - 17, height - 18, MUTED, "right");
}
