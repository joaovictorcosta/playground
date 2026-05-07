/**
 * Número fixo de faixas (colunas verticais) na estrada. Ajustar aqui altera
 * distribuição e largura de cada faixa no render; manter coerente com o estado inicial.
 */
export const LANE_COUNT = 3 as const;

/**
 * Velocidade da esteira em **pixels CSS por segundo** (vertical).
 * O loop converte para pixels do canvas via proporção à altura do wrap, preservando
 * ritmo visual ao mudar DPR ou redimensionar.
 */
export const ESTEIRA_SPEED_CSS_PX_PER_SEC = 220 as const;

/** Altura (CSS px) de cada “degrau” do padrão da faixa que rola com a esteira. */
export const ROAD_PATTERN_STRIPE_CSS = 28 as const;

/** Tamanho do pool de obstáculos (sem crescimento em runtime). */
export const OBSTACLE_POOL_SIZE = 7 as const;

/** Espaço mínimo (CSS px) entre o topo de um obstáculo e o fundo do seguinte após reciclar. */
export const OBSTACLE_MIN_GAP_CSS = 96 as const;

/** Margem abaixo da vista para considerar o obstáculo “saiu” e reciclar. */
export const OBSTACLE_RECYCLE_MARGIN_CSS = 48 as const;

/** Paleta alinhada ao estilo LCD do Snake (alto contraste, leitura nítida). */
export const CARRINHO_LCD_COLORS = {
  asphalt: '#0c1a08',
  laneStripeA: 'rgba(32, 48, 32, 0.95)',
  laneStripeB: 'rgba(18, 32, 22, 0.98)',
  laneDivider: 'rgba(90, 200, 80, 0.22)',
  carBody: '#2e7d1f',
  carAccent: '#9ae06a',
  obstacleBody: '#8c2a22',
  obstacleAccent: '#e8a090',
} as const;
