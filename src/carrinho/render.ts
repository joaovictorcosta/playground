import { CARRINHO_LCD_COLORS } from './config';
import {
  carRectForLane,
  computeRoadLayout,
  obstacleRectForLane,
} from './layout';
import type { LaneIndex, ObstacleSlot } from './types';

export type PaintCarrinhoOpts = {
  readonly laneCount: number;
  readonly laneIndex: LaneIndex;
  /** Acumulado da esteira (px canvas); anima faixa e marcas. */
  readonly roadScrollOffset: number;
  /** Período do padrão horizontal que rola (px canvas). */
  readonly roadPatternStripeCanvas: number;
  readonly obstacles: readonly ObstacleSlot[];
  readonly crashed: boolean;
};

/**
 * Desenha a estrada com rolagem tipo esteira, obstáculos e o veículo
 * fixo na base (apenas troca de faixa altera X).
 */
export function paintCarrinho(
  ctx: CanvasRenderingContext2D,
  canvasWidthPx: number,
  canvasHeightPx: number,
  opts: PaintCarrinhoOpts,
): void {
  const {
    laneCount,
    laneIndex,
    roadScrollOffset,
    roadPatternStripeCanvas,
    obstacles,
    crashed,
  } = opts;

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  ctx.fillStyle = CARRINHO_LCD_COLORS.asphalt;
  ctx.fillRect(0, 0, canvasWidthPx, canvasHeightPx);

  const layout = computeRoadLayout(canvasWidthPx, canvasHeightPx, laneCount);
  const { topPad, roadH, laneEdges, laneCount: safeLanes } = layout;

  const stripeH = Math.max(6, roadPatternStripeCanvas);

  for (let i = 0; i < safeLanes; i += 1) {
    const left = laneEdges[i]!;
    const w = laneEdges[i + 1]! - left;
    ctx.save();
    ctx.beginPath();
    ctx.rect(left, topPad, Math.max(1, w), roadH);
    ctx.clip();
    let y =
      topPad -
      ((roadScrollOffset + i * stripeH * 0.5) % (stripeH * 2));
    while (y < topPad + roadH + stripeH) {
      const band = Math.floor((y + roadScrollOffset) / stripeH);
      const even = (band + i) % 2 === 0;
      ctx.fillStyle = even
        ? CARRINHO_LCD_COLORS.laneStripeA
        : CARRINHO_LCD_COLORS.laneStripeB;
      const stripTop = Math.max(topPad, y);
      const stripBot = Math.min(topPad + roadH, y + stripeH);
      if (stripBot > stripTop) {
        ctx.fillRect(left, stripTop, Math.max(1, w), stripBot - stripTop);
      }
      y += stripeH;
    }
    ctx.restore();
  }

  const dash = Math.max(8, stripeH * 0.55);
  const dGap = Math.max(6, stripeH * 0.38);
  ctx.strokeStyle = CARRINHO_LCD_COLORS.laneDivider;
  ctx.lineWidth = 1;
  for (let g = 1; g < safeLanes; g += 1) {
    const px = laneEdges[g]! + 0.5;
    let y = topPad + (-roadScrollOffset % (dash + dGap));
    ctx.beginPath();
    while (y < topPad + roadH) {
      const seg0 = y;
      const seg1 = Math.min(y + dash, topPad + roadH);
      if (seg1 > seg0) {
        ctx.moveTo(px, seg0);
        ctx.lineTo(px, seg1);
      }
      y += dash + dGap;
    }
    ctx.stroke();
  }

  for (const ob of obstacles) {
    const r = obstacleRectForLane(layout, ob.laneIndex, ob.y);
    ctx.fillStyle = CARRINHO_LCD_COLORS.obstacleBody;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    const ins = Math.max(2, Math.floor(r.h * 0.12));
    ctx.fillStyle = CARRINHO_LCD_COLORS.obstacleAccent;
    ctx.fillRect(r.x + ins, r.y + ins, r.w - ins * 2, Math.floor(r.h * 0.35));
  }

  const car = carRectForLane(layout, laneIndex);
  ctx.fillStyle = CARRINHO_LCD_COLORS.carBody;
  ctx.fillRect(car.x, car.y, car.w, car.h);

  const winInset = Math.max(2, Math.floor(car.h * 0.15));
  ctx.fillStyle = CARRINHO_LCD_COLORS.carAccent;
  ctx.fillRect(
    car.x + winInset,
    car.y + winInset,
    car.w - winInset * 2,
    Math.floor(car.h * 0.38),
  );

  if (crashed) {
    ctx.fillStyle = 'rgba(120, 20, 20, 0.35)';
    ctx.fillRect(0, 0, canvasWidthPx, canvasHeightPx);
  }

  ctx.restore();
}
