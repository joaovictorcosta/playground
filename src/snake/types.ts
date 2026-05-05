/** Coordenadas em células da grelha; origem (0,0) no canto superior esquerdo. */
export type GridPoint = {
  readonly x: number;
  readonly y: number;
};

/** Segmentos ordenados cabeça → cauda: índice 0 é sempre a cabeça. */
export type SnakeBody = readonly GridPoint[];
