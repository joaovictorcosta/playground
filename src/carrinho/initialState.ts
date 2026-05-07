import { LANE_COUNT } from './config';
import type { CarrinhoGameState } from './types';

/**
 * Estado inicial ao arrancar / reiniciar partida.
 * `laneIndex` começa na **faixa central** quando `LANE_COUNT` é ímpar; com número
 * par de faixas, usa-se a faixa imediatamente à esquerda do centro geométrico.
 */
export function createInitialCarrinhoState(): CarrinhoGameState {
  const laneIndex = Math.floor((LANE_COUNT - 1) / 2);
  return { laneIndex };
}
