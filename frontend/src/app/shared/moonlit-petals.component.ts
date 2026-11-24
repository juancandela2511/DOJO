/**
 * @file moonlit-petals.component.ts
 * @description Componente visual animado "Moonlit Petals" (Pétalos bajo la Luz de la Luna)
 *              en Angular Standalone + HTML5 Canvas (60 FPS, fuera de NgZone).
 *              Renderiza una luna llena luminosa, neblina nocturna sutil, destellos de luz
 *              y pétalos de cerezo flotando con profundidad, rotación 3D y brisa interactiva.
 */

import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  NgZone,
  OnDestroy,
  ViewChild,
} from '@angular/core';

interface Petal {
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

interface StarMote {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  twinkleSpeed: number;
  phase: number;
}

@Component({
  selector: 'app-moonlit-petals',
  standalone: true,
  template: `
    <div
      #container
      class="absolute inset-0 w-full h-full overflow-hidden pointer-events-auto select-none"
      (mousemove)="onMouseMove($event)"
      (mouseleave)="onMouseLeave()"
    >
      <!-- Fondo nocturno profundo bajo luz lunar -->
      <div
        class="absolute inset-0"
        style="background: radial-gradient(circle at 78% 24%, #1e2948 0%, #0e1529 45%, #070a14 100%);"
      ></div>

      <!-- Halo luminoso de la Luna -->
      <div
        class="absolute rounded-full pointer-events-none"
        style="
          top: 8%;
          right: 12%;
          width: 340px;
          height: 340px;
          background: radial-gradient(circle, rgba(226, 236, 255, 0.28) 0%, rgba(168, 198, 255, 0.10) 42%, transparent 72%);
          filter: blur(18px);
        "
      ></div>

      <!-- Disco Lunar -->
      <div
        class="absolute rounded-full pointer-events-none"
        style="
          top: 14%;
          right: 17%;
          width: 118px;
          height: 118px;
          background: radial-gradient(circle at 35% 35%, #ffffff 0%, #eef4ff 52%, #cad8f5 100%);
          box-shadow: 0 0 45px rgba(215, 230, 255, 0.65), 0 0 110px rgba(147, 184, 255, 0.35);
          opacity: 0.92;
        "
      ></div>

      <!-- Canvas de Pétalos y Estrellas (60 FPS) -->
      <canvas
        #petalsCanvas
        class="absolute inset-0 w-full h-full block"
      ></canvas>

      <!-- Velo inferior suave para legibilidad del texto -->
      <div
        class="absolute inset-x-0 bottom-0 h-44 pointer-events-none"
        style="background: linear-gradient(to top, rgba(7, 10, 20, 0.88) 0%, rgba(7, 10, 20, 0.35) 55%, transparent 100%);"
      ></div>
    </div>
  `,
})
export class MoonlitPetalsComponent implements AfterViewInit, OnDestroy {
  @ViewChild('petalsCanvas', { static: true })
  private canvasRef!: ElementRef<HTMLCanvasElement>;

  @ViewChild('container', { static: true })
  private containerRef!: ElementRef<HTMLDivElement>;

  private readonly ngZone = inject(NgZone);

  private ctx: CanvasRenderingContext2D | null = null;
  private animationFrameId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;

  private width = 1200;
  private height = 620;
  private petals: Petal[] = [];
  private stars: StarMote[] = [];
  private windOffset = 0;
  private targetWind = 0;

  private readonly petalPalette: ReadonlyArray<string> = [
    '#fde2eb',
    '#fbd0e0',
    '#fff1f5',
    '#f8bbd0',
    '#e8eaf6',
  ];

  public ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d');
    if (!this.ctx) return;

    this.resizeCanvas();
    this.initScene();

    this.resizeObserver = new ResizeObserver(() => {
      this.resizeCanvas();
    });
    this.resizeObserver.observe(this.containerRef.nativeElement);

    this.ngZone.runOutsideAngular(() => {
      this.animate(0);
    });
  }

  public ngOnDestroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.resizeObserver?.disconnect();
  }

  public onMouseMove(event: MouseEvent): void {
    const rect = this.containerRef.nativeElement.getBoundingClientRect();
    const normalizedX = (event.clientX - rect.left) / Math.max(1, rect.width) - 0.5;
    this.targetWind = normalizedX * 1.4;
  }

  public onMouseLeave(): void {
    this.targetWind = 0;
  }

  private resizeCanvas(): void {
    const container = this.containerRef.nativeElement;
    const canvas = this.canvasRef.nativeElement;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.width = container.clientWidth || window.innerWidth;
    this.height = container.clientHeight || 600;

    canvas.width = Math.floor(this.width * dpr);
    canvas.height = Math.floor(this.height * dpr);
    canvas.style.width = `${this.width}px`;
    canvas.style.height = `${this.height}px`;

    if (this.ctx) {
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  private initScene(): void {
    this.stars = Array.from({ length: 48 }, () => ({
      x: Math.random() * this.width,
      y: Math.random() * (this.height * 0.72),
      radius: 0.7 + Math.random() * 1.5,
      alpha: 0.25 + Math.random() * 0.65,
      twinkleSpeed: 0.001 + Math.random() * 0.0025,
      phase: Math.random() * Math.PI * 2,
    }));

    this.petals = Array.from({ length: 56 }, () => this.createPetal(true));
  }

  private createPetal(randomY: boolean): Petal {
    const depth = 0.45 + Math.random() * 0.9;
    return {
      x: Math.random() * (this.width + 200) - 100,
      y: randomY ? Math.random() * this.height : -24 - Math.random() * 60,
      size: (6 + Math.random() * 8) * depth,
      speedY: (0.45 + Math.random() * 0.85) * depth,
      speedX: (-0.35 - Math.random() * 0.55) * depth,
      swayAmp: 0.35 + Math.random() * 0.75,
      swaySpeed: 0.012 + Math.random() * 0.02,
      swayOffset: Math.random() * Math.PI * 2,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.025,
      flip: Math.random() * Math.PI,
      flipSpeed: 0.02 + Math.random() * 0.03,
      opacity: Math.min(0.95, 0.35 + depth * 0.45),
      color: this.petalPalette[Math.floor(Math.random() * this.petalPalette.length)],
      depth,
    };
  }

  private animate(time: number): void {
    if (!this.ctx) return;

    this.ctx.clearRect(0, 0, this.width, this.height);
    this.windOffset += (this.targetWind - this.windOffset) * 0.03;

    // 1. Estrellas / Destellos lunares
    for (const star of this.stars) {
      const twinkle = 0.45 + 0.55 * Math.sin(time * star.twinkleSpeed + star.phase);
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(226, 238, 255, ${(star.alpha * twinkle).toFixed(3)})`;
      this.ctx.fill();
    }

    // 2. Pétalos flotando bajo la luz de la luna
    for (let i = 0; i < this.petals.length; i++) {
      const p = this.petals[i];
      p.swayOffset += p.swaySpeed;
      p.x += p.speedX + Math.sin(p.swayOffset) * p.swayAmp + this.windOffset * p.depth;
      p.y += p.speedY;
      p.rotation += p.rotationSpeed;
      p.flip += p.flipSpeed;

      if (p.y > this.height + 30 || p.x < -80 || p.x > this.width + 120) {
        this.petals[i] = this.createPetal(false);
        this.petals[i].x = Math.random() * (this.width + 180) - 40;
        continue;
      }

      this.drawPetal(p);
    }

    this.animationFrameId = requestAnimationFrame((t) => this.animate(t));
  }

  private drawPetal(p: Petal): void {
    if (!this.ctx) return;
    const scaleY = 0.45 + Math.abs(Math.cos(p.flip)) * 0.55;

    this.ctx.save();
    this.ctx.translate(p.x, p.y);
    this.ctx.rotate(p.rotation);
    this.ctx.scale(1, scaleY);
    this.ctx.globalAlpha = p.opacity;

    const s = p.size;
    this.ctx.beginPath();
    this.ctx.moveTo(0, -s);
    this.ctx.bezierCurveTo(s * 0.9, -s * 0.65, s * 0.95, s * 0.55, 0, s);
    this.ctx.bezierCurveTo(-s * 0.95, s * 0.55, -s * 0.9, -s * 0.65, 0, -s);
    this.ctx.closePath();

    const grad = this.ctx.createLinearGradient(0, -s, 0, s);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.45, p.color);
    grad.addColorStop(1, 'rgba(244, 180, 206, 0.72)');

    this.ctx.fillStyle = grad;
    this.ctx.shadowColor = 'rgba(220, 232, 255, 0.35)';
    this.ctx.shadowBlur = 6;
    this.ctx.fill();
    this.ctx.restore();
  }
}
