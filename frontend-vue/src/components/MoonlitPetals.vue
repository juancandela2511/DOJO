<template>
  <div
    ref="containerRef"
    class="absolute inset-0 w-full h-full overflow-hidden pointer-events-auto select-none"
    @mousemove="onMouseMove"
    @mouseleave="targetWind = 0"
  >
    <div
      class="absolute inset-0 transition-all duration-500"
      :style="{
        background: isLight
          ? 'radial-gradient(circle at 78% 18%, #ffffff 0%, #f5f5f3 50%, #ebebea 100%)'
          : 'radial-gradient(circle at 78% 24%, #1b1e28 0%, #101218 48%, #090a0e 100%)',
      }"
    ></div>

    <div
      class="absolute rounded-full pointer-events-none transition-all duration-500"
      :style="{
        top: '8%', right: '12%', width: '340px', height: '340px',
        background: isLight
          ? 'radial-gradient(circle, rgba(255,255,255,0.85) 0%, rgba(228,228,231,0.35) 50%, transparent 74%)'
          : 'radial-gradient(circle, rgba(244,244,245,0.16) 0%, rgba(161,161,170,0.06) 45%, transparent 72%)',
        filter: 'blur(22px)',
      }"
    ></div>

    <div
      class="absolute rounded-full pointer-events-none transition-all duration-500"
      :style="{
        top: '14%', right: '17%', width: '118px', height: '118px',
        background: isLight
          ? 'radial-gradient(circle at 35% 35%, #ffffff 0%, #f4f4f5 65%, #e4e4e7 100%)'
          : 'radial-gradient(circle at 35% 35%, #ffffff 0%, #f4f4f5 55%, #d4d4d8 100%)',
        boxShadow: isLight
          ? '0 0 55px rgba(255,255,255,0.95), 0 0 90px rgba(161,161,170,0.18)'
          : '0 0 42px rgba(244,244,245,0.45), 0 0 100px rgba(161,161,170,0.18)',
        opacity: 0.92,
      }"
    ></div>

    <canvas ref="canvasRef" class="absolute inset-0 w-full h-full block"></canvas>

    <div
      class="absolute inset-x-0 bottom-0 h-44 pointer-events-none transition-all duration-500"
      :style="{
        background: isLight
          ? 'linear-gradient(to top, rgba(235,235,234,0.9) 0%, rgba(245,245,243,0.3) 55%, transparent 100%)'
          : 'linear-gradient(to top, rgba(9,10,14,0.88) 0%, rgba(9,10,14,0.35) 55%, transparent 100%)',
      }"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useDojoStore } from '../composables/useDojoStore';
import { createPetal, createStars, drawPetal, type Petal, type StarMote } from '../utils/petalsCanvas';

const store = useDojoStore();
const isLight = computed(() => store.theme.value === 'light');
const containerRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);

let ctx: CanvasRenderingContext2D | null = null;
let frameId: number | null = null;
let observer: ResizeObserver | null = null;
let width = 1200;
let height = 620;
let petals: Petal[] = [];
let stars: StarMote[] = [];
let windOffset = 0;
let targetWind = 0;

function onMouseMove(e: MouseEvent): void {
  if (!containerRef.value) return;
  const r = containerRef.value.getBoundingClientRect();
  targetWind = ((e.clientX - r.left) / Math.max(1, r.width) - 0.5) * 1.4;
}

function resize(): void {
  if (!containerRef.value || !canvasRef.value) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = containerRef.value.clientWidth || window.innerWidth;
  height = containerRef.value.clientHeight || 600;
  canvasRef.value.width = Math.floor(width * dpr);
  canvasRef.value.height = Math.floor(height * dpr);
  canvasRef.value.style.width = `${width}px`;
  canvasRef.value.style.height = `${height}px`;
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function animate(time: number): void {
  if (!ctx) return;
  ctx.clearRect(0, 0, width, height);
  windOffset += (targetWind - windOffset) * 0.03;

  if (!isLight.value) {
    for (const s of stars) {
      const tw = 0.45 + 0.55 * Math.sin(time * s.twinkleSpeed + s.phase);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(226, 238, 255, ${(s.alpha * tw).toFixed(3)})`;
      ctx.fill();
    }
  }

  for (let i = 0; i < petals.length; i++) {
    const p = petals[i];
    p.swayOffset += p.swaySpeed;
    p.x += p.speedX + Math.sin(p.swayOffset) * p.swayAmp + windOffset * p.depth;
    p.y += p.speedY;
    p.rotation += p.rotationSpeed;
    p.flip += p.flipSpeed;
    if (p.y > height + 30 || p.x < -80 || p.x > width + 120) {
      petals[i] = createPetal(width, height, false);
      continue;
    }
    drawPetal(ctx, p, isLight.value);
  }
  frameId = requestAnimationFrame(animate);
}

onMounted(() => {
  if (!canvasRef.value || !containerRef.value) return;
  ctx = canvasRef.value.getContext('2d');
  resize();
  stars = createStars(width, height);
  petals = Array.from({ length: 56 }, () => createPetal(width, height, true));
  observer = new ResizeObserver(resize);
  observer.observe(containerRef.value);
  animate(0);
});

onBeforeUnmount(() => {
  if (frameId !== null) cancelAnimationFrame(frameId);
  observer?.disconnect();
});
</script>
