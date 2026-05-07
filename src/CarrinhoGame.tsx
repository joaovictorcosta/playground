/**
 * Stub do jogo Carrinho: montar aqui canvas, loop e controlos quando existirem.
 * Garantir cleanup de requestAnimationFrame, timers e listeners ao desmontar (padrão do Snake).
 */
export function CarrinhoGame() {
  return (
    <div className="carrinho-app">
      <header className="carrinho-hud">
        <h1 className="carrinho-title">Carrinho</h1>
        <p className="carrinho-subtitle">Em breve</p>
      </header>
      <div className="carrinho-placeholder" aria-hidden="true">
        <span className="carrinho-placeholder-icon" aria-hidden="true">
          🏎️
        </span>
        <p className="carrinho-placeholder-text">
          Área reservada para o jogo. Lógica e arte serão ligadas neste painel.
        </p>
      </div>
    </div>
  );
}
