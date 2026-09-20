type NotFoundPageProps = {
  onGoHome: () => void;
  onViewInventory: () => void;
};

/** Pantalla de recuperación para rutas que no existen dentro de la aplicación. */
export function NotFoundPage({ onGoHome, onViewInventory }: NotFoundPageProps) {
  return (
    <main className="not-found-page" aria-labelledby="not-found-title">
      <div className="not-found-page__inner">
        <div className="not-found-page__visual" aria-hidden="true">
          <span className="not-found-page__code">404</span>
          <div className="not-found-page__route">
            <span className="not-found-page__route-line" />
            <span className="not-found-page__route-marker" />
            <span className="not-found-page__route-line not-found-page__route-line--short" />
          </div>
        </div>

        <div className="not-found-page__content">
          <p className="not-found-page__label">Ruta no encontrada</p>
          <h1 id="not-found-title">Esta página tomó un desvío.</h1>
          <p className="not-found-page__description">
            La dirección que buscas no está disponible. Regresa al catálogo para seguir explorando vehículos y servicios.
          </p>
          <div className="not-found-page__actions">
            <button type="button" className="not-found-page__button not-found-page__button--primary" onClick={onGoHome}>
              Volver al inicio
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
            <button type="button" className="not-found-page__button not-found-page__button--secondary" onClick={onViewInventory}>
              Explorar inventario
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
