/** Generic camera geometry: x right, y up, z forward; distances are metres. */
export type Vec3 = { x: number; y: number; z: number };

export type RigSettings = {
  boom: number;
  pivotHeight: number;
  shoulder: number;
  stiffness: number;
  /** Damping ratio ζ, where 1 is critically damped for a stationary target. */
  damping: number;
  /** Yaw and vertical field of view are in degrees. */
  yaw: number;
  fov: number;
  lookAt: boolean;
  collision: boolean;
  fade: boolean;
};

export type RigState = {
  time: number;
  subject: Vec3;
  pivot: Vec3;
  /** Unobstructed destination, retained so the drawing can explain shortening. */
  desired: Vec3;
  camera: Vec3;
  velocity: Vec3;
  forward: Vec3;
  colliding: boolean;
  /** Whether the wall intersects the actual camera-to-pivot sightline. */
  occluded: boolean;
  wallOpacity: number;
  /** Close-subject fade is separate from an obstructing wall's fade. */
  opacity: number;
};

export const DEFAULT_SETTINGS: RigSettings = {
  boom: 4,
  pivotHeight: 1.4,
  shoulder: 0.7,
  stiffness: 36,
  damping: 0.8,
  yaw: 0,
  fov: 55,
  lookAt: true,
  collision: true,
  fade: true,
};

export const WALL = {
  min: { x: -2.6, y: 0, z: -3.3 },
  max: { x: 2.6, y: 2.6, z: -3 },
};

// Expand the wall by this clearance to keep the camera body out of contact.
export const CAMERA_MARGIN = 0.16;
const CONTACT_Z = WALL.max.z + CAMERA_MARGIN + 0.0001;
const MAX_FRAME_TIME = 0.1;
const MAX_STEP_TIME = 1 / 240;
const AXES = ["x", "y", "z"] as const;

function zero(): Vec3 {
  return { x: 0, y: 0, z: 0 };
}

function normalize(vector: Vec3): Vec3 {
  const length = Math.hypot(vector.x, vector.y, vector.z);
  if (length < 0.000001) return { x: 0, y: 0, z: 1 };
  return {
    x: vector.x / length,
    y: vector.y / length,
    z: vector.z / length,
  };
}

function subjectAt(time: number): Vec3 {
  return {
    x: 1.75 * Math.sin(time * 0.7),
    y: 0,
    z: -1.15 + 1.15 * Math.cos(time * 0.46),
  };
}

function geometry(subject: Vec3, settings: RigSettings) {
  const yaw = (settings.yaw * Math.PI) / 180;
  const pivot = {
    x: subject.x,
    y: subject.y + settings.pivotHeight,
    z: subject.z,
  };
  return {
    pivot,
    desired: {
      x:
        pivot.x -
        Math.sin(yaw) * settings.boom +
        Math.cos(yaw) * settings.shoulder,
      y: pivot.y,
      z:
        pivot.z -
        Math.cos(yaw) * settings.boom -
        Math.sin(yaw) * settings.shoulder,
    },
  };
}

/**
 * Segment/slab intersection catches fast motion across the wall's corners.
 * Collision adds camera clearance; occlusion tests only the visible wall.
 */
function intersectsWall(start: Vec3, end: Vec3, margin = 0): boolean {
  let entry = 0;
  let exit = 1;
  for (const axis of AXES) {
    const minimum = WALL.min[axis] - margin;
    const maximum = WALL.max[axis] + margin;
    const delta = end[axis] - start[axis];
    if (Math.abs(delta) < 0.0000001) {
      if (start[axis] < minimum || start[axis] > maximum) return false;
      continue;
    }
    const first = (minimum - start[axis]) / delta;
    const second = (maximum - start[axis]) / delta;
    entry = Math.max(entry, Math.min(first, second));
    exit = Math.min(exit, Math.max(first, second));
    if (entry > exit) return false;
  }
  return true;
}

/**
 * This teaching rig has one finite, axis-aligned wall and a subject on its front
 * side. Project obstruction onto that near face while retaining x/y motion.
 * This is a slide constraint, not a ray-shortened boom or a general rigid-body
 * solver. Testing both the sightline and swept camera path prevents tunnelling.
 */
function constrain(pivot: Vec3, position: Vec3, previous?: Vec3) {
  const colliding =
    intersectsWall(pivot, position, CAMERA_MARGIN) ||
    (previous !== undefined &&
      intersectsWall(previous, position, CAMERA_MARGIN));
  return {
    position: colliding ? { ...position, z: CONTACT_Z } : position,
    colliding,
  };
}

function forwardFor(camera: Vec3, pivot: Vec3, settings: RigSettings): Vec3 {
  if (settings.lookAt) {
    return normalize({
      x: pivot.x - camera.x,
      y: pivot.y - camera.y,
      z: pivot.z - camera.z,
    });
  }
  // Locked yaw follows the rig's horizontal heading, independent of arm lag.
  const yaw = (settings.yaw * Math.PI) / 180;
  return { x: Math.sin(yaw), y: 0, z: Math.cos(yaw) };
}

function opacityFor(
  camera: Vec3,
  subject: Vec3,
  settings: RigSettings
): number {
  if (!settings.fade) return 1;
  // Distance to the standing subject's centre: compression makes it translucent.
  const distance = Math.hypot(
    camera.x - subject.x,
    camera.y - (subject.y + 1),
    camera.z - subject.z
  );
  const amount = Math.max(0, Math.min(1, (distance - 0.45) / 1.15));
  return 0.16 + 0.84 * amount * amount * (3 - 2 * amount);
}

/** Resolve edits immediately while paused, retaining the current path position. */
export function settleRig(state: RigState, settings: RigSettings): RigState {
  const { pivot, desired } = geometry(state.subject, settings);
  const solution = settings.collision
    ? constrain(pivot, desired)
    : { position: desired, colliding: false };
  const occluded = intersectsWall(solution.position, pivot);
  return {
    ...state,
    pivot,
    desired,
    camera: solution.position,
    velocity: zero(),
    forward: forwardFor(solution.position, pivot, settings),
    colliding: solution.colliding,
    occluded,
    wallOpacity: settings.fade && occluded ? 0.18 : 1,
    opacity: opacityFor(solution.position, state.subject, settings),
  };
}

export function createRig(settings: RigSettings = DEFAULT_SETTINGS): RigState {
  return settleRig(
    {
      time: 0,
      subject: zero(),
      pivot: zero(),
      desired: zero(),
      camera: zero(),
      velocity: zero(),
      forward: { x: 0, y: 0, z: 1 },
      colliding: false,
      occluded: false,
      wallOpacity: 1,
      opacity: 1,
    },
    settings
  );
}

/**
 * Unit-mass spring: acceleration = k(target-position) - 2ζ√k velocity.
 * Semi-implicit integration uses at most 1/240 s per step. Long frames are
 * capped at 100 ms so returning from a background tab cannot launch the rig.
 * `moving=false` freezes the subject's clock while allowing the arm to settle.
 */
export function stepRig(
  state: RigState,
  settings: RigSettings,
  dt: number,
  moving: boolean
): RigState {
  const elapsed = Number.isFinite(dt)
    ? Math.max(0, Math.min(MAX_FRAME_TIME, dt))
    : 0;
  const count = Math.max(1, Math.ceil(elapsed / MAX_STEP_TIME));
  const step = elapsed / count;
  const stiffness = Math.max(1, Math.min(200, settings.stiffness));
  const damping =
    2 * Math.max(0.05, Math.min(3, settings.damping)) * Math.sqrt(stiffness);
  let current = state;

  for (let iteration = 0; iteration < count; iteration += 1) {
    const time = current.time + (moving ? step : 0);
    const subject = moving ? subjectAt(time) : current.subject;
    const { pivot, desired } = geometry(subject, settings);
    const target = settings.collision
      ? constrain(pivot, desired)
      : { position: desired, colliding: false };
    // Resolve newly enabled collision and a moving sightline before the spring.
    const start = settings.collision
      ? constrain(pivot, current.camera)
      : { position: current.camera, colliding: false };
    const velocity = { ...current.velocity };
    if (start.colliding) velocity.z = Math.max(0, velocity.z);
    const candidate = { ...start.position };
    for (const axis of AXES) {
      velocity[axis] +=
        (stiffness * (target.position[axis] - start.position[axis]) -
          damping * velocity[axis]) *
        step;
      candidate[axis] += velocity[axis] * step;
    }
    const solution = settings.collision
      ? constrain(pivot, candidate, start.position)
      : { position: candidate, colliding: false };
    if (solution.colliding) velocity.z = Math.max(0, velocity.z);
    const opacity = opacityFor(solution.position, subject, settings);
    const occluded = intersectsWall(solution.position, pivot);
    const wallOpacity = settings.fade && occluded ? 0.18 : 1;
    const blend = -Math.expm1(-10 * step);
    current = {
      time,
      subject,
      pivot,
      desired,
      camera: solution.position,
      velocity,
      forward: forwardFor(solution.position, pivot, settings),
      colliding: target.colliding || start.colliding || solution.colliding,
      occluded,
      wallOpacity: settings.fade
        ? current.wallOpacity + (wallOpacity - current.wallOpacity) * blend
        : 1,
      opacity: settings.fade
        ? current.opacity + (opacity - current.opacity) * blend
        : 1,
    };
  }
  return current;
}
