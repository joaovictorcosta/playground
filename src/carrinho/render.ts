import { CARRINHO_LCD_COLORS } from './config';
import type { LaneIndex } from './types';

export type PaintCarrinhoOpts = {
  readonly laneCount: number;
  readonly laneIndex: LaneIndex;
};

/**
 * Desenha a estrada em faixas verticais e o veículo na base, centrado na faixa ativa.
 * Somente visual; sem colisão nem obstáculos.
 */
export function paintCarrinho(
  ctx: CanvasRenderingContext2D,
  canvasWidthPx: number,
  canvasHeightPx: number,
  opts: PaintCarrinhoOpts,
): void {
  const { laneCount, laneIndex } = opts;

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  ctx.fillStyle = CARRINHO_LCD_COLORS.asphalt;
  ctx.fillRect(0, 0, canvasWidthPx, canvasHeightPx);

  const safeLanes = Math.max(1, Math.floor(laneCount));

  const topPad = Math.max(8, Math.floor(canvasHeightPx * 0.04));
  const roadH = Math.max(1, canvasHeightPx - topPad);
  const laneEdges: number[] = [];
  for (let i = 0; i <= safeLanes; i += 1) {
    laneEdges.push(Math.floor((i / safeLanes) * canvasWidthPx));
  }

  for (let i = 0; i < safeLanes; i += 1) {
    ctx.fillStyle =
      i % 2 === 0
        ? CARRINHO_LCD_COLORS.laneStripeA
        : CARRINHO_LCD_COLORS.laneStripeB;
    const left = laneEdges[i]!;
    const w = laneEdges[i + 1]! - left;
    ctx.fillRect(left, topPad, Math.max(1, w), roadH);
  }

  ctx.strokeStyle = CARRINHO_LCD_COLORS.laneDivider;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let g = 1; g < safeLanes; g += 1) {
    const px = laneEdges[g]! + 0.5;
    ctx.moveTo(px, topPad);
    ctx.lineTo(px, topPad + roadH);
  }
  ctx.stroke();

  const idx = Math.min(Math.max(0, laneIndex), safeLanes - 1);
  const laneLeft = laneEdges[idx]!;
  const laneW = laneEdges[idx + 1]! - laneLeft;
  const carW = Math.max(12, laneW * 0.55);
  const carH = Math.max(10, canvasHeightPx * 0.09);
  const carCenterX = laneLeft + laneW / 2;
  const carX = Math.floor(carCenterX - carW / 2);
  const carY = Math.floor(canvasHeightPx - carH - Math.floor(canvasHeightPx * 0.02));

  ctx.fillStyle = CARRINHO_LCD_COLORS.carBody;
  ctx.fillRect(carX, carY, Math.floor(carW), Math.floor(carH));

  const winInset = Math.max(2, Math.floor(carH * 0.15));
  ctx.fillStyle = CARRINHO_LCD_COLORS.carAccent;
  ctx.fillRect(
    carX + winInset,
    carY + winInset,
    Math.floor(carW - winInset * 2),
    Math.floor(carH * 0.38),
  );

  ctx.restore();
}
