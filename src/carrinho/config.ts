/**
 * Número fixo de faixas (colunas verticais) na estrada. Ajustar aqui altera
 * distribuição e largura de cada faixa no render; manter coerente com o estado inicial.
 */
export const LANE_COUNT = 3 as const;

/** Paleta alinhada ao estilo LCD do Snake (alto contraste, leitura nítida). */
export const CARRINHO_LCD_COLORS = {
  asphalt: '#0c1a08',
  laneStripeA: 'rgba(32, 48, 32, 0.95)',
  laneStripeB: 'rgba(18, 32, 22, 0.98)',
  laneDivider: 'rgba(90, 200, 80, 0.22)',
  carBody: '#2e7d1f',
  carAccent: '#9ae06a',
} as const;
