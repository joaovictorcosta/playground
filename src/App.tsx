import { useCallback, useEffect, useState } from 'react';
import { CarrinhoGame } from './CarrinhoGame';
import { SnakeGame } from './SnakeGame';

export type ActiveGame = 'menu' | 'snake' | 'carrinho';

export default function App() {
  const [active, setActive] = useState<ActiveGame>('menu');

  const goMenu = useCallback(() => setActive('menu'), []);
  const goSnake = useCallback(() => setActive('snake'), []);
  const goCarrinho = useCallback(() => setActive('carrinho'), []);

  useEffect(() => {
    if (active === 'menu') {
      document.title = 'Playground do JV — Jogos';
      return;
    }
    if (active === 'snake') {
      document.title = 'Snake — Playground do JV';
      return;
    }
    document.title = 'Carrinho — Playground do JV';
  }, [active]);

  return (
    <main className="shell">
      <div className="app-stack">
        {active !== 'menu' && (
          <div className="app-nav">
            <button
              type="button"
              className="app-nav-back"
              onClick={goMenu}
            >
              ← Menu de jogos
            </button>
          </div>
        )}

        {active === 'menu' && (
          <section className="game-menu" aria-label="Escolher jogo">
            <h1 className="game-menu-title">Playground</h1>
            <p className="game-menu-lead">Escolhe um jogo:</p>
            <div className="game-menu-actions">
              <button
                type="button"
                className="game-menu-btn game-menu-btn--snake"
                onClick={goSnake}
              >
                Snake
              </button>
              <button
                type="button"
                className="game-menu-btn game-menu-btn--carrinho"
                onClick={goCarrinho}
              >
                Carrinho
              </button>
            </div>
          </section>
        )}

        {active === 'snake' && <SnakeGame />}
        {active === 'carrinho' && <CarrinhoGame />}
      </div>
    </main>
  );
}
