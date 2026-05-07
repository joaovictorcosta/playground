/**
 * Índice de faixa: 0 .. LANE_COUNT - 1 (extremo esquerdo → direito).
 * Será atualizado por input nos próximos passos; apenas tipo e persistência aqui.
 */
export type LaneIndex = number;

export type CarrinhoGameState = {
  readonly laneIndex: LaneIndex;
};

/** Obstáculo ativo na simulação; `y` é o topo no espaço do canvas (desce com a esteira). */
export type ObstacleSlot = {
  laneIndex: LaneIndex;
  y: number;
};
