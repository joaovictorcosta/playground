import { useCallback, useEffect, useRef } from 'react';
import { LANE_COUNT } from './carrinho/config';
import { createInitialCarrinhoState } from './carrinho/initialState';
import { paintCarrinho } from './carrinho/render';
import type { CarrinhoGameState } from './carrinho/types';

export function CarrinhoGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  /** Estado lógico; `laneIndex` será alterado por input num passo seguinte. */
  const carrinhoStateRef = useRef<CarrinhoGameState>(createInitialCarrinhoState());

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

    paintCarrinho(ctx, canvas.width, canvas.height, {
      laneCount: LANE_COUNT,
      laneIndex: carrinhoStateRef.current.laneIndex,
    });
  }, []);

  const resizeAndPaint = useCallback(() => {
    resizeCanvas();
    drawFrame();
  }, [resizeCanvas, drawFrame]);

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
    canvasRef.current?.focus({ preventScroll: true });
  }, []);

  /** 1-based para o HUD; espelha `carrinhoStateRef.current.laneIndex` (atualizável futuramente por input). */
  const laneDisplayHuman = carrinhoStateRef.current.laneIndex + 1;

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
          Vista em {LANE_COUNT} faixas · Controlos virão nos próximos passos · Foco na pista ao clicar
        </p>
      </div>
    </div>
  );
}
