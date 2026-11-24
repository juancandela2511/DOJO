<template>
  <div
    ref="containerRef"
    class="absolute inset-0 w-full h-full overflow-hidden select-none cursor-grab active:cursor-grabbing"
    style="background: linear-gradient(180deg, #070a14 0%, #0e1529 36%, #253458 50%, #0b192e 54%, #050b16 100%);"
  >
    <canvas ref="oceanCanvasRef" class="absolute inset-0 w-full h-full block"></canvas>
    <canvas ref="petalsCanvasRef" class="absolute inset-0 w-full h-full block pointer-events-none"></canvas>
    <div
      class="absolute inset-0 pointer-events-none"
      style="background: radial-gradient(circle at 50% 50%, rgba(7, 10, 20, 0.04) 0%, rgba(5, 8, 16, 0.40) 100%);"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

interface SeaPetal {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  swayAmp: number;
  swaySpeed: number;
  swayOffset: number;
  rotation: number;
  rotationSpeed: number;
  flip: number;
  flipSpeed: number;
  opacity: number;
  color: string;
  depth: number;
}

const containerRef = ref<HTMLDivElement | null>(null);
const oceanCanvasRef = ref<HTMLCanvasElement | null>(null);
const petalsCanvasRef = ref<HTMLCanvasElement | null>(null);

const VERTEX_SHADER_SOURCE = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER_SOURCE = `
  precision highp float;
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec2 u_mouse;
  uniform float u_ripple;

  const vec3 MOON_DIR = vec3(0.42, 0.29, 0.859);

  float hash(vec2 p) {
    float h = dot(p, vec2(127.1, 311.7));
    return fract(sin(h) * 43758.5453123);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return -1.0 + 2.0 * mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }
  float noise01(vec2 p) { return 0.5 + 0.5 * noise(p); }
  float seaOctave(vec2 uv, float choppy) {
    uv += noise(uv);
    vec2 wv = 1.0 - abs(sin(uv));
    vec2 swv = abs(cos(uv));
    wv = mix(wv, swv, wv);
    return pow(1.0 - pow(wv.x * wv.y, 0.65), choppy);
  }
  float mapOceanGeometry(vec3 p, float t, vec2 cursorWorld, float rippleStrength) {
    float freq = 0.19; float amp = 0.50; float choppy = 3.5;
    vec2 uv = p.xz; uv.x *= 0.78;
    mat2 octaveMat = mat2(1.6, 1.2, -1.2, 1.6);
    float d = 0.0; float h = 0.0;
    for (int i = 0; i < 3; i++) {
      d = seaOctave((uv + t * 0.80) * freq, choppy);
      d += seaOctave((uv - t * 0.70) * freq, choppy);
      h += d * amp; uv *= octaveMat; freq *= 1.92; amp *= 0.23;
      choppy = mix(choppy, 1.0, 0.2);
    }
    float distCursor = length(p.xz - cursorWorld);
    float wake = sin(distCursor * 3.0 - t * 4.8) * exp(-distCursor * 0.22) * (0.06 + rippleStrength * 0.14);
    return p.y - (h + wake);
  }
  float mapOceanDetailed(vec3 p, float t, vec2 cursorWorld, float rippleStrength) {
    float freq = 0.19; float amp = 0.50; float choppy = 3.5;
    vec2 uv = p.xz; uv.x *= 0.78;
    mat2 octaveMat = mat2(1.6, 1.2, -1.2, 1.6);
    float d = 0.0; float h = 0.0;
    for (int i = 0; i < 7; i++) {
      d = seaOctave((uv + t * 0.80) * freq, choppy);
      d += seaOctave((uv - t * 0.70) * freq, choppy);
      h += d * amp; uv *= octaveMat; freq *= 1.92; amp *= 0.23;
      choppy = mix(choppy, 1.0, 0.2);
    }
    float distCursor = length(p.xz - cursorWorld);
    float wake = sin(distCursor * 3.0 - t * 4.8) * exp(-distCursor * 0.22) * (0.06 + rippleStrength * 0.14);
    return p.y - (h + wake);
  }
  vec3 getOceanNormal(vec3 p, float eps, float t, vec2 cursorWorld, float rippleStrength) {
    vec3 n;
    n.y = mapOceanDetailed(p, t, cursorWorld, rippleStrength);
    n.x = mapOceanDetailed(vec3(p.x + eps, p.y, p.z), t, cursorWorld, rippleStrength) - n.y;
    n.z = mapOceanDetailed(vec3(p.x, p.y, p.z + eps), t, cursorWorld, rippleStrength) - n.y;
    n.y = eps;
    return normalize(n);
  }
  vec3 getMoonlitSkyColor(vec3 e, float t, bool includeDisk) {
    vec3 moonDir = normalize(MOON_DIR);
    float y = max(e.y, 0.0);
    vec3 zenith = vec3(0.027, 0.039, 0.078);
    vec3 midSky = vec3(0.055, 0.082, 0.161);
    vec3 horizon = vec3(0.145, 0.204, 0.345);
    vec3 sky = mix(horizon, midSky, pow(y, 0.52));
    sky = mix(sky, zenith, pow(y, 1.25));
    float moonDot = max(dot(e, moonDir), 0.0);
    sky += vec3(0.45, 0.58, 0.85) * pow(moonDot, 10.0) * 0.35;
    sky += vec3(0.82, 0.88, 1.00) * pow(moonDot, 48.0) * 0.55;
    if (includeDisk) {
      float diskMask = smoothstep(0.9978, 0.9986, moonDot);
      sky = mix(sky, vec3(0.95, 0.97, 1.00), diskMask * 0.94);
    }
    return sky;
  }
  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
    float t = u_time * 0.42;
    vec3 moonDir = normalize(MOON_DIR);
    float camYaw = u_mouse.x * 0.22;
    float camPitch = -0.05 + u_mouse.y * 0.10;
    vec3 ro = vec3(u_mouse.x * 1.1, 3.2 + u_mouse.y * 0.32, t * 1.15);
    vec3 rd = normalize(vec3(uv.x, uv.y + camPitch, 1.45));
    float cy = cos(camYaw); float sy = sin(camYaw);
    rd.xz = mat2(cy, -sy, sy, cy) * rd.xz;
    vec3 skyColor = getMoonlitSkyColor(rd, t, true);
    if (rd.y > 0.04) { gl_FragColor = vec4(skyColor, 1.0); return; }
    vec2 cursorWorld = ro.xz + vec2(u_mouse.x * 9.0, 12.0 - u_mouse.y * 5.0);
    float tm = 0.0; float tx = 140.0;
    float hx = mapOceanGeometry(ro + rd * tx, t, cursorWorld, u_ripple);
    if (hx > 0.0) { gl_FragColor = vec4(skyColor, 1.0); return; }
    float hm = mapOceanGeometry(ro + rd * tm, t, cursorWorld, u_ripple);
    float tmid = 0.0;
    for (int i = 0; i < 8; i++) {
      tmid = mix(tm, tx, hm / (hm - hx));
      float hmid = mapOceanGeometry(ro + rd * tmid, t, cursorWorld, u_ripple);
      if (hmid < 0.0) { tx = tmid; hx = hmid; } else { tm = tmid; hm = hmid; }
    }
    vec3 hitPos = ro + rd * tmid;
    float dist = tmid;
    float eps = max(0.015, dist * dist * 0.00055);
    vec3 n = getOceanNormal(hitPos, eps, t, cursorWorld, u_ripple);
    vec3 deepWater = vec3(0.02, 0.05, 0.11);
    vec3 shallowWater = vec3(0.07, 0.16, 0.28);
    float fresnel = pow(clamp(1.0 - dot(n, -rd), 0.0, 1.0), 3.5) * 0.85 + 0.06;
    vec3 reflDir = reflect(rd, n); reflDir.y = max(reflDir.y, 0.01);
    vec3 reflectedSky = getMoonlitSkyColor(reflDir, t, false);
    float crestHeight = clamp((hitPos.y - 0.35) * 0.9, 0.0, 1.0);
    vec3 waterColor = mix(mix(deepWater, shallowWater, crestHeight), reflectedSky, fresnel);
    vec3 halfVec = normalize(moonDir - rd);
    waterColor += vec3(0.62, 0.74, 0.95) * pow(max(dot(n, halfVec), 0.0), 55.0) * 0.48;
    waterColor += vec3(0.96, 0.92, 0.98) * pow(max(dot(n, halfVec), 0.0), 380.0) * 1.45;
    vec3 horizonFogColor = getMoonlitSkyColor(normalize(vec3(rd.x, 0.01, rd.z)), t, false);
    gl_FragColor = vec4(mix(waterColor, horizonFogColor, clamp(pow(dist / 125.0, 1.35), 0.0, 1.0)), 1.0);
  }
`;

let gl: WebGLRenderingContext | null = null;
let petalsCtx: CanvasRenderingContext2D | null = null;
let program: WebGLProgram | null = null;
let resolutionLoc: WebGLUniformLocation | null = null;
let timeLoc: WebGLUniformLocation | null = null;
let mouseLoc: WebGLUniformLocation | null = null;
let rippleLoc: WebGLUniformLocation | null = null;
let animationFrameId: number | null = null;
let resizeObserver: ResizeObserver | null = null;
const startTime = performance.now();

let viewWidth = 1200;
let viewHeight = 800;
let petals: SeaPetal[] = [];
const petalPalette = ['#fde2eb', '#fbd0e0', '#fff1f5', '#f8bbd0', '#e8eaf6'];

let targetMouseX = 0;
let targetMouseY = 0;
let currentMouseX = 0;
let currentMouseY = 0;
let rippleBoost = 0;

function onWindowMouseMove(e: MouseEvent): void {
  const w = window.innerWidth || 1;
  const h = window.innerHeight || 1;
  targetMouseX = ((e.clientX / w - 0.5) * 2) * 0.85;
  targetMouseY = ((0.5 - e.clientY / h) * 2) * 0.85;
  rippleBoost = Math.min(1.0, rippleBoost + 0.05);
}

function createPetal(randomY: boolean): SeaPetal {
  const depth = 0.45 + Math.random() * 0.9;
  return {
    x: Math.random() * (viewWidth + 200) - 100,
    y: randomY ? Math.random() * viewHeight : -24 - Math.random() * 60,
    size: (5.5 + Math.random() * 7.5) * depth,
    speedY: (0.42 + Math.random() * 0.80) * depth,
    speedX: (-0.32 - Math.random() * 0.52) * depth,
    swayAmp: 0.35 + Math.random() * 0.72,
    swaySpeed: 0.012 + Math.random() * 0.02,
    swayOffset: Math.random() * Math.PI * 2,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.024,
    flip: Math.random() * Math.PI,
    flipSpeed: 0.02 + Math.random() * 0.03,
    opacity: Math.min(0.92, 0.32 + depth * 0.44),
    color: petalPalette[Math.floor(Math.random() * petalPalette.length)],
    depth,
  };
}

function resizeCanvas(): void {
  if (!containerRef.value || !oceanCanvasRef.value || !petalsCanvasRef.value) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  viewWidth = containerRef.value.clientWidth || window.innerWidth;
  viewHeight = containerRef.value.clientHeight || window.innerHeight;
  oceanCanvasRef.value.width = Math.floor(viewWidth * dpr);
  oceanCanvasRef.value.height = Math.floor(viewHeight * dpr);
  gl?.viewport(0, 0, oceanCanvasRef.value.width, oceanCanvasRef.value.height);
  petalsCanvasRef.value.width = Math.floor(viewWidth * dpr);
  petalsCanvasRef.value.height = Math.floor(viewHeight * dpr);
  petalsCtx?.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function renderLoop(): void {
  currentMouseX += (targetMouseX - currentMouseX) * 0.05;
  currentMouseY += (targetMouseY - currentMouseY) * 0.05;
  rippleBoost *= 0.95;

  const elapsedSeconds = (performance.now() - startTime) / 1000;
  if (gl && program && oceanCanvasRef.value) {
    gl.uniform2f(resolutionLoc, oceanCanvasRef.value.width, oceanCanvasRef.value.height);
    gl.uniform1f(timeLoc, elapsedSeconds);
    gl.uniform2f(mouseLoc, currentMouseX, currentMouseY);
    gl.uniform1f(rippleLoc, rippleBoost);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  if (petalsCtx) {
    petalsCtx.clearRect(0, 0, viewWidth, viewHeight);
    for (let i = 0; i < petals.length; i++) {
      const p = petals[i];
      p.swayOffset += p.swaySpeed;
      p.x += p.speedX + Math.sin(p.swayOffset) * p.swayAmp + currentMouseX * 0.85 * p.depth;
      p.y += p.speedY;
      p.rotation += p.rotationSpeed;
      p.flip += p.flipSpeed;
      if (p.y > viewHeight + 30 || p.x < -80 || p.x > viewWidth + 120) {
        petals[i] = createPetal(false);
        continue;
      }
      const scaleY = 0.45 + Math.abs(Math.cos(p.flip)) * 0.55;
      petalsCtx.save();
      petalsCtx.translate(p.x, p.y);
      petalsCtx.rotate(p.rotation);
      petalsCtx.scale(1, scaleY);
      petalsCtx.globalAlpha = p.opacity;
      const s = p.size;
      petalsCtx.beginPath();
      petalsCtx.moveTo(0, -s);
      petalsCtx.bezierCurveTo(s * 0.9, -s * 0.65, s * 0.95, s * 0.55, 0, s);
      petalsCtx.bezierCurveTo(-s * 0.95, s * 0.55, -s * 0.9, -s * 0.65, 0, -s);
      petalsCtx.closePath();
      petalsCtx.fillStyle = p.color;
      petalsCtx.fill();
      petalsCtx.restore();
    }
  }
  animationFrameId = requestAnimationFrame(renderLoop);
}

onMounted(() => {
  if (!oceanCanvasRef.value || !petalsCanvasRef.value || !containerRef.value) return;
  gl = oceanCanvasRef.value.getContext('webgl');
  petalsCtx = petalsCanvasRef.value.getContext('2d');
  if (gl) {
    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, VERTEX_SHADER_SOURCE);
    gl.compileShader(vs);
    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, FRAGMENT_SHADER_SOURCE);
    gl.compileShader(fs);
    program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
    resolutionLoc = gl.getUniformLocation(program, 'u_resolution');
    timeLoc = gl.getUniformLocation(program, 'u_time');
    mouseLoc = gl.getUniformLocation(program, 'u_mouse');
    rippleLoc = gl.getUniformLocation(program, 'u_ripple');
  }
  resizeCanvas();
  petals = Array.from({ length: 42 }, () => createPetal(true));
  window.addEventListener('mousemove', onWindowMouseMove);
  resizeObserver = new ResizeObserver(() => resizeCanvas());
  resizeObserver.observe(containerRef.value);
  renderLoop();
});

onBeforeUnmount(() => {
  if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
  window.removeEventListener('mousemove', onWindowMouseMove);
  resizeObserver?.disconnect();
});
</script>
