/**
 * Chave estável namespaced ao projeto (`package.json`: playground-do-jv).
 * Formato estável mesmo que futuras migrações usem outros prefixos.
 */
export const SNAKE_BEST_SCORE_STORAGE_KEY =
  'playground-do-jv:snake:best-score' as const;

export type PersistedBestBaseline = Readonly<{
  /** Melhor pontuação lida ao arranque (0 se ausente ou inválida). */
  value: number;
  /** `false` quando não há `localStorage` ou a leitura falhou — evita gravar por cima de valor desconhecido. */
  readTrusted: boolean;
}>;

function parseStoredInt(raw: string | null): number {
  if (raw === null || raw === '') return 0;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function safeGetLocalStorage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    const ls = window.localStorage;
    if (!ls || typeof ls.getItem !== 'function') return null;
    return ls;
  } catch {
    return null;
  }
}

/**
 * Lê a melhor pontuação gravada sem lançar; `readTrusted` indica se a leitura foi fiável.
 */
export function loadPersistedBestBaseline(): PersistedBestBaseline {
  const ls = safeGetLocalStorage();
  if (!ls) {
    return { value: 0, readTrusted: false };
  }
  try {
    return {
      value: parseStoredInt(ls.getItem(SNAKE_BEST_SCORE_STORAGE_KEY)),
      readTrusted: true,
    };
  } catch {
    return { value: 0, readTrusted: false };
  }
}

/**
 * Grava apenas se não existir problema de quota/privado; falhas são silenciadas (sem lançamento).
 */
export function tryPersistBestScore(value: number): boolean {
  if (!Number.isFinite(value) || value < 0) return false;
  const ls = safeGetLocalStorage();
  if (!ls) return false;
  try {
    const asStr = String(Math.floor(value));
    ls.setItem(SNAKE_BEST_SCORE_STORAGE_KEY, asStr);
    return ls.getItem(SNAKE_BEST_SCORE_STORAGE_KEY) === asStr;
  } catch {
    return false;
  }
}
