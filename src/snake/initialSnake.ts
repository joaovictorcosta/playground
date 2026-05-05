import {
  GRID_COLUMNS,
  GRID_ROWS,
  INITIAL_SNAKE_LENGTH,
} from './config';
import type { GridPoint, SnakeBody } from './types';

/** Constrói a cobra inicial alinhada à grelha: cabeça à direita, corpo para a esquerda. */
export function createInitialSnake(): SnakeBody {
  const len = INITIAL_SNAKE_LENGTH;
  if (len < 2) {
    throw new Error('INITIAL_SNAKE_LENGTH deve ser pelo menos 2');
  }

  const cy = Math.floor(GRID_ROWS / 2);
  const cx = Math.floor(GRID_COLUMNS / 2);

  /** Cabeça fica próxima do centro à direita; cauda vai para x decrescentes. */
  const headX = cx + Math.floor(len / 2);
  const body: GridPoint[] = [];
  for (let i = 0; i < len; i += 1) {
    const x = headX - i;
    if (x < 0 || x >= GRID_COLUMNS || cy < 0 || cy >= GRID_ROWS) {
      throw new Error('Cobra inicial fora dos limites; ajuste comprimento ou grelha');
    }
    body.push({ x, y: cy });
  }
  return body;
}
