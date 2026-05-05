import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  GAME_TICK_INTERVAL_MS,
  GRID_COLUMNS,
  GRID_ROWS,
} from './snake/config';
import { createInitialSnake } from './snake/initialSnake';
import { paintGame } from './snake/render';
import type { GridPoint } from './snake/types';

/** Telemetria do loop (refs): sem re-render por tick; útil para tuning no DevTools. */
export type SnakeGameLoopTelemetry = {
  /** Ticks lógicos desde o último reset (cada tick = um passo na grelha). */
  tick: number;
  /** Intervalo configurado entre ticks (ms), espelho de GAME_TICK_INTERVAL_MS. */
  tickIntervalMs: number;
  /** Delta do último frame rAF (ms). */
  lastFrameDeltaMs: number;
};

/** Usa `code` para setas (independente do layout); WASD por `key`. */
function eventToDir(e: KeyboardEvent): GridPoint | null {
  switch (e.code) {
    case 'ArrowUp':
      return { x: 0, y: -1 };
    case 'ArrowDown':
      return { x: 0, y: 1 };
    case 'ArrowLeft':
      return { x: -1, y: 0 };
    case 'ArrowRight':
      return { x: 1, y: 0 };
    default:
      break;
  }
  switch (e.key) {
    case 'w':
    case 'W':
      return { x: 0, y: -1 };
    case 's':
    case 'S':
      return { x: 0, y: 1 };
    case 'a':
    case 'A':
      return { x: -1, y: 0 };
    case 'd':
    case 'D':
      return { x: 1, y: 0 };
    default:
      return null;
  }
}

function isMovementCode(code: string): boolean {
  return (
    code === 'ArrowUp' ||
    code === 'ArrowDown' ||
    code === 'ArrowLeft' ||
    code === 'ArrowRight' ||
    code === 'KeyW' ||
    code === 'KeyA' ||
    code === 'KeyS' ||
    code === 'KeyD'
  );
}

function isOppositeDir(cur: GridPoint, want: GridPoint): boolean {
  return (
    (cur.x !== 0 && want.x === -cur.x) ||
    (cur.y !== 0 && want.y === -cur.y)
  );
}

/**
 * Direções pendentes até ao próximo tick: fila FIFO limitada.
 *
 * Regra anti-180° ao **enfileirar**: compara-se `want` com a última direção da
 * cadeia já planeada — último item da fila, ou `dirRef` se a fila estiver vazia.
 * Assim não é possível pedir um invertido num único instante antes do tick; em
 * ticks seguintes, cada movimento válido altera essa referência.
 *
 * Em cada **tick**, só se consome uma entrada; compara-se de novo com `dirRef`
 * (direção já aplicada naquele momento) por segurança.
 *
 * Tamanho máximo: descarta-se a entrada mais antiga se a fila enche (limite
 * baixo evita fila “antiga” após pausa longa).
 */
const MAX_PENDING_DIRECTIONS = 4;

function sameCell(a: GridPoint, b: GridPoint): boolean {
  return a.x === b.x && a.y === b.y;
}

function cellKey(p: GridPoint): string {
  return `${p.x},${p.y}`;
}

function randInt(max: number): number {
  return Math.floor(Math.random() * max);
}

/** Comida numa célula livre (não em `occupied`: cobra e, se aplicável, a própria comida a substituir). */
function spawnFood(occupied: Set<string>): GridPoint {
  const free: GridPoint[] = [];
  for (let y = 0; y < GRID_ROWS; y += 1) {
    for (let x = 0; x < GRID_COLUMNS; x += 1) {
      const c: GridPoint = { x, y };
      if (!occupied.has(cellKey(c))) free.push(c);
    }
  }
  if (free.length === 0) {
    throw new Error('Sem células livres para colocar comida');
  }
  return free[randInt(free.length)]!;
}

/** Garante que a comida não fique sobre a cobra (p.ex. estado inconsistente); mantém posição se já for válida. */
function ensureFoodInEmptyCell(snake: readonly GridPoint[], food: GridPoint): GridPoint {
  const occ = new Set(snake.map(cellKey));
  if (!occ.has(cellKey(food))) return food;
  return spawnFood(occ);
}

/** Qualquer sobreposição da nova cabeça com o corpo é game over (sem exceção da cauda). */
function collisionWithSelf(snake: readonly GridPoint[], next: GridPoint): boolean {
  return snake.some((seg) => sameCell(seg, next));
}

export function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef(0);
  const snakeRef = useRef<GridPoint[]>([...createInitialSnake()]);
  const dirRef = useRef<GridPoint>({ x: 1, y: 0 });
  /** FIFO de direções pedidas; consumida um item por tick no loop. */
  const pendingDirsRef = useRef<GridPoint[]>([]);
  const foodRef = useRef<GridPoint>({ x: 10, y: 10 });
  const aliveRef = useRef(true);
  const pausedRef = useRef(false);
  const loopTelemetryRef = useRef<SnakeGameLoopTelemetry>({
    tick: 0,
    tickIntervalMs: GAME_TICK_INTERVAL_MS,
    lastFrameDeltaMs: 0,
  });

  const [score, setScoreState] = useState(0);
  const [overlay, setOverlay] = useState<'none' | 'paused' | 'gameover'>('none');

  const resetGame = useCallback(() => {
    snakeRef.current = [...createInitialSnake()];
    dirRef.current = { x: 1, y: 0 };
    pendingDirsRef.current = [];
    aliveRef.current = true;
    pausedRef.current = false;
    scoreRef.current = 0;
    loopTelemetryRef.current.tick = 0;
    loopTelemetryRef.current.tickIntervalMs = GAME_TICK_INTERVAL_MS;
    const occ = new Set(snakeRef.current.map(cellKey));
    foodRef.current = spawnFood(occ);
    setScoreState(0);
    setOverlay('none');
  }, []);

  const resizeCanvas = useCallback(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
    const cssW = wrap.clientWidth;
    const cssH = wrap.clientHeight;
    canvas.width = Math.max(1, Math.floor(cssW * dpr));
    canvas.height = Math.max(1, Math.floor(cssH * dpr));
  }, []);

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    paintGame(ctx, canvas.width, canvas.height, {
      columns: GRID_COLUMNS,
      rows: GRID_ROWS,
      snake: snakeRef.current,
      food: foodRef.current,
    });
  }, []);

  useEffect(() => {
    resizeCanvas();
    const ro =
      typeof ResizeObserver !== 'undefined' && wrapRef.current
        ? new ResizeObserver(() => resizeCanvas())
        : null;
    if (ro && wrapRef.current) ro.observe(wrapRef.current);
    window.addEventListener('resize', resizeCanvas);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [resizeCanvas]);

  /** Foco inicial no canvas: teclado não usa `window`, só este alvo. */
  useEffect(() => {
    canvasRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (e.repeat) return;
        if (!aliveRef.current) return;
        pausedRef.current = !pausedRef.current;
        setOverlay(pausedRef.current ? 'paused' : 'none');
        return;
      }

      const restartKeys = ['Enter', 'NumpadEnter'];
      if (!aliveRef.current && restartKeys.includes(e.code)) {
        e.preventDefault();
        resetGame();
        return;
      }

      const want = eventToDir(e);
      if (!want) return;

      const isNav = isMovementCode(e.code);
      /*
       * Key repeat do SO: ignorar para movimento evita rajadas na fila / ticks
       * estranhos; uma direção já pedida permanece até ao próximo tick.
       */
      if (isNav && e.repeat) return;

      if (
        e.code === 'ArrowUp' ||
        e.code === 'ArrowDown' ||
        e.code === 'ArrowLeft' ||
        e.code === 'ArrowRight'
      ) {
        e.preventDefault();
      }

      if (!aliveRef.current || pausedRef.current) return;

      const q = pendingDirsRef.current;
      const refTail = q.length > 0 ? q[q.length - 1]! : dirRef.current;
      if (sameCell(want, refTail)) return;
      if (isOppositeDir(refTail, want)) return;
      if (q.length >= MAX_PENDING_DIRECTIONS) q.shift();
      q.push(want);
    };

    canvas.addEventListener('keydown', onKeyDown);
    return () => canvas.removeEventListener('keydown', onKeyDown);
  }, [resetGame]);

  /** Em DEV, inspecionar no console: `window.__SNAKE_GAME_LOOP__`. */
  useEffect(() => {
    if (import.meta.env.DEV) {
      (
        window as Window & { __SNAKE_GAME_LOOP__?: typeof loopTelemetryRef }
      ).__SNAKE_GAME_LOOP__ = loopTelemetryRef;
    }
    return () => {
      if (import.meta.env.DEV) {
        delete (window as Window & { __SNAKE_GAME_LOOP__?: unknown })
          .__SNAKE_GAME_LOOP__;
      }
    };
  }, []);

  useEffect(() => {
    const occ = new Set(snakeRef.current.map(cellKey));
    foodRef.current = spawnFood(occ);
    drawFrame();
  }, [drawFrame]);

  useEffect(() => {
    let acc = 0;
    let last = performance.now();
    let rafId = 0;
    const tickMs = GAME_TICK_INTERVAL_MS;
    loopTelemetryRef.current.tickIntervalMs = tickMs;

    const loop = (now: number) => {
      rafId = requestAnimationFrame(loop);
      const telem = loopTelemetryRef.current;
      telem.lastFrameDeltaMs = now - last;

      if (!aliveRef.current) {
        last = now;
        drawFrame();
        return;
      }
      if (pausedRef.current) {
        last = now;
        drawFrame();
        return;
      }

      acc += now - last;
      last = now;

      while (acc >= tickMs) {
        acc -= tickMs;
        telem.tick += 1;
        let dir = dirRef.current;
        const q = pendingDirsRef.current;
        if (q.length > 0) {
          const queued = q.shift()!;
          if (!isOppositeDir(dir, queued)) dir = queued;
        }
        dirRef.current = dir;

        const snake = snakeRef.current;
        foodRef.current = ensureFoodInEmptyCell(snake, foodRef.current);

        const head = snake[0];
        const next: GridPoint = { x: head.x + dir.x, y: head.y + dir.y };

        if (
          next.x < 0 ||
          next.x >= GRID_COLUMNS ||
          next.y < 0 ||
          next.y >= GRID_ROWS
        ) {
          aliveRef.current = false;
          setOverlay('gameover');
          break;
        }

        const eats = sameCell(next, foodRef.current);
        if (collisionWithSelf(snake, next)) {
          aliveRef.current = false;
          setOverlay('gameover');
          break;
        }

        const prev = snake.slice();
        if (eats) {
          snakeRef.current = [next, ...prev];
          scoreRef.current += 1;
          setScoreState(scoreRef.current);
          const occAfterEat = new Set(snakeRef.current.map(cellKey));
          foodRef.current = spawnFood(occAfterEat);
        } else {
          snakeRef.current = [next, ...prev.slice(0, -1)];
        }
      }

      drawFrame();
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [drawFrame]);

  return (
    <div className="snake-app">
      <header className="snake-hud" aria-live="polite">
        <h1 className="snake-title">Snake</h1>
        <dl className="snake-stats">
          <div>
            <dt>Pontuação</dt>
            <dd>{score}</dd>
          </div>
          <div>
            <dt>Intervalo (tick)</dt>
            <dd>{GAME_TICK_INTERVAL_MS} ms</dd>
          </div>
        </dl>
      </header>
      <div className="snake-stage">
        <div className="snake-canvas-wrap" ref={wrapRef}>
          <canvas
            ref={canvasRef}
            className="snake-canvas"
            aria-label="Área do jogo Snake"
            tabIndex={0}
            role="application"
          />
          {overlay !== 'none' && (
            <div className="snake-overlay" role="dialog" aria-modal="true">
              {overlay === 'paused' && (
                <>
                  <p className="snake-overlay-title">Pausa</p>
                  <p className="snake-overlay-hint">Espaço para continuar.</p>
                </>
              )}
              {overlay === 'gameover' && (
                <>
                  <p className="snake-overlay-title">Game over</p>
                  <p className="snake-overlay-hint">Enter para recomeçar.</p>
                </>
              )}
            </div>
          )}
        </div>
        <p className="snake-help">
          Setas ou WASD quando esta área estiver focada (clique no jogo se o teclado não responder) · Espaço pausa · Enter recomeça após game over
        </p>
      </div>
    </div>
  );
}
