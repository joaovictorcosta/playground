import { LCD_COLORS } from './config';
import type { GridPoint, SnakeBody } from './types';

export type PaintGameOpts = {
  readonly columns: number;
  readonly rows: number;
  readonly snake: SnakeBody;
  readonly food: GridPoint | null;
};

/**
 * Preenche o canvas inteiro em células com largura inteira em píxeis (sem subpíxeis por célula),
 * para leitura nítida estilo LCD.
 */
export function paintGame(
  ctx: CanvasRenderingContext2D,
  canvasWidthPx: number,
  canvasHeightPx: number,
  opts: PaintGameOpts,
): void {
  const { columns, rows, snake, food } = opts;

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  const cellPx = Math.max(
    1,
    Math.min(
      Math.floor(canvasWidthPx / columns),
      Math.floor(canvasHeightPx / rows),
    ),
  );
  const gridW = cellPx * columns;
  const gridH = cellPx * rows;
  const offsetXPx = Math.floor((canvasWidthPx - gridW) / 2);
  const offsetYPy = Math.floor((canvasHeightPx - gridH) / 2);

  ctx.fillStyle = LCD_COLORS.gridBackground;
  ctx.fillRect(0, 0, canvasWidthPx, canvasHeightPx);

  /** Grelha de fundo apenas na área alinhada. */
  ctx.fillStyle = LCD_COLORS.gridBackground;
  ctx.fillRect(offsetXPx, offsetYPy, gridW, gridH);

  ctx.strokeStyle = LCD_COLORS.gridLine;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let gx = 0; gx <= columns; gx += 1) {
    const px = offsetXPx + gx * cellPx + 0.5;
    ctx.moveTo(px, offsetYPy);
    ctx.lineTo(px, offsetYPy + gridH);
  }
  for (let gy = 0; gy <= rows; gy += 1) {
    const py = offsetYPy + gy * cellPx + 0.5;
    ctx.moveTo(offsetXPx, py);
    ctx.lineTo(offsetXPx + gridW, py);
  }
  ctx.stroke();

  const inset = Math.max(0, Math.floor(cellPx * 0.08));

  snake.forEach((seg, idx) => {
    const sx = offsetXPx + seg.x * cellPx + inset;
    const sy = offsetYPy + seg.y * cellPx + inset;
    const w = Math.max(1, cellPx - inset * 2);
    const h = Math.max(1, cellPx - inset * 2);
    ctx.fillStyle = idx === 0 ? LCD_COLORS.snakeHead : LCD_COLORS.snakeBody;
    ctx.fillRect(Math.floor(sx), Math.floor(sy), w, h);
  });

  if (food) {
    const fx = offsetXPx + food.x * cellPx + inset;
    const fy = offsetYPy + food.y * cellPx + inset;
    const fw = Math.max(1, cellPx - inset * 2);
    const fh = Math.max(1, cellPx - inset * 2);
    ctx.fillStyle = LCD_COLORS.food;
    ctx.fillRect(Math.floor(fx), Math.floor(fy), fw, fh);
  }

  ctx.restore();
}
