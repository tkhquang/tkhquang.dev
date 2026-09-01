"use client";

import classNames from "classnames";
import { useEffect, useRef, useState } from "react";

const VERTEX_SHADER =
  "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";

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
const FRAGMENT_SHADER = `
precision highp float;
uniform vec2 u_res;uniform float u_time;uniform vec2 u_mouse;
uniform vec3 u_c1;uniform vec3 u_c2;uniform vec3 u_c3;
uniform float u_intensity;uniform float u_stars;uniform float u_day;
uniform float u_flare;uniform float u_breath;uniform float u_dpr;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float v=0.;float a=.5;
 v+=a*noise(p);p*=2.03;a*=.5;
 v+=a*noise(p);p*=2.01;a*=.5;
 v+=a*noise(p);return v;}
float hashB(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float vnoise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);vec2 u=f*f*(3.-2.*f);
 float a=hashB(i);float b=hashB(i+vec2(1.,0.));float c=hashB(i+vec2(0.,1.));float d=hashB(i+vec2(1.,1.));
 return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);}
float fbm5(vec2 p){float v=0.;float amp=.5;mat2 r=mat2(.8,-.6,.6,.8);
 for(int i=0;i<5;i++){v+=amp*vnoise(p);p=r*p*2.03;amp*=.55;}
 return v;}
float bandsN(vec2 q,float seed,float spd){
 vec2 p=vec2(q.x+u_time*spd+seed*17.,q.y+seed*7.);
 float w=fbm5(p*vec2(.9,1.4)+vec2(0.,seed));
 return fbm5(p+vec2(0.,(w-.5)*1.4));}
vec4 over(vec4 dst,vec3 src,float a){
 a=clamp(a,0.,1.);
 float na=a+dst.a*(1.-a);
 vec3 nc=(src*a+dst.rgb*dst.a*(1.-a))/max(na,1e-4);
 return vec4(nc,na);}
vec3 curtain(vec2 uv,float t,float fi,vec3 tint){
 float x=uv.x*(1.1+fi*.25)+fi*2.7;
 float center=.58-fi*.14+.3*(fbm(vec2(x*.7+t*(.5+fi*.2),fi*3.7))-.5);
 float d=uv.y-center;
 float fall=d>0.?exp(-d*4.):exp(d*22.);
 float mac=smoothstep(.28,.78,fbm(vec2(x*.5-t*.3,fi*9.3)));
 float rays=.45+.55*noise(vec2(x*26.,uv.y*2.+t*.6));
 float shimmer=.5+.5*fbm(vec2(x*3.-t*1.1,uv.y*2.));
 return tint*fall*mac*rays*shimmer;}
/* Jimenez interleaved gradient noise: a one-line dither for the falloffs */
float ign(vec2 p){return fract(52.9829189*fract(dot(p,vec2(0.06711056,0.00583715))));}
void main(){
 vec2 uv=gl_FragCoord.xy/u_res;
 float t=u_time*.05;
 vec2 asp=vec2(u_res.x/u_res.y,1.);
 float md=distance(uv*asp,u_mouse*asp);
 if(u_day>.5){
  float x=uv.x;
  float y=1.-uv.y;
  float asp=u_res.x/u_res.y;
  vec3 GOLD=vec3(.99,.84,.57);
  vec3 BLUSH=vec3(.96,.67,.7);
  vec3 LAV=vec3(.77,.7,.93);
  vec3 SUN=vec3(1.,.96,.86);
  /* Slow occlusion envelope: a cloud drifts across the sun and it
     re-emerges; the gilded rim below flares on each return via sunw */
  float vp=.55+.45*smoothstep(.4,.6,noise(vec2(u_time*.02,5.)));
  vec4 acc=vec4(0.);
  {
   vec2 q=vec2(x*asp*.85,y*10.);
   float n=bandsN(q,3.7,.03);
   float m=smoothstep(.5,.575,n)*(1.-smoothstep(.575,.72,n));
   float env=smoothstep(.02,.1,y)*(1.-smoothstep(.38,.55,y));
   acc=over(acc,mix(LAV,BLUSH,.25),m*env*.62);
  }
  float sunw;
  {
   vec2 q=vec2(x*asp*.62,y*6.);
   float n=bandsN(q,1.3,.018);
   float m=smoothstep(.455,.525,n);
   float core=smoothstep(.545,.76,n);
   float env=smoothstep(.16,.34,y)*(1.-smoothstep(.66,.8,y));
   vec3 c=mix(LAV,BLUSH,smoothstep(.18,.45,y));
   c=mix(c,GOLD,smoothstep(.45,.68,y));
   sunw=exp(-pow(length(vec2((x-.72)*asp,y-.74)),2.)*2.5)*vp;
   c=mix(c,GOLD,sunw*.45);
   acc=over(acc,c,(m*.68+core*.32)*env);
   float n2=bandsN(vec2(q.x,q.y+.24),1.3,.018);
   float m2=smoothstep(.455,.525,n2);
   float rim=clamp(m-m2,0.,1.);
   acc=over(acc,mix(GOLD,SUN,.6),rim*env*(.35+.65*sunw));
  }
  {
   vec2 q=vec2(x*asp*.75,y*7.5);
   float n=bandsN(q,8.9,-.012);
   float m=smoothstep(.485,.555,n);
   float env=smoothstep(.3,.48,y)*(1.-smoothstep(.7,.84,y));
   vec3 c=mix(BLUSH,GOLD,smoothstep(.4,.68,y));
   acc=over(acc,c,m*env*.58);
  }
  {
   float hz=exp(-pow((y-.72)*5.5,2.));
   float hx=.55+.45*exp(-pow((x-.72)*asp*.45,2.));
   acc=over(acc,mix(GOLD,SUN,.35),hz*hx*.4);
  }
  {
   vec2 d=vec2((x-.72)*asp,(y-.74)*1.2);
   float ds=dot(d,d);
   float veil=.75+.5*fbm5(vec2(x*asp*1.6+u_time*.014,y*4.5));
   float glow=exp(-ds*3.)*vp;
   float score=exp(-ds*12.)*veil*vp;
   float hot=exp(-ds*38.)*veil*vp;
   acc=over(acc,mix(GOLD,SUN,.5),glow*.5);
   acc=over(acc,mix(GOLD,SUN,.8),score*.6);
   acc=over(acc,vec3(1.,.98,.92),hot*.7);
  }
  /*
   * The day sky answers the pointer like the night one: clouds thin where
   * you point and a patch of warm sunlight follows, a beam breaking
   * through. u_mouse is bottom-origin, y here is top-origin. When idle,
   * JS hands the target to a wanderer biased toward the sun quadrant and
   * u_flare (normalized against its pointer strength) dims the beam.
   */
  {
   float k=u_flare/.35;
   float mdd=distance(vec2(x*asp,y),vec2(u_mouse.x*asp,1.-u_mouse.y));
   float beam=exp(-mdd*mdd*7.);
   acc.a*=1.-.3*k*beam;
   acc=over(acc,mix(GOLD,SUN,.7),beam*.24*k);
  }
  float yieldX=mix(.4,1.,smoothstep(.06,.56,x));
  float fadeB=1.-smoothstep(.76,.985,y);
  float aOut=acc.a*yieldX*fadeB*u_breath;
  acc.rgb+=(ign(gl_FragCoord.xy)-.5)/255.;
  /* Premultiplied output: the site canvas keeps default alpha behavior */
  gl_FragColor=vec4(acc.rgb*aOut,aOut);
  return;
 }
 vec3 col=curtain(uv,t,0.,u_c1)+curtain(uv,t,1.,u_c2)+curtain(uv,t,2.,u_c3);
 col*=1.+u_flare*exp(-md*3.5);
 if(u_stars>.5){
  /* Stars hash a CSS-pixel grid (u_dpr) so density survives DPR and
     resize; pow(hash,3.) keeps most as steady dust so only the bright
     few twinkle, and per-cell jitter breaks the grid alignment */
  vec2 sp=gl_FragCoord.xy/(u_dpr*3.);
  vec2 cell=floor(sp);
  float s=hash(cell);
  vec2 jit=.3+.4*vec2(hash(cell+.31),hash(cell+.57));
  float r=length(fract(sp)-jit);
  float mag=pow(hash(cell+.73),3.);
  float tw=mag>.3? .55+.45*sin(u_time*(1.+fract(s*13.)*2.)+s*40.):1.;
  col+=vec3(.9,.95,1.)*step(.992,s)*exp(-r*r*45.)*(.18+.85*mag)*tw*(.35+.65*uv.y);}
 col*=u_intensity*u_breath;
 /* Shooting star: slot-hashed so one falls every 20 to 40 seconds and
    the block is skipped outside its 0.7s life. A hot blooming head
    draws a thin trail whose luminance dies exponentially behind it, so
    the streak dissolves into the sky instead of ending on an edge.
    Distances are aspect-corrected so it stays true on wide bands. */
 float slot=floor(u_time/30.);
 float e=u_time-(slot+.35+hash(vec2(slot,7.))/3.)*30.;
 if(e>0.&&e<.7){
  float en=e/.7;
  float ang=-.50+.4*(hash(vec2(slot,5.))-.5);
  vec2 dir=vec2(cos(ang),sin(ang));
  vec2 head=vec2((.15+.55*hash(vec2(slot,3.)))*asp.x,.82+.12*hash(vec2(slot,9.)))+dir*en*.85;
  vec2 rel=uv*asp-head;
  float lp=dot(rel,-dir);
  float pd=length(rel+dir*lp);
  float trail=exp(-max(lp,0.)*8.)*step(-.002,lp);
  float core=exp(-pd*pd*36000.)*trail;
  float bloom=exp(-dot(rel,rel)*2600.);
  float env=pow(sin(3.14159*en),.6);
  col+=(vec3(.97,.99,1.)*core+vec3(.75,.88,1.)*bloom*.45)*env;}
 col+=vec3((ign(gl_FragCoord.xy)-.5)/255.);
 float alpha=clamp(max(col.r,max(col.g,col.b)),0.,1.);
 gl_FragColor=vec4(clamp(col,0.,1.),alpha);}
`;

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
      /* No COMPILE_STATUS query here: it blocks until the compile ends.
         A broken shader surfaces as LINK_STATUS false in start() below */
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

    /*
     * Everything past the link waits in start() so the main thread never
     * blocks on shader compilation: the synchronous status query below
     * stalls until the compile finishes, and in Lighthouse traces that
     * stall was the feed page's one long task (2.4s of its TBT). With
     * KHR_parallel_shader_compile the driver compiles in the background
     * and a rAF poll fires start() once it is done; without the
     * extension start() runs at once, exactly the old path.
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
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
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
      let mouseX = 0.5;
      let mouseY = 0.62;
      let targetX = mouseX;
      let targetY = mouseY;
      let lastPointerMove = performance.now();
      const onPointerMove = (event: PointerEvent) => {
        const rect = host.getBoundingClientRect();
        targetX = (event.clientX - rect.left) / rect.width;
        targetY = 1 - (event.clientY - rect.top) / rect.height;
        lastPointerMove = performance.now();
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
      /* The reduced-motion still composition: 174250ms crests both
         breathing sines (174.25s is 10.25 * 17 and 4.25 * 41) and lands
         24s into a 30s meteor slot, past every possible 0.7s streak
         window, so the frame never freezes a meteor mid-fall. */
      const STILL_MS = 174250;

      const drawFrame = (now: number) => {
        const t = now / 1000;
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
          mouseX += (flareX - mouseX) * 0.04;
          mouseY += (flareY - mouseY) * 0.04;
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

      if (reducedMotion) {
        lastPointerMove = STILL_MS;
        drawFrame(STILL_MS);
      } else {
        rafId = requestAnimationFrame(loop);
      }
      setReady(true);

      disposers.push(() => {
        host.removeEventListener("pointermove", onPointerMove);
        observer.disconnect();
        resizeObserver.disconnect();
        themeObserver.disconnect();
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
      cancelAnimationFrame(rafId);
      for (const dispose of disposers) {
        dispose();
      }
      /* Client-side revisits would otherwise stack live contexts until
         the browser starts evicting the oldest */
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={classNames(
        "pointer-events-none absolute inset-0 size-full",
        "light:mix-blend-normal mix-blend-screen",
        "transition-opacity duration-1000",
        ready ? "opacity-100" : "opacity-0",
        className
      )}
    />
  );
};

export default AuroraCanvas;
