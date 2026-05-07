import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ESTEIRA_SPEED_CSS_PX_PER_SEC,
  LANE_COUNT,
  ROAD_PATTERN_STRIPE_CSS,
} from './carrinho/config';
import {
  advanceEsteiraObstacles,
  createPooledObstacles,
  playerHitsObstacle,
} from './carrinho/esteiraSim';
import { createInitialCarrinhoState } from './carrinho/initialState';
import { computeRoadLayout } from './carrinho/layout';
import { paintCarrinho } from './carrinho/render';
import type { CarrinhoGameState, ObstacleSlot } from './carrinho/types';

/** Desktop: só ←/→ mudam de faixa (incremento/decremento com clamp nas bordas). */
function steerDelta(e: KeyboardEvent): -1 | 0 | 1 {
  switch (e.code) {
    case 'ArrowLeft':
      return -1;
    case 'ArrowRight':
      return 1;
    default:
      return 0;
  }
}

function isSteerKey(e: KeyboardEvent): boolean {
  return e.code === 'ArrowLeft' || e.code === 'ArrowRight';
}

export function CarrinhoGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const carrinhoStateRef = useRef<CarrinhoGameState>(createInitialCarrinhoState());
  const gameOverRef = useRef(false);
  const simRef = useRef({
    roadScroll: 0,
    obstacles: [] as ObstacleSlot[],
    ready: false,
  });

  const [hud, setHud] = useState(() => ({
    lane: carrinhoStateRef.current.laneIndex,
    gameOver: false,
  }));

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

  const resetSimulationOnly = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const layout = computeRoadLayout(canvas.width, canvas.height, LANE_COUNT);
    simRef.current.obstacles = createPooledObstacles(
      layout,
      LANE_COUNT,
      wrap.clientHeight,
      Math.random,
    );
    simRef.current.roadScroll = 0;
    simRef.current.ready = true;
  }, []);

  const fullRestart = useCallback(() => {
    gameOverRef.current = false;
    carrinhoStateRef.current = createInitialCarrinhoState();
    setHud({
      lane: carrinhoStateRef.current.laneIndex,
      gameOver: false,
    });
    resetSimulationOnly();
  }, [resetSimulationOnly]);

  const paintOneFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const stripeCanvas =
      (ROAD_PATTERN_STRIPE_CSS / Math.max(1, wrap.clientHeight)) * canvas.height;
    paintCarrinho(ctx, canvas.width, canvas.height, {
      laneCount: LANE_COUNT,
      laneIndex: carrinhoStateRef.current.laneIndex,
      roadScrollOffset: simRef.current.roadScroll,
      roadPatternStripeCanvas: stripeCanvas,
      obstacles: simRef.current.obstacles,
      gameOver: gameOverRef.current,
    });
  }, []);

  const resizeAndPaint = useCallback(() => {
    resizeCanvas();
    carrinhoStateRef.current = createInitialCarrinhoState();
    gameOverRef.current = false;
    setHud({
      lane: carrinhoStateRef.current.laneIndex,
      gameOver: false,
    });
    resetSimulationOnly();
    paintOneFrame();
  }, [resizeCanvas, resetSimulationOnly, paintOneFrame]);

  useEffect(() => {
    resizeAndPaint();
    const ro =
      typeof ResizeObserver !== 'undefined' && wrapRef.current
        ? new ResizeObserver(() => resizeAndPaint())
        : null;
    if (ro && wrapRef.current) ro.observe(wrapRef.current);
    window.addEventListener('resize', resizeAndPaint);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', resizeAndPaint);
    };
  }, [resizeAndPaint]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      const canvas = canvasRef.current;
      const wrap = wrapRef.current;
      if (canvas && wrap && simRef.current.ready) {
        const layout = computeRoadLayout(canvas.width, canvas.height, LANE_COUNT);
        const beltSpeedCanvasPerSec =
          (ESTEIRA_SPEED_CSS_PX_PER_SEC / Math.max(1, wrap.clientHeight)) *
          canvas.height;
        const dy = beltSpeedCanvasPerSec * dt;

        if (!gameOverRef.current) {
          simRef.current.roadScroll += dy;
          advanceEsteiraObstacles(
            simRef.current.obstacles,
            dy,
            layout,
            LANE_COUNT,
            wrap.clientHeight,
            Math.random,
          );
          if (
            playerHitsObstacle(
              layout,
              carrinhoStateRef.current.laneIndex,
              simRef.current.obstacles,
            )
          ) {
            gameOverRef.current = true;
            setHud((h) => ({ ...h, gameOver: true }));
          }
        }

        paintOneFrame();
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [paintOneFrame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' && gameOverRef.current) {
        e.preventDefault();
        fullRestart();
        return;
      }
      if (e.code === 'KeyR' && gameOverRef.current) {
        e.preventDefault();
        fullRestart();
        return;
      }
      if (gameOverRef.current) return;

      const d = steerDelta(e);
      if (d === 0) return;

      if (isSteerKey(e) && e.target === canvas) {
        e.preventDefault();
      }

      const next = carrinhoStateRef.current.laneIndex + d;
      if (next < 0 || next >= LANE_COUNT) return;

      carrinhoStateRef.current = { laneIndex: next };
      setHud((h) => ({ ...h, lane: next }));
    };

    canvas.addEventListener('keydown', onKey);
    return () => canvas.removeEventListener('keydown', onKey);
  }, [fullRestart]);

  useEffect(() => {
    canvasRef.current?.focus({ preventScroll: true });
  }, []);

  const laneDisplayHuman = hud.lane + 1;

  return (
    <div className="carrinho-app">
      <header className="carrinho-hud" aria-live="polite">
        <h1 className="carrinho-title">Carrinho</h1>
        <dl className="carrinho-stats">
          <div>
            <dt>Faixa</dt>
            <dd>
              {laneDisplayHuman}/{LANE_COUNT}
            </dd>
          </div>
          <div>
            <dt>Estado</dt>
            <dd>{hud.gameOver ? 'Game over — Espaço ou R' : 'A andar'}</dd>
          </div>
        </dl>
      </header>
      <div className="carrinho-stage">
        <div className="carrinho-canvas-wrap" ref={wrapRef}>
          <canvas
            ref={canvasRef}
            className="carrinho-canvas"
            aria-label="Área do jogo Carrinho"
            tabIndex={0}
            role="application"
          />
        </div>
        <p className="carrinho-help">
          Apenas ← e → para mudar de faixa · Esteira e obstáculos descem · Espaço ou R para
          recomeçar após game over
        </p>
      </div>
    </div>
  );
}
