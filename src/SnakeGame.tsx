import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

type Point = { x: number; y: number };

const GRID_COLS = 20;
const GRID_ROWS = 20;
const BASE_TICK_MS = 165;
const MIN_TICK_MS = 75;
const SPEED_STEP_POINTS = 4;

function keyToDir(key: string): Point | null {
  switch (key) {
    case 'ArrowUp':
    case 'w':
    case 'W':
      return { x: 0, y: -1 };
    case 'ArrowDown':
    case 's':
    case 'S':
      return { x: 0, y: 1 };
    case 'ArrowLeft':
    case 'a':
    case 'A':
      return { x: -1, y: 0 };
    case 'ArrowRight':
    case 'd':
    case 'D':
      return { x: 1, y: 0 };
    default:
      return null;
  }
}

function sameCell(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y;
}

function cellKey(p: Point): string {
  return `${p.x},${p.y}`;
}

function randInt(max: number): number {
  return Math.floor(Math.random() * max);
}

function spawnFood(occupied: Set<string>): Point {
  let p: Point;
  do {
    p = { x: randInt(GRID_COLS), y: randInt(GRID_ROWS) };
  } while (occupied.has(cellKey(p)));
  return p;
}

function initialSnake(): Point[] {
  const y = Math.floor(GRID_ROWS / 2);
  const x = Math.floor(GRID_COLS / 2);
  return [
    { x, y },
    { x: x + 1, y },
    { x: x + 2, y },
  ];
}

function tickMsForScore(s: number): number {
  return Math.max(MIN_TICK_MS, BASE_TICK_MS - Math.floor(s / SPEED_STEP_POINTS) * 8);
}

export function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef(0);
  const snakeRef = useRef<Point[]>(initialSnake());
  const dirRef = useRef<Point>({ x: 1, y: 0 });
  const nextDirRef = useRef<Point | null>(null);
  const foodRef = useRef<Point>({ x: 10, y: 10 });
  const aliveRef = useRef(true);
  const pausedRef = useRef(false);

  const [score, setScoreState] = useState(0);
  const [overlay, setOverlay] = useState<'none' | 'paused' | 'gameover'>('none');

  const resetGame = useCallback(() => {
    snakeRef.current = initialSnake();
    dirRef.current = { x: 1, y: 0 };
    nextDirRef.current = null;
    aliveRef.current = true;
    pausedRef.current = false;
    scoreRef.current = 0;
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

    const cw = canvas.width;
    const ch = canvas.height;
    const cellW = cw / GRID_COLS;
    const cellH = ch / GRID_ROWS;

    ctx.fillStyle = '#0a1628';
    ctx.fillRect(0, 0, cw, ch);

    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let gx = 0; gx <= GRID_COLS; gx++) {
      const px = gx * cellW + 0.5;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, ch);
      ctx.stroke();
    }
    for (let gy = 0; gy <= GRID_ROWS; gy++) {
      const py = gy * cellH + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(cw, py);
      ctx.stroke();
    }

    const pad = Math.max(cellW, cellH) * 0.12;
    const food = foodRef.current;
    ctx.fillStyle = '#ff8266';
    ctx.beginPath();
    ctx.arc(
      food.x * cellW + cellW / 2,
      food.y * cellH + cellH / 2,
      Math.min(cellW, cellH) / 2 - pad,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    const snake = snakeRef.current;
    snake.forEach((seg, i) => {
      const deep = i / Math.max(snake.length - 1, 1);
      const g = Math.round(115 + deep * 80);
      ctx.fillStyle =
        i === snake.length - 1
          ? '#8fb1ff'
          : `rgb(${g}, ${176 + Math.round(deep * 40)}, ${255})`;
      ctx.fillRect(
        seg.x * cellW + pad,
        seg.y * cellH + pad,
        cellW - pad * 2,
        cellH - pad * 2,
      );
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

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
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

      const want = keyToDir(e.key);
      if (!want) return;

      const navKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
      if (navKeys.includes(e.key)) e.preventDefault();

      if (!aliveRef.current || pausedRef.current) return;

      const cur = dirRef.current;
      const isOpposite =
        (cur.x !== 0 && want.x === -cur.x) ||
        (cur.y !== 0 && want.y === -cur.y);
      if (!isOpposite) nextDirRef.current = want;
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [resetGame]);

  useEffect(() => {
    const occ = new Set(snakeRef.current.map(cellKey));
    foodRef.current = spawnFood(occ);
    drawFrame();
  }, [drawFrame]);

  useEffect(() => {
    let acc = 0;
    let last = performance.now();
    let rafId = 0;

    const loop = (now: number) => {
      rafId = requestAnimationFrame(loop);
      if (!aliveRef.current) {
        drawFrame();
        return;
      }
      if (pausedRef.current) {
        last = now;
        drawFrame();
        return;
      }

      const tickMs = tickMsForScore(scoreRef.current);

      acc += now - last;
      last = now;

      while (acc >= tickMs) {
        acc -= tickMs;
        let dir = dirRef.current;
        const queued = nextDirRef.current;
        if (queued) {
          const isOpposite =
            (dir.x !== 0 && queued.x === -dir.x) ||
            (dir.y !== 0 && queued.y === -dir.y);
          if (!isOpposite) dir = queued;
          nextDirRef.current = null;
        }
        dirRef.current = dir;

        const head = snakeRef.current[snakeRef.current.length - 1];
        const next: Point = { x: head.x + dir.x, y: head.y + dir.y };

        if (
          next.x < 0 ||
          next.x >= GRID_COLS ||
          next.y < 0 ||
          next.y >= GRID_ROWS
        ) {
          aliveRef.current = false;
          setOverlay('gameover');
          break;
        }

        const hitSelf = snakeRef.current.some((s) => sameCell(s, next));
        if (hitSelf) {
          aliveRef.current = false;
          setOverlay('gameover');
          break;
        }

        const eats = sameCell(next, foodRef.current);
        const nextSnake = snakeRef.current.slice();
        nextSnake.push(next);
        if (!eats) nextSnake.shift();
        snakeRef.current = nextSnake;

        if (eats) {
          scoreRef.current += 1;
          setScoreState(scoreRef.current);
          foodRef.current = spawnFood(new Set(nextSnake.map(cellKey)));
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
            <dt>Intervalo</dt>
            <dd>{tickMsForScore(score)} ms</dd>
          </div>
        </dl>
      </header>
      <div className="snake-stage">
        <div className="snake-canvas-wrap" ref={wrapRef}>
          <canvas ref={canvasRef} className="snake-canvas" aria-label="Área do jogo Snake" />
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
          Setas ou WASD para mover · Espaço pausa · Enter recomeça após game over
        </p>
      </div>
    </div>
  );
}
