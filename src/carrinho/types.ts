/**
 * Índice de faixa: 0 .. LANE_COUNT - 1 (extremo esquerdo → direito).
 * Será atualizado por input nos próximos passos; apenas tipo e persistência aqui.
 */
export type LaneIndex = number;

export type CarrinhoGameState = {
  readonly laneIndex: LaneIndex;
};
