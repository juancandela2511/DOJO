export interface Petal {
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

export interface StarMote {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  twinkleSpeed: number;
  phase: number;
}

const PETAL_PALETTE = ['#fde2eb', '#fbd0e0', '#fff1f5', '#f8bbd0', '#e8eaf6'];

export function createPetal(width: number, height: number, randomY: boolean): Petal {
  const depth = 0.45 + Math.random() * 0.9;
  return {
    x: Math.random() * (width + 200) - 100,
    y: randomY ? Math.random() * height : -24 - Math.random() * 60,
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
    color: PETAL_PALETTE[Math.floor(Math.random() * PETAL_PALETTE.length)],
    depth,
  };
}

export function createStars(width: number, height: number, count = 48): StarMote[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * (height * 0.72),
    radius: 0.7 + Math.random() * 1.5,
    alpha: 0.25 + Math.random() * 0.65,
    twinkleSpeed: 0.001 + Math.random() * 0.0025,
    phase: Math.random() * Math.PI * 2,
  }));
}

export function drawPetal(ctx: CanvasRenderingContext2D, p: Petal, isLight: boolean): void {
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
  if (isLight) {
    grad.addColorStop(0, '#fde2eb');
    grad.addColorStop(0.5, '#f2a7c0');
    grad.addColorStop(1, '#dd7f9f');
    ctx.shadowColor = 'rgba(190, 95, 130, 0.2)';
  } else {
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.45, p.color);
    grad.addColorStop(1, 'rgba(244, 180, 206, 0.78)');
    ctx.shadowColor = 'rgba(248, 187, 208, 0.35)';
  }

  ctx.fillStyle = grad;
  ctx.shadowBlur = 6;
  ctx.fill();
  ctx.restore();
}
