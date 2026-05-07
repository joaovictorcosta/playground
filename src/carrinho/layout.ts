import type { LaneIndex } from './types';

export type RoadLayout = {
  readonly canvasWidth: number;
  readonly canvasHeight: number;
  readonly topPad: number;
  readonly roadH: number;
  readonly laneCount: number;
  readonly laneEdges: readonly number[];
};

export function computeRoadLayout(
  canvasWidth: number,
  canvasHeight: number,
  laneCount: number,
): RoadLayout {
  const safeLanes = Math.max(1, Math.floor(laneCount));
  const topPad = Math.max(8, Math.floor(canvasHeight * 0.04));
  const roadH = Math.max(1, canvasHeight - topPad);
  const laneEdges: number[] = [];
  for (let i = 0; i <= safeLanes; i += 1) {
    laneEdges.push(Math.floor((i / safeLanes) * canvasWidth));
  }
  return {
    canvasWidth,
    canvasHeight,
    topPad,
    roadH,
    laneCount: safeLanes,
    laneEdges,
  };
}

/** Retângulo do jogador (base da tela, faixa atual). */
export function carRectForLane(layout: RoadLayout, laneIndex: LaneIndex): {
  x: number;
  y: number;
  w: number;
  h: number;
} {
  const idx = Math.min(Math.max(0, laneIndex), layout.laneCount - 1);
  const laneLeft = layout.laneEdges[idx]!;
  const laneW = layout.laneEdges[idx + 1]! - laneLeft;
  const carW = Math.max(12, laneW * 0.55);
  const carH = Math.max(10, layout.canvasHeight * 0.09);
  const carCenterX = laneLeft + laneW / 2;
  const carX = Math.floor(carCenterX - carW / 2);
  const carY = Math.floor(
    layout.canvasHeight - carH - Math.floor(layout.canvasHeight * 0.02),
  );
  return { x: carX, y: carY, w: Math.floor(carW), h: Math.floor(carH) };
}

/** Retângulo de obstáculo centrado na faixa; `yTop` é o topo no espaço do canvas. */
export function obstacleRectForLane(
  layout: RoadLayout,
  laneIndex: LaneIndex,
  yTop: number,
): { x: number; y: number; w: number; h: number } {
  const idx = Math.min(Math.max(0, laneIndex), layout.laneCount - 1);
  const laneLeft = layout.laneEdges[idx]!;
  const laneW = layout.laneEdges[idx + 1]! - laneLeft;
  const refW = Math.max(12, laneW * 0.55);
  const refH = Math.max(10, layout.canvasHeight * 0.09);
  const centerX = laneLeft + laneW / 2;
  const w = Math.floor(refW * 0.85);
  const h = Math.floor(refH * 0.88);
  const x = Math.floor(centerX - w / 2);
  return { x, y: Math.floor(yTop), w, h };
}

export function obstacleHeightForLayout(layout: RoadLayout): number {
  return obstacleRectForLane(layout, 0, 0).h;
}

export function rectsOverlap(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
): boolean {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}
