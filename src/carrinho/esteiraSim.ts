import {
  OBSTACLE_MIN_GAP_CSS,
  OBSTACLE_POOL_SIZE,
  OBSTACLE_RECYCLE_MARGIN_CSS,
} from './config';
import {
  carRectForLane,
  obstacleHeightForLayout,
  obstacleRectForLane,
  rectsOverlap,
  type RoadLayout,
} from './layout';
import type { LaneIndex, ObstacleSlot } from './types';

function cssScalarToCanvas(
  cssPx: number,
  cssH: number,
  canvasH: number,
): number {
  return (cssPx / Math.max(1, cssH)) * canvasH;
}

export function createPooledObstacles(
  layout: RoadLayout,
  laneCount: number,
  cssH: number,
  rng: () => number,
): ObstacleSlot[] {
  const gap = cssScalarToCanvas(OBSTACLE_MIN_GAP_CSS, cssH, layout.canvasHeight);
  const obsH = obstacleHeightForLayout(layout);
  const pool: ObstacleSlot[] = [];
  for (let i = 0; i < OBSTACLE_POOL_SIZE; i += 1) {
    const y = layout.topPad - obsH - i * (obsH + gap * 0.92);
    pool.push({
      laneIndex: Math.floor(rng() * laneCount) % laneCount,
      y,
    });
  }
  return pool;
}

/**
 * Desloca todos os obstáculos com a esteira e recicla os que saem por baixo,
 * repositionando-os acima do conjunto com nova faixa aleatória (pool de tamanho fixo).
 */
export function advanceEsteiraObstacles(
  obstacles: ObstacleSlot[],
  beltDyCanvas: number,
  layout: RoadLayout,
  laneCount: number,
  cssH: number,
  rng: () => number,
): void {
  const margin = cssScalarToCanvas(
    OBSTACLE_RECYCLE_MARGIN_CSS,
    cssH,
    layout.canvasHeight,
  );
  const minGap = cssScalarToCanvas(
    OBSTACLE_MIN_GAP_CSS,
    cssH,
    layout.canvasHeight,
  );
  const obsH = obstacleHeightForLayout(layout);
  const bottomLimit = layout.canvasHeight + margin;

  for (const o of obstacles) {
    o.y += beltDyCanvas;
  }

  for (const o of obstacles) {
    if (o.y <= bottomLimit) continue;
    let minY = Infinity;
    for (const u of obstacles) {
      if (u !== o) minY = Math.min(minY, u.y);
    }
    if (!Number.isFinite(minY)) {
      minY = layout.topPad - obsH;
    }
    o.y = minY - minGap - obsH;
    o.laneIndex = (Math.floor(rng() * laneCount) % laneCount) as LaneIndex;
  }
}

export function playerHitsObstacle(
  layout: RoadLayout,
  playerLane: LaneIndex,
  obstacles: readonly ObstacleSlot[],
): boolean {
  const car = carRectForLane(layout, playerLane);
  for (const o of obstacles) {
    if (o.laneIndex !== playerLane) continue;
    const obs = obstacleRectForLane(layout, o.laneIndex, o.y);
    if (rectsOverlap(car, obs)) return true;
  }
  return false;
}
