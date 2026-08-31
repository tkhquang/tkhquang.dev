"use client";

import classNames from "classnames";
import { useEffect, useRef, useState } from "react";

const VERTEX_SHADER = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";

/*
 * Procedural aurora: three noise-driven curtains with a sharp lower edge
 * fading upward, vertical ray structure, and a macro envelope so bands come
 * and go along the horizon instead of spanning the full width.
 */
const FRAGMENT_SHADER = `
precision highp float;
uniform vec2 u_res;uniform float u_time;uniform vec2 u_mouse;
uniform vec3 u_c1;uniform vec3 u_c2;uniform vec3 u_c3;
uniform float u_intensity;uniform float u_stars;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float v=0.;float a=.5;
 v+=a*noise(p);p*=2.03;a*=.5;
 v+=a*noise(p);p*=2.01;a*=.5;
 v+=a*noise(p);return v;}
vec3 curtain(vec2 uv,float t,float fi,vec3 tint){
 float x=uv.x*(1.1+fi*.25)+fi*2.7;
 float center=.58-fi*.14+.3*(fbm(vec2(x*.7+t*(.5+fi*.2),fi*3.7))-.5);
 float d=uv.y-center;
 float fall=d>0.?exp(-d*4.):exp(d*22.);
 float mac=smoothstep(.28,.78,fbm(vec2(x*.5-t*.3,fi*9.3)));
 float rays=.45+.55*noise(vec2(x*26.,uv.y*2.+t*.6));
 float shimmer=.5+.5*fbm(vec2(x*3.-t*1.1,uv.y*2.));
 return tint*fall*mac*rays*shimmer;}
void main(){
 vec2 uv=gl_FragCoord.xy/u_res;
 float t=u_time*.05;
 vec3 col=curtain(uv,t,0.,u_c1)+curtain(uv,t,1.,u_c2)+curtain(uv,t,2.,u_c3);
 vec2 asp=vec2(u_res.x/u_res.y,1.);
 float md=distance(uv*asp,u_mouse*asp);
 col*=1.+.35*exp(-md*3.5);
 if(u_stars>.5){
  vec2 sp=floor(gl_FragCoord.xy/2.);
  float s=hash(sp);
  float tw=step(.9985,s)*(.55+.45*sin(u_time*(1.+fract(s*13.)*2.)+s*40.));
  col+=vec3(.9,.95,1.)*tw*(.35+.65*uv.y);}
 col*=u_intensity;
 float alpha=clamp(max(col.r,max(col.g,col.b)),0.,1.);
 gl_FragColor=vec4(min(col,vec3(1.)),alpha);}
`;

/* Northern lights over the dusk lakeshore; day-sky shafts on light paper */
const PALETTES = {
  dark: {
    c1: [0.28, 0.92, 0.7],
    c2: [0.6, 0.45, 0.98],
    c3: [0.3, 0.7, 1.0],
    intensity: 0.95,
    stars: 1,
  },
  light: {
    c1: [1.0, 0.88, 0.55],
    c2: [0.55, 0.9, 1.0],
    c3: [0.75, 0.68, 1.0],
    intensity: 0.85,
    stars: 0,
  },
} as const;

const AuroraCanvas = ({ className }: { className?: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

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
      return;
    }
    const gl = context;

    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) {
        return null;
      }
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        return null;
      }
      return shader;
    };

    const vs = compile(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vs || !fs) {
      return;
    }
    const program = gl.createProgram();
    if (!program) {
      return;
    }
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
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

    const setPalette = () => {
      const theme =
        document.documentElement.getAttribute("data-theme") === "light"
          ? "light"
          : "dark";
      const palette = PALETTES[theme];
      gl.uniform3fv(uC1, palette.c1);
      gl.uniform3fv(uC2, palette.c2);
      gl.uniform3fv(uC3, palette.c3);
      gl.uniform1f(uIntensity, palette.intensity);
      gl.uniform1f(uStars, palette.stars);
    };

    /* 1.5x is plenty for a blurred field; full DPR just burns fill rate */
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
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
    let mouseX = 0.5;
    let mouseY = 0.62;
    let targetX = mouseX;
    let targetY = mouseY;
    const onPointerMove = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      targetX = (event.clientX - rect.left) / rect.width;
      targetY = 1 - (event.clientY - rect.top) / rect.height;
    };
    host.addEventListener("pointermove", onPointerMove);

    let visible = true;
    const observer = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? true;
    });
    observer.observe(host);

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const drawFrame = (now: number) => {
      mouseX += (targetX - mouseX) * 0.04;
      mouseY += (targetY - mouseY) * 0.04;
      gl.uniform1f(uTime, now / 1000);
      gl.uniform2f(uMouse, mouseX, mouseY);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    let rafId = 0;
    const loop = (now: number) => {
      if (visible && !document.hidden) {
        drawFrame(now);
      }
      rafId = requestAnimationFrame(loop);
    };

    resize();
    setPalette();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const themeObserver = new MutationObserver(setPalette);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    if (reducedMotion) {
      /* One still composition; the time value just picks a pleasant frame */
      drawFrame(13700);
    } else {
      rafId = requestAnimationFrame(loop);
    }
    setReady(true);

    return () => {
      cancelAnimationFrame(rafId);
      host.removeEventListener("pointermove", onPointerMove);
      observer.disconnect();
      resizeObserver.disconnect();
      themeObserver.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={classNames(
        "pointer-events-none absolute inset-0 size-full mix-blend-screen",
        "transition-opacity duration-1000",
        ready ? "opacity-100" : "opacity-0",
        className
      )}
    />
  );
};

export default AuroraCanvas;
