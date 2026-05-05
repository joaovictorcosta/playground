/**
 * Grelha do jogo: N colunas × M linhas (células discretas).
 * Ajuste aqui antes de outros passos (movimento/col); o render usa estes valores.
 */
export const GRID_COLUMNS = 28 as const;
export const GRID_ROWS = 26 as const;

/** Comprimento inicial da cobra (células), cabeça incluída; deve ser ≥ 2. */
export const INITIAL_SNAKE_LENGTH = 5 as const;

/**
 * Intervalo entre ticks lógicos (ms). A cobra avança uma célula por tick.
 * Para alterar a velocidade: edite este valor (menor = mais rápido) ou use
 * `1000 / GAME_TICK_INTERVAL_MS` para células por segundo (~6,06 cél/s em 165 ms).
 */
export const GAME_TICK_INTERVAL_MS = 165 as const;

/** Paleta estilo LCD / telefone clássico (alto contraste). */
export const LCD_COLORS = {
  gridBackground: '#0c1a08',
  gridLine: 'rgba(90, 200, 80, 0.12)',
  snakeBody: '#2e7d1f',
  snakeHead: '#9ae06a',
  food: '#c41e3a',
} as const;
