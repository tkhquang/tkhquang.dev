"use client";

import {
  FRAGMENT_SHADER,
  VERTEX_SHADER,
} from "@/components/blog/AuroraCanvas.glsl";
import classNames from "classnames";
import { useEffect, useRef, useState } from "react";

/* Northern lights over the dusk lakeshore; sunlight over the lapis day sky */
const PALETTES = {
  dark: {
    c1: [0.28, 0.92, 0.7],
    c2: [0.6, 0.45, 0.98],
    c3: [0.3, 0.7, 1.0],
    day: 0,
    intensity: 0.95,
    stars: 1,
  },
  light: {
    /* Only day matters: the shader's day branch returns before the
       night uniforms (c1/c2/c3, intensity, stars) are read */
    c1: [0, 0, 0],
    c2: [0, 0, 0],
    c3: [0, 0, 0],
    day: 1,
    intensity: 1.0,
    stars: 0,
  },
} as const;

const AuroraCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  /* Bumped when the GPU hands the context back after an eviction, so the
     whole effect re-runs and rebuilds the program on the restored context */
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    /* Without preventDefault on the lost event the browser never fires
       restored and the sky stays dead for the session after a GPU reset */
    const onContextLost = (event: Event) => {
      event.preventDefault();
      setReady(false);
    };
    const onContextRestored = () => {
      setGeneration((current) => current + 1);
    };
    canvas.addEventListener("webglcontextlost", onContextLost);
    canvas.addEventListener("webglcontextrestored", onContextRestored);
    const removeLossListeners = () => {
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
    };

    let context: WebGLRenderingContext | null = null;
    try {
      context = canvas.getContext("webgl", {
        alpha: true,
        antialias: false,
        powerPreference: "low-power",
      });
    } catch {
      /* no WebGL: the band gradient underneath is the fallback */
    }
    if (!context) {
      return removeLossListeners;
    }
    const gl = context;

    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) {
        return null;
      }
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      /* No COMPILE_STATUS query here: it blocks until the compile ends.
         A broken shader surfaces as LINK_STATUS false in start() below */
      return shader;
    };

    const vs = compile(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vs || !fs) {
      return removeLossListeners;
    }
    const program = gl.createProgram();
    if (!program) {
      return removeLossListeners;
    }
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    /*
     * Everything past the link waits in start(), so the main thread never
     * blocks on shader compilation. The LINK_STATUS query in start() is
     * synchronous and stalls until the compile finishes, which is long
     * enough on this shader to become the feed page's single longest task.
     * With KHR_parallel_shader_compile the driver compiles in the
     * background and a rAF poll fires start() once COMPLETION_STATUS says
     * it is done; without the extension start() runs immediately and takes
     * the stall, since there is nothing to wait on.
     */
    let rafId = 0;
    const disposers: Array<() => void> = [];

    const start = () => {
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        return;
      }
      gl.useProgram(program);

      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 3, -1, -1, 3]),
        gl.STATIC_DRAW
      );
      const position = gl.getAttribLocation(program, "p");
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

      const uniform = (name: string) => gl.getUniformLocation(program, name);
      const uRes = uniform("u_res");
      const uTime = uniform("u_time");
      const uMouse = uniform("u_mouse");
      const uC1 = uniform("u_c1");
      const uC2 = uniform("u_c2");
      const uC3 = uniform("u_c3");
      const uIntensity = uniform("u_intensity");
      const uStars = uniform("u_stars");
      const uDay = uniform("u_day");
      const uFlare = uniform("u_flare");
      const uBreath = uniform("u_breath");
      const uDpr = uniform("u_dpr");

      let isDay = false;
      const setPalette = () => {
        const theme =
          document.documentElement.getAttribute("data-theme") === "light"
            ? "light"
            : "dark";
        const palette = PALETTES[theme];
        isDay = palette.day === 1;
        gl.uniform3fv(uC1, palette.c1);
        gl.uniform3fv(uC2, palette.c2);
        gl.uniform3fv(uC3, palette.c3);
        gl.uniform1f(uIntensity, palette.intensity);
        gl.uniform1f(uStars, palette.stars);
        gl.uniform1f(uDay, palette.day);
      };

      /* 1.5x is plenty for a blurred field; full DPR just burns fill rate */
      let dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      gl.uniform1f(uDpr, dpr);
      const resize = () => {
        const { clientHeight, clientWidth } = canvas;
        if (!clientWidth || !clientHeight) {
          return;
        }
        canvas.width = Math.round(clientWidth * dpr);
        canvas.height = Math.round(clientHeight * dpr);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform2f(uRes, canvas.width, canvas.height);
      };

      const host = canvas.parentElement ?? canvas;
      /* Moves are heard one level up, on the section: the masthead text
         sits above the sky and is selectable, so it swallows every move
         that lands on it before the wrapper hears one. The flare still
         measures against the sky wrapper's own rect, since that is the
         box the canvas is laid out in and the scroll transform moves the
         two of them together. */
      const pointerHost = host.parentElement ?? host;
      let mouseX = 0.5;
      let mouseY = 0.62;
      let targetX = mouseX;
      let targetY = mouseY;
      let lastPointerMove = performance.now();
      let lastNow = performance.now();
      const onPointerMove = (event: PointerEvent) => {
        const rect = host.getBoundingClientRect();
        targetX = (event.clientX - rect.left) / rect.width;
        targetY = 1 - (event.clientY - rect.top) / rect.height;
        lastPointerMove = performance.now();
      };
      pointerHost.addEventListener("pointermove", onPointerMove);

      let visible = true;
      const observer = new IntersectionObserver((entries) => {
        visible = entries[0]?.isIntersecting ?? true;
      });
      observer.observe(host);

      const motionQuery = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      );
      let reducedMotion = motionQuery.matches;
      /* The reduced-motion still composition: 104724250ms crests both
         breathing sines (104724.25s is 6160.25 * 17 and 2554.25 * 41)
         and lands 24s into a 30s meteor slot, past every possible 0.7s
         streak window. Among such frames a float64 solve of the field
         math scores this one brightest for curtains and an unveiled
         sun; GPU float32 sin hashes reshuffle the exact layout per
         device, so on hardware that is a strong roll, not a promise. */
      const STILL_MS = 104724250;

      const drawFrame = (now: number) => {
        const t = now / 1000;
        const dt = Math.min(Math.max(now - lastNow, 0), 100);
        lastNow = now;
        /* Spirit Light idle scalar: 3s of grace, then a 4s smoothstep
           ramp. Any pointer move zeroes it within a frame. */
        const idleRaw = Math.min(
          Math.max((now - lastPointerMove - 3000) / 4000, 0),
          1
        );
        const idle = idleRaw * idleRaw * (3 - 2 * idleRaw);
        /* Two incommensurate sines never visibly loop; the day sky biases
           the patrol toward the sun quadrant, (0.72, 0.26) bottom-origin */
        let wanderX =
          0.5 + 0.3 * Math.sin(t * 0.11) + 0.12 * Math.sin(t * 0.043 + 2.1);
        let wanderY = 0.55 + 0.18 * Math.sin(t * 0.07 + 1.2);
        if (isDay) {
          wanderX += (0.72 - wanderX) * 0.55;
          wanderY += (0.26 - wanderY) * 0.55;
        }
        const flareX = targetX + (wanderX - targetX) * idle;
        const flareY = targetY + (wanderY - targetY) * idle;
        if (idle === 0) {
          /* The pointer is live again: snap back, no drift across the sky */
          mouseX = flareX;
          mouseY = flareY;
        } else {
          /* 4 percent per 60Hz frame, held to real time so a 120Hz
             display does not chase twice as fast */
          const ease = 1 - Math.pow(0.96, dt / (1000 / 60));
          mouseX += (flareX - mouseX) * ease;
          mouseY += (flareY - mouseY) * ease;
        }
        /* The flare dims from pointer strength to wisp strength as it
           detaches; breathing rides its own uniform because the day branch
           returns before the night intensity multiply */
        gl.uniform1f(uFlare, 0.35 + (0.18 - 0.35) * idle);
        gl.uniform1f(
          uBreath,
          0.88 +
            0.12 *
              (0.5 * Math.sin((t * 2 * Math.PI) / 17) +
                0.5 * Math.sin((t * 2 * Math.PI) / 41))
        );
        gl.uniform1f(uTime, t);
        gl.uniform2f(uMouse, mouseX, mouseY);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      };

      const loop = (now: number) => {
        if (visible && !document.hidden) {
          drawFrame(now);
        }
        rafId = requestAnimationFrame(loop);
      };

      resize();
      setPalette();
      /* resize() clears the drawing buffer and setPalette() only sets
         uniforms, so with no rAF loop the still must repaint by hand.
         Re-pinning lastPointerMove keeps idle at zero, so every repaint
         keeps its full-strength flare at the resting pointer. */
      const redrawStill = () => {
        if (reducedMotion) {
          lastPointerMove = STILL_MS;
          drawFrame(STILL_MS);
        }
      };
      const resizeObserver = new ResizeObserver(() => {
        resize();
        redrawStill();
      });
      resizeObserver.observe(canvas);
      const themeObserver = new MutationObserver(() => {
        setPalette();
        redrawStill();
      });
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme"],
      });

      /* A monitor drag can change devicePixelRatio without changing the
         canvas's CSS size, so no ResizeObserver fires and the buffer
         scale and star grid would go stale. A resolution media query
         hears it instead, re-armed after every change because a query
         only watches the one ratio it was built with. Browsers without
         resolution-change events just keep the mount-time ratio. */
      let dprQuery: MediaQueryList | null = null;
      const handleDprChange = () => {
        watchDpr();
        const next = Math.min(window.devicePixelRatio || 1, 1.5);
        /* Two ratios can clamp to the same 1.5; skip the buffer clear */
        if (next === dpr) {
          return;
        }
        dpr = next;
        gl.uniform1f(uDpr, dpr);
        resize();
        redrawStill();
      };
      const watchDpr = () => {
        dprQuery?.removeEventListener("change", handleDprChange);
        dprQuery = window.matchMedia(
          `(resolution: ${window.devicePixelRatio}dppx)`
        );
        if (typeof dprQuery.addEventListener !== "function") {
          /* Pre-2020 engines lack MediaQueryList events; keep the
             mount-time ratio rather than throwing mid-setup */
          dprQuery = null;
          return;
        }
        dprQuery.addEventListener("change", handleDprChange);
      };
      watchDpr();

      if (reducedMotion) {
        lastPointerMove = STILL_MS;
        drawFrame(STILL_MS);
      } else {
        rafId = requestAnimationFrame(loop);
      }
      setReady(true);

      /* The preference can flip mid-session; a one-shot read would keep
         the loop running for a reader who just asked for stillness, or
         leave a frozen frame for one who re-enabled motion */
      const onMotionChange = () => {
        reducedMotion = motionQuery.matches;
        cancelAnimationFrame(rafId);
        rafId = 0;
        if (reducedMotion) {
          lastPointerMove = STILL_MS;
          drawFrame(STILL_MS);
        } else {
          /* Unpin lastPointerMove from the still frame's far-future STILL_MS
             or idle stays clamped at zero forever and the Spirit Light
             wander never re-engages; from now, the patrol starts after the
             same 3s grace a fresh mount gets */
          lastPointerMove = performance.now();
          lastNow = performance.now();
          rafId = requestAnimationFrame(loop);
        }
      };
      if (typeof motionQuery.addEventListener === "function") {
        motionQuery.addEventListener("change", onMotionChange);
      }

      disposers.push(() => {
        pointerHost.removeEventListener("pointermove", onPointerMove);
        observer.disconnect();
        resizeObserver.disconnect();
        themeObserver.disconnect();
        dprQuery?.removeEventListener("change", handleDprChange);
        if (typeof motionQuery.removeEventListener === "function") {
          motionQuery.removeEventListener("change", onMotionChange);
        }
      });
    };

    const parallelCompile = gl.getExtension("KHR_parallel_shader_compile");
    if (parallelCompile) {
      const poll = () => {
        if (
          gl.getProgramParameter(program, parallelCompile.COMPLETION_STATUS_KHR)
        ) {
          start();
        } else {
          rafId = requestAnimationFrame(poll);
        }
      };
      rafId = requestAnimationFrame(poll);
    } else {
      start();
    }

    return () => {
      removeLossListeners();
      cancelAnimationFrame(rafId);
      for (const dispose of disposers) {
        dispose();
      }
      /* Client-side revisits would otherwise stack live contexts until
         the browser starts evicting the oldest. Only release it once the
         canvas has really left the document: React re-runs this effect on
         the same node under Strict Mode and Fast Refresh, and getContext()
         then hands back the SAME lost context, which nothing can revive.
         The sky would sit at full opacity over a dead canvas. */
      if (!canvas.isConnected) {
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      }
    };
  }, [generation]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={classNames(
        "pointer-events-none absolute inset-0 size-full",
        "transition-opacity duration-1000",
        ready ? "opacity-100" : "opacity-0"
      )}
    />
  );
};

export default AuroraCanvas;
