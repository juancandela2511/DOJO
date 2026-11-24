/**
 * @file ocean-swell.component.ts
 * @description Fondo interactivo WebGL "Ocean Swell" fusionado con "Moonlit Petals"
 *              (Mar nocturno 3D bajo la luna llena + pétalos de cerezo cayendo sobre las olas).
 *              - Comparte exactamente la misma atmósfera y paleta nocturna azul-índigo
 *                (#070a14 -> #0e1529 -> #1e2948) y luna llena fija en el cuadrante superior
 *                derecho que la portada del Dojo.
 *              - Raymarching 3D real para las olas con reflejos plateados lunares y sutiles
 *                matices rosados de sakura en las crestas.
 *              - Capa de pétalos de cerezo 3D cayendo en tiempo real sobre el mar.
 */

import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  inject,
  NgZone,
  OnDestroy,
  ViewChild,
} from '@angular/core';

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

  // Luna llena 100% FIJA en el cuadrante superior derecho (igual que en la portada Moonlit Petals)
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

  float noise01(vec2 p) {
    return 0.5 + 0.5 * noise(p);
  }

  float seaOctave(vec2 uv, float choppy) {
    uv += noise(uv);
    vec2 wv = 1.0 - abs(sin(uv));
    vec2 swv = abs(cos(uv));
    wv = mix(wv, swv, wv);
    return pow(1.0 - pow(wv.x * wv.y, 0.65), choppy);
  }

  // Geometría 3D del mar para raymarching
  float mapOceanGeometry(vec3 p, float t, vec2 cursorWorld, float rippleStrength) {
    float freq = 0.19;
    float amp = 0.50;
    float choppy = 3.5;
    vec2 uv = p.xz;
    uv.x *= 0.78;

    mat2 octaveMat = mat2(1.6, 1.2, -1.2, 1.6);
    float d = 0.0;
    float h = 0.0;

    for (int i = 0; i < 3; i++) {
      d = seaOctave((uv + t * 0.80) * freq, choppy);
      d += seaOctave((uv - t * 0.70) * freq, choppy);
      h += d * amp;
      uv *= octaveMat;
      freq *= 1.92;
      amp *= 0.23;
      choppy = mix(choppy, 1.0, 0.2);
    }

    float distCursor = length(p.xz - cursorWorld);
    float wake = sin(distCursor * 3.0 - t * 4.8) * exp(-distCursor * 0.22) * (0.06 + rippleStrength * 0.14);

    return p.y - (h + wake);
  }

  // Mapa detallado de 7 octavas para normales, reflejos lunares y espuma
  float mapOceanDetailed(vec3 p, float t, vec2 cursorWorld, float rippleStrength) {
    float freq = 0.19;
    float amp = 0.50;
    float choppy = 3.5;
    vec2 uv = p.xz;
    uv.x *= 0.78;

    mat2 octaveMat = mat2(1.6, 1.2, -1.2, 1.6);
    float d = 0.0;
    float h = 0.0;

    for (int i = 0; i < 7; i++) {
      d = seaOctave((uv + t * 0.80) * freq, choppy);
      d += seaOctave((uv - t * 0.70) * freq, choppy);
      h += d * amp;
      uv *= octaveMat;
      freq *= 1.92;
      amp *= 0.23;
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

  float fbmClouds(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 rot = mat2(0.80, 0.60, -0.60, 0.80);
    for (int i = 0; i < 5; i++) {
      v += a * noise01(p);
      p = rot * p * 2.02 + vec2(1.4, 7.8);
      a *= 0.5;
    }
    return v;
  }

  // Cielo nocturno idéntico a la atmósfera de Moonlit Petals (#070a14 -> #0e1529 -> #1e2948)
  vec3 getMoonlitSkyColor(vec3 e, float t, bool includeDisk) {
    vec3 moonDir = normalize(MOON_DIR);
    float y = max(e.y, 0.0);

    // Paleta exacta de Moonlit Petals
    vec3 zenith = vec3(0.027, 0.039, 0.078);   // #070a14
    vec3 midSky = vec3(0.055, 0.082, 0.161);   // #0e1529
    vec3 horizon = vec3(0.145, 0.204, 0.345);  // #253458 (bruma lunar azul-índigo)

    vec3 sky = mix(horizon, midSky, pow(y, 0.52));
    sky = mix(sky, zenith, pow(y, 1.25));

    float moonDot = max(dot(e, moonDir), 0.0);

    // Halo lunar azul-plateado con un toque sutilísimo de sakura (#fde2eb)
    vec3 outerHalo = vec3(0.45, 0.58, 0.85) * pow(moonDot, 10.0) * 0.35;
    vec3 innerHalo = vec3(0.82, 0.88, 1.00) * pow(moonDot, 48.0) * 0.55;
    sky += outerHalo + innerHalo;

    // Nubes nocturnas suaves iluminadas por la luna fija
    if (e.y > 0.004) {
      vec2 cloudUv = e.xz / (e.y + 0.15);
      float cBase = fbmClouds(cloudUv * 0.45 + vec2(t * 0.012, t * 0.004));
      float cDetail = fbmClouds(cloudUv * 1.10 - vec2(t * 0.008, -t * 0.003));
      float cloudDensity = smoothstep(0.40, 0.80, cBase * 0.74 + cDetail * 0.26);

      float moonLitEdge = pow(moonDot, 5.0) * 0.55;
      vec3 cloudDark = vec3(0.06, 0.09, 0.17);
      vec3 cloudBright = vec3(0.28, 0.37, 0.54) + vec3(0.32, 0.36, 0.48) * moonLitEdge;
      vec3 cloudColor = mix(cloudDark, cloudBright, smoothstep(0.40, 0.82, cBase));

      float horizonFade = smoothstep(0.0, 0.22, y);
      sky = mix(sky, cloudColor, cloudDensity * 0.62 * horizonFade);
    }

    // Disco de la luna llena nítido y fijo (igual al de la portada)
    if (includeDisk) {
      float diskMask = smoothstep(0.9978, 0.9986, moonDot);
      vec3 moonSurface = vec3(0.95, 0.97, 1.00);
      sky = mix(sky, moonSurface, diskMask * 0.94);
    }

    return sky;
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
    float t = u_time * 0.42;
    vec3 moonDir = normalize(MOON_DIR);

    // Cámara 3D interactiva (mueve la vista sobre el mar, pero la luna permanece fija)
    float camYaw = u_mouse.x * 0.22;
    float camPitch = -0.05 + u_mouse.y * 0.10;

    vec3 ro = vec3(u_mouse.x * 1.1, 3.2 + u_mouse.y * 0.32, t * 1.15);
    vec3 rd = normalize(vec3(uv.x, uv.y + camPitch, 1.45));

    float cy = cos(camYaw);
    float sy = sin(camYaw);
    rd.xz = mat2(cy, -sy, sy, cy) * rd.xz;

    vec3 skyColor = getMoonlitSkyColor(rd, t, true);

    if (rd.y > 0.04) {
      gl_FragColor = vec4(skyColor, 1.0);
      return;
    }

    vec2 cursorWorld = ro.xz + vec2(u_mouse.x * 9.0, 12.0 - u_mouse.y * 5.0);

    // Raymarching 3D de la superficie del mar
    float tm = 0.0;
    float tx = 140.0;
    float hx = mapOceanGeometry(ro + rd * tx, t, cursorWorld, u_ripple);

    if (hx > 0.0) {
      gl_FragColor = vec4(skyColor, 1.0);
      return;
    }

    float hm = mapOceanGeometry(ro + rd * tm, t, cursorWorld, u_ripple);
    float tmid = 0.0;

    for (int i = 0; i < 8; i++) {
      tmid = mix(tm, tx, hm / (hm - hx));
      vec3 p = ro + rd * tmid;
      float hmid = mapOceanGeometry(p, t, cursorWorld, u_ripple);
      if (hmid < 0.0) {
        tx = tmid;
        hx = hmid;
      } else {
        tm = tmid;
        hm = hmid;
      }
    }

    vec3 hitPos = ro + rd * tmid;
    float dist = tmid;

    float eps = max(0.015, dist * dist * 0.00055);
    vec3 n = getOceanNormal(hitPos, eps, t, cursorWorld, u_ripple);

    // Colores del mar nocturno bajo la luna
    vec3 deepWater = vec3(0.02, 0.05, 0.11);
    vec3 shallowWater = vec3(0.07, 0.16, 0.28);
    vec3 backlightColor = vec3(0.14, 0.28, 0.46);

    float fresnel = clamp(1.0 - dot(n, -rd), 0.0, 1.0);
    fresnel = pow(fresnel, 3.5) * 0.85 + 0.06;

    vec3 reflDir = reflect(rd, n);
    reflDir.y = max(reflDir.y, 0.01);
    vec3 reflectedSky = getMoonlitSkyColor(reflDir, t, false);

    float diffuse = pow(dot(n, moonDir) * 0.4 + 0.6, 2.5);
    float crestHeight = clamp((hitPos.y - 0.35) * 0.9, 0.0, 1.0);
    float backlight = pow(max(dot(vec3(moonDir.x, 0.0, moonDir.z), -n), 0.0), 2.0) * crestHeight;

    vec3 waterBody = mix(deepWater, shallowWater, diffuse * 0.55 + crestHeight * 0.35);
    waterBody += backlightColor * backlight * 0.45;

    vec3 waterColor = mix(waterBody, reflectedSky, fresnel);

    // Camino de luz de luna plateada y sutil destello sakura sobre las olas
    vec3 halfVec = normalize(moonDir - rd);
    float specBroad = pow(max(dot(n, halfVec), 0.0), 55.0);
    float specGlitter = pow(max(dot(n, halfVec), 0.0), 380.0);
    waterColor += vec3(0.62, 0.74, 0.95) * specBroad * 0.48;
    waterColor += vec3(0.96, 0.92, 0.98) * specGlitter * 1.45;

    // Espuma plateada nocturna en las crestas
    float slope = 1.0 - n.y;
    float foamPattern = noise01(hitPos.xz * 2.8 + vec2(t * 0.4, -t * 0.3));
    float foam = smoothstep(0.25, 0.58, crestHeight * 0.65 + slope * 1.15 + foamPattern * 0.25);
    foam *= (1.0 - smoothstep(10.0, 62.0, dist));
    waterColor = mix(waterColor, vec3(0.72, 0.80, 0.92), foam * 0.34);

    // Neblina de horizonte nocturna
    vec3 horizonFogColor = getMoonlitSkyColor(normalize(vec3(rd.x, 0.01, rd.z)), t, false);
    float fogFactor = clamp(pow(dist / 125.0, 1.35), 0.0, 1.0);
    vec3 finalColor = mix(waterColor, horizonFogColor, fogFactor);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

@Component({
  selector: 'app-ocean-swell',
  standalone: true,
  template: `
    <div
      #container
      class="absolute inset-0 w-full h-full overflow-hidden select-none cursor-grab active:cursor-grabbing"
      style="background: linear-gradient(180deg, #070a14 0%, #0e1529 36%, #253458 50%, #0b192e 54%, #050b16 100%);"
    >
      <!-- 1. Canvas WebGL 3D del Mar bajo la Luna -->
      <canvas
        #oceanCanvas
        class="absolute inset-0 w-full h-full block"
      ></canvas>

      <!-- 2. Canvas 2D Superpuesto con Pétalos de Cerezo Cayendo sobre el Mar -->
      <canvas
        #petalsOverlayCanvas
        class="absolute inset-0 w-full h-full block pointer-events-none"
      ></canvas>

      <!-- 3. Viñeta nocturna suave -->
      <div
        class="absolute inset-0 pointer-events-none"
        style="background: radial-gradient(circle at 50% 50%, rgba(7, 10, 20, 0.04) 0%, rgba(5, 8, 16, 0.40) 100%);"
      ></div>
    </div>
  `,
})
export class OceanSwellComponent implements AfterViewInit, OnDestroy {
  @ViewChild('oceanCanvas', { static: true })
  private canvasRef!: ElementRef<HTMLCanvasElement>;

  @ViewChild('petalsOverlayCanvas', { static: true })
  private petalsCanvasRef!: ElementRef<HTMLCanvasElement>;

  @ViewChild('container', { static: true })
  private containerRef!: ElementRef<HTMLDivElement>;

  private readonly ngZone = inject(NgZone);

  private gl: WebGLRenderingContext | null = null;
  private petalsCtx: CanvasRenderingContext2D | null = null;
  private program: WebGLProgram | null = null;
  private resolutionLoc: WebGLUniformLocation | null = null;
  private timeLoc: WebGLUniformLocation | null = null;
  private mouseLoc: WebGLUniformLocation | null = null;
  private rippleLoc: WebGLUniformLocation | null = null;
  private animationFrameId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private startTime = performance.now();

  private viewWidth = 1200;
  private viewHeight = 800;
  private petals: SeaPetal[] = [];

  private readonly petalPalette: ReadonlyArray<string> = [
    '#fde2eb',
    '#fbd0e0',
    '#fff1f5',
    '#f8bbd0',
    '#e8eaf6',
  ];

  private targetMouseX = 0;
  private targetMouseY = 0;
  private currentMouseX = 0;
  private currentMouseY = 0;
  private rippleBoost = 0;
  private isDragging = false;

  @HostListener('window:mousemove', ['$event'])
  public onWindowMouseMove(event: MouseEvent): void {
    const w = window.innerWidth || 1;
    const h = window.innerHeight || 1;
    const nx = (event.clientX / w - 0.5) * 2;
    const ny = (0.5 - event.clientY / h) * 2;

    const factor = this.isDragging ? 1.2 : 0.75;
    this.targetMouseX = Math.max(-1.2, Math.min(1.2, nx * factor));
    this.targetMouseY = Math.max(-0.85, Math.min(0.85, ny * factor));
    this.rippleBoost = Math.min(1.0, this.rippleBoost + 0.05);
  }

  @HostListener('window:mousedown')
  public onWindowMouseDown(): void {
    this.isDragging = true;
    this.rippleBoost = 1.0;
  }

  @HostListener('window:mouseup')
  public onWindowMouseUp(): void {
    this.isDragging = false;
  }

  @HostListener('window:touchmove', ['$event'])
  public onWindowTouchMove(event: TouchEvent): void {
    const touch = event.touches[0];
    if (!touch) return;
    const w = window.innerWidth || 1;
    const h = window.innerHeight || 1;
    this.targetMouseX = (touch.clientX / w - 0.5) * 2;
    this.targetMouseY = (0.5 - touch.clientY / h) * 2;
    this.rippleBoost = 0.9;
  }

  public ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.gl = canvas.getContext('webgl', { antialias: false, alpha: false });
    this.petalsCtx = this.petalsCanvasRef.nativeElement.getContext('2d');

    if (this.gl) {
      this.initWebGL(this.gl);
    }

    this.resizeCanvas();
    this.initPetals();

    this.resizeObserver = new ResizeObserver(() => this.resizeCanvas());
    this.resizeObserver.observe(this.containerRef.nativeElement);

    this.ngZone.runOutsideAngular(() => {
      this.renderLoop();
    });
  }

  public ngOnDestroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.resizeObserver?.disconnect();
    if (this.gl && this.program) {
      this.gl.deleteProgram(this.program);
    }
  }

  private initPetals(): void {
    this.petals = Array.from({ length: 42 }, () => this.createPetal(true));
  }

  private createPetal(randomY: boolean): SeaPetal {
    const depth = 0.45 + Math.random() * 0.9;
    return {
      x: Math.random() * (this.viewWidth + 200) - 100,
      y: randomY ? Math.random() * this.viewHeight : -24 - Math.random() * 60,
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
      color: this.petalPalette[Math.floor(Math.random() * this.petalPalette.length)],
      depth,
    };
  }

  private initWebGL(gl: WebGLRenderingContext): void {
    const vs = this.compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
    const fs = this.compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      return;
    }

    this.program = program;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const posLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    this.resolutionLoc = gl.getUniformLocation(program, 'u_resolution');
    this.timeLoc = gl.getUniformLocation(program, 'u_time');
    this.mouseLoc = gl.getUniformLocation(program, 'u_mouse');
    this.rippleLoc = gl.getUniformLocation(program, 'u_ripple');
  }

  private compileShader(
    gl: WebGLRenderingContext,
    type: number,
    source: string
  ): WebGLShader | null {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  private resizeCanvas(): void {
    const container = this.containerRef.nativeElement;
    const canvas = this.canvasRef.nativeElement;
    const petalsCanvas = this.petalsCanvasRef.nativeElement;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    this.viewWidth = container.clientWidth || window.innerWidth;
    this.viewHeight = container.clientHeight || window.innerHeight;

    canvas.width = Math.floor(this.viewWidth * dpr);
    canvas.height = Math.floor(this.viewHeight * dpr);
    canvas.style.width = `${this.viewWidth}px`;
    canvas.style.height = `${this.viewHeight}px`;

    if (this.gl) {
      this.gl.viewport(0, 0, canvas.width, canvas.height);
    }

    petalsCanvas.width = Math.floor(this.viewWidth * dpr);
    petalsCanvas.height = Math.floor(this.viewHeight * dpr);
    petalsCanvas.style.width = `${this.viewWidth}px`;
    petalsCanvas.style.height = `${this.viewHeight}px`;

    if (this.petalsCtx) {
      this.petalsCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  private renderLoop(): void {
    this.currentMouseX += (this.targetMouseX - this.currentMouseX) * 0.05;
    this.currentMouseY += (this.targetMouseY - this.currentMouseY) * 0.05;
    this.rippleBoost *= 0.95;

    const elapsedSeconds = (performance.now() - this.startTime) / 1000;

    // 1. Renderizar Océano 3D WebGL bajo la luna
    if (this.gl && this.program) {
      const canvas = this.canvasRef.nativeElement;
      this.gl.uniform2f(this.resolutionLoc, canvas.width, canvas.height);
      this.gl.uniform1f(this.timeLoc, elapsedSeconds);
      this.gl.uniform2f(this.mouseLoc, this.currentMouseX, this.currentMouseY);
      this.gl.uniform1f(this.rippleLoc, this.rippleBoost);
      this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    }

    // 2. Renderizar Pétalos de Cerezo cayendo sobre las olas
    if (this.petalsCtx) {
      this.petalsCtx.clearRect(0, 0, this.viewWidth, this.viewHeight);
      for (let i = 0; i < this.petals.length; i++) {
        const p = this.petals[i];
        p.swayOffset += p.swaySpeed;
        p.x += p.speedX + Math.sin(p.swayOffset) * p.swayAmp + this.currentMouseX * 0.85 * p.depth;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;
        p.flip += p.flipSpeed;

        if (p.y > this.viewHeight + 30 || p.x < -80 || p.x > this.viewWidth + 120) {
          this.petals[i] = this.createPetal(false);
          this.petals[i].x = Math.random() * (this.viewWidth + 180) - 40;
          continue;
        }

        this.drawPetal(this.petalsCtx, p);
      }
    }

    this.animationFrameId = requestAnimationFrame(() => this.renderLoop());
  }

  private drawPetal(ctx: CanvasRenderingContext2D, p: SeaPetal): void {
    const scaleY = 0.45 + Math.abs(Math.cos(p.flip)) * 0.55;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.scale(1, scaleY);
    ctx.globalAlpha = p.opacity;

    const s = p.size;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.bezierCurveTo(s * 0.9, -s * 0.65, s * 0.95, s * 0.55, 0, s);
    ctx.bezierCurveTo(-s * 0.95, s * 0.55, -s * 0.9, -s * 0.65, 0, -s);
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, -s, 0, s);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.45, p.color);
    grad.addColorStop(1, 'rgba(244, 180, 206, 0.72)');

    ctx.fillStyle = grad;
    ctx.shadowColor = 'rgba(220, 232, 255, 0.35)';
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.restore();
  }
}
