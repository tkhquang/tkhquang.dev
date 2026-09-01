/*
 * The masthead sky's GLSL, kept in its own module three.js ShaderChunk
 * style so the source stays out of the component.
 *
 * Any future shader gets formatted the same way, with no extra setup:
 * prefix the template literal with a block comment holding just the word
 * glsl, written spaced. prettier-plugin-embed keys on that tag and hands
 * the contents to prettier-plugin-glsl, so plain `prettier --write`
 * formats GLSL like any other code. The unspaced form does NOT match the
 * prettier plugin, though both forms light up WebGL GLSL Editor
 * (raczzalan.webgl-glsl-editor) for highlighting and glslang diagnostics.
 * A standalone .glsl/.frag/.vert file needs no tag: the plugin claims
 * those extensions directly.
 */
export const VERTEX_SHADER = /* glsl */ `
  attribute vec2 p;
  void main() {
    gl_Position = vec4(p, 0.0, 1.0);
  }
`;

/*
 * Two skies for one band. Night: three noise-driven aurora curtains with a
 * sharp lower edge fading upward, vertical ray structure, and a macro
 * envelope so bands come and go along the horizon. Day (u_day): Dawn
 * Horizon: warped-fbm pastel stratus decks with gilded under-edges, a
 * warm horizon haze, and a veiled low sun, alpha-composited over the
 * CSS dawn gradient.
 *
 * Both skies carry the Spirit Light idle program: when the pointer rests
 * for a few seconds the flare hands off to a slow two-sine wanderer and
 * dims to a wisp (u_flare), brightness breathes on 17s and 41s periods
 * (u_breath), the night sky drops a shooting star every 20 to 40 seconds,
 * and a slow veil pulse dims and re-reveals the day sun. IGN dither in
 * both branches keeps the exponential falloffs from banding.
 */
export const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;
  uniform vec2 u_res;
  uniform float u_time;
  uniform vec2 u_mouse;
  uniform vec3 u_c1;
  uniform vec3 u_c2;
  uniform vec3 u_c3;
  uniform float u_intensity;
  uniform float u_stars;
  uniform float u_day;
  uniform float u_flare;
  uniform float u_breath;
  uniform float u_dpr;
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    v += a * noise(p);
    p *= 2.03;
    a *= 0.5;
    v += a * noise(p);
    p *= 2.01;
    a *= 0.5;
    v += a * noise(p);
    return v;
  }
  float hashB(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hashB(i);
    float b = hashB(i + vec2(1.0, 0.0));
    float c = hashB(i + vec2(0.0, 1.0));
    float d = hashB(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }
  float fbm5(vec2 p) {
    float v = 0.0;
    float amp = 0.5;
    mat2 r = mat2(
       0.8, -0.6,
       0.6,  0.8
    );
    for (int i = 0; i < 5; i++) {
      v += amp * vnoise(p);
      p = r * p * 2.03;
      amp *= 0.55;
    }
    return v;
  }
  float bandsN(vec2 q, float seed, float spd) {
    vec2 p = vec2(q.x + u_time * spd + seed * 17.0, q.y + seed * 7.0);
    float w = fbm5(p * vec2(0.9, 1.4) + vec2(0.0, seed));
    return fbm5(p + vec2(0.0, (w - 0.5) * 1.4));
  }
  vec4 over(vec4 dst, vec3 src, float a) {
    a = clamp(a, 0.0, 1.0);
    float na = a + dst.a * (1.0 - a);
    vec3 nc = (src * a + dst.rgb * dst.a * (1.0 - a)) / max(na, 1e-4);
    return vec4(nc, na);
  }
  vec3 curtain(vec2 uv, float t, float fi, vec3 tint) {
    float x = uv.x * (1.1 + fi * 0.25) + fi * 2.7;
    float center =
      0.58 -
      fi * 0.14 +
      0.3 * (fbm(vec2(x * 0.7 + t * (0.5 + fi * 0.2), fi * 3.7)) - 0.5);
    float d = uv.y - center;
    float fall = d > 0.0 ? exp(-d * 4.0) : exp(d * 22.0);
    float mac = smoothstep(0.28, 0.78, fbm(vec2(x * 0.5 - t * 0.3, fi * 9.3)));
    float rays = 0.45 + 0.55 * noise(vec2(x * 26.0, uv.y * 2.0 + t * 0.6));
    float shimmer = 0.5 + 0.5 * fbm(vec2(x * 3.0 - t * 1.1, uv.y * 2.0));
    return tint * fall * mac * rays * shimmer;
  }
  /* Jimenez interleaved gradient noise: a one-line dither for the falloffs */
  float ign(vec2 p) {
    return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
  }
  void main() {
    vec2 uv = gl_FragCoord.xy / u_res;
    float t = u_time * 0.05;
    vec2 asp = vec2(u_res.x / u_res.y, 1.0);
    float md = distance(uv * asp, u_mouse * asp);
    if (u_day > 0.5) {
      float x = uv.x;
      float y = 1.0 - uv.y;
      float asp = u_res.x / u_res.y;
      vec3 GOLD = vec3(0.99, 0.84, 0.57);
      vec3 BLUSH = vec3(0.96, 0.67, 0.7);
      vec3 LAV = vec3(0.77, 0.7, 0.93);
      vec3 SUN = vec3(1.0, 0.96, 0.86);
      /* Slow occlusion envelope: a cloud drifts across the sun and it
     re-emerges; the gilded rim below flares on each return via sunw */
      float vp =
        0.55 + 0.45 * smoothstep(0.4, 0.6, noise(vec2(u_time * 0.02, 5.0)));
      vec4 acc = vec4(0.0);
      {
        vec2 q = vec2(x * asp * 0.85, y * 10.0);
        float n = bandsN(q, 3.7, 0.03);
        float m =
          smoothstep(0.5, 0.575, n) * (1.0 - smoothstep(0.575, 0.72, n));
        float env =
          smoothstep(0.02, 0.1, y) * (1.0 - smoothstep(0.38, 0.55, y));
        acc = over(acc, mix(LAV, BLUSH, 0.25), m * env * 0.62);
      }
      float sunw;
      {
        vec2 q = vec2(x * asp * 0.62, y * 6.0);
        float n = bandsN(q, 1.3, 0.018);
        float m = smoothstep(0.455, 0.525, n);
        float core = smoothstep(0.545, 0.76, n);
        float env =
          smoothstep(0.16, 0.34, y) * (1.0 - smoothstep(0.66, 0.8, y));
        vec3 c = mix(LAV, BLUSH, smoothstep(0.18, 0.45, y));
        c = mix(c, GOLD, smoothstep(0.45, 0.68, y));
        sunw =
          exp(-pow(length(vec2((x - 0.72) * asp, y - 0.74)), 2.0) * 2.5) * vp;
        c = mix(c, GOLD, sunw * 0.45);
        acc = over(acc, c, (m * 0.68 + core * 0.32) * env);
        float n2 = bandsN(vec2(q.x, q.y + 0.24), 1.3, 0.018);
        float m2 = smoothstep(0.455, 0.525, n2);
        float rim = clamp(m - m2, 0.0, 1.0);
        acc = over(acc, mix(GOLD, SUN, 0.6), rim * env * (0.35 + 0.65 * sunw));
      }
      {
        vec2 q = vec2(x * asp * 0.75, y * 7.5);
        float n = bandsN(q, 8.9, -0.012);
        float m = smoothstep(0.485, 0.555, n);
        float env = smoothstep(0.3, 0.48, y) * (1.0 - smoothstep(0.7, 0.84, y));
        vec3 c = mix(BLUSH, GOLD, smoothstep(0.4, 0.68, y));
        acc = over(acc, c, m * env * 0.58);
      }
      {
        float hz = exp(-pow((y - 0.72) * 5.5, 2.0));
        float hx = 0.55 + 0.45 * exp(-pow((x - 0.72) * asp * 0.45, 2.0));
        acc = over(acc, mix(GOLD, SUN, 0.35), hz * hx * 0.4);
      }
      {
        vec2 d = vec2((x - 0.72) * asp, (y - 0.74) * 1.2);
        float ds = dot(d, d);
        float veil =
          0.75 + 0.5 * fbm5(vec2(x * asp * 1.6 + u_time * 0.014, y * 4.5));
        float glow = exp(-ds * 3.0) * vp;
        float score = exp(-ds * 12.0) * veil * vp;
        float hot = exp(-ds * 38.0) * veil * vp;
        acc = over(acc, mix(GOLD, SUN, 0.5), glow * 0.5);
        acc = over(acc, mix(GOLD, SUN, 0.8), score * 0.6);
        acc = over(acc, vec3(1.0, 0.98, 0.92), hot * 0.7);
      }
      /*
   * The day sky answers the pointer like the night one: clouds thin where
   * you point and a patch of warm sunlight follows, a beam breaking
   * through. u_mouse is bottom-origin, y here is top-origin. When idle,
   * JS hands the target to a wanderer biased toward the sun quadrant and
   * u_flare (normalized against its pointer strength) dims the beam.
   */
      {
        float k = u_flare / 0.35;
        float mdd = distance(
          vec2(x * asp, y),
          vec2(u_mouse.x * asp, 1.0 - u_mouse.y)
        );
        float beam = exp(-mdd * mdd * 7.0);
        acc.a *= 1.0 - 0.3 * k * beam;
        acc = over(acc, mix(GOLD, SUN, 0.7), beam * 0.24 * k);
      }
      float yieldX = mix(0.4, 1.0, smoothstep(0.06, 0.56, x));
      float fadeB = 1.0 - smoothstep(0.76, 0.985, y);
      float aOut = acc.a * yieldX * fadeB * u_breath;
      acc.rgb += (ign(gl_FragCoord.xy) - 0.5) / 255.0;
      /* Premultiplied output: the site canvas keeps default alpha behavior */
      gl_FragColor = vec4(acc.rgb * aOut, aOut);
      return;
    }
    vec3 col =
      curtain(uv, t, 0.0, u_c1) +
      curtain(uv, t, 1.0, u_c2) +
      curtain(uv, t, 2.0, u_c3);
    col *= 1.0 + u_flare * exp(-md * 3.5);
    if (u_stars > 0.5) {
      /* Stars hash a CSS-pixel grid (u_dpr) so density survives DPR and
     resize; pow(hash,3.) keeps most as steady dust so only the bright
     few twinkle, and per-cell jitter breaks the grid alignment */
      vec2 sp = gl_FragCoord.xy / (u_dpr * 3.0);
      vec2 cell = floor(sp);
      float s = hash(cell);
      vec2 jit = 0.3 + 0.4 * vec2(hash(cell + 0.31), hash(cell + 0.57));
      float r = length(fract(sp) - jit);
      float mag = pow(hash(cell + 0.73), 3.0);
      float tw =
        mag > 0.3
          ? 0.55 + 0.45 * sin(u_time * (1.0 + fract(s * 13.0) * 2.0) + s * 40.0)
          : 1.0;
      col +=
        vec3(0.9, 0.95, 1.0) *
        step(0.992, s) *
        exp(-r * r * 45.0) *
        (0.18 + 0.85 * mag) *
        tw *
        (0.35 + 0.65 * uv.y);
    }
    col *= u_intensity * u_breath;
    /* Shooting star: slot-hashed so one falls every 20 to 40 seconds and
    the block is skipped outside its 0.7s life. A hot blooming head
    draws a thin trail whose luminance dies exponentially behind it, so
    the streak dissolves into the sky instead of ending on an edge.
    Distances are aspect-corrected so it stays true on wide bands. */
    float slot = floor(u_time / 30.0);
    float e = u_time - (slot + 0.35 + hash(vec2(slot, 7.0)) / 3.0) * 30.0;
    if (e > 0.0 && e < 0.7) {
      float en = e / 0.7;
      float ang = -0.5 + 0.4 * (hash(vec2(slot, 5.0)) - 0.5);
      vec2 dir = vec2(cos(ang), sin(ang));
      vec2 head =
        vec2(
          (0.15 + 0.55 * hash(vec2(slot, 3.0))) * asp.x,
          0.82 + 0.12 * hash(vec2(slot, 9.0))
        ) +
        dir * en * 0.85;
      vec2 rel = uv * asp - head;
      float lp = dot(rel, -dir);
      float pd = length(rel + dir * lp);
      float trail = exp(-max(lp, 0.0) * 8.0) * step(-0.002, lp);
      float core = exp(-pd * pd * 36000.0) * trail;
      float bloom = exp(-dot(rel, rel) * 2600.0);
      float env = pow(sin(3.14159 * en), 0.6);
      col +=
        (vec3(0.97, 0.99, 1.0) * core + vec3(0.75, 0.88, 1.0) * bloom * 0.45) *
        env;
    }
    col += vec3((ign(gl_FragCoord.xy) - 0.5) / 255.0);
    float alpha = clamp(max(col.r, max(col.g, col.b)), 0.0, 1.0);
    gl_FragColor = vec4(clamp(col, 0.0, 1.0), alpha);
  }
`;
