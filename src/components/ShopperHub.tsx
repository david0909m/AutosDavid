interface ShopperHubProps {
  onExploreInventory: () => void;
  onViewFinancing: () => void;
  onViewTrust: () => void;
  onDirectContact: () => void;
}

/**
 * Barra de accesos rápidos para compradores, inspirada en los cuatro pilares de decisión de Chevrolet.com:
 * 1. Cotizador / Financiamiento
 * 2. Explorar inventario certificado
 * 3. Planes bancarios y garantía
 * 4. Asesoría directa y pruebas de manejo
 */
export function ShopperHub({
  onExploreInventory,
  onViewFinancing,
  onViewTrust,
  onDirectContact,
}: ShopperHubProps) {
  return (
    <section className="shopper-hub" aria-label="Accesos rápidos del concesionario">
      <div className="shopper-hub__inner">
        <button
          type="button"
          className="shopper-hub__card reveal-on-scroll reveal-stagger-1"
          onClick={onViewFinancing}
        >
          <div className="shopper-hub__icon-wrapper" aria-hidden="true">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
              <line x1="7" y1="15" x2="7.01" y2="15" />
              <line x1="11" y1="15" x2="13" y2="15" />
            </svg>
          </div>
          <div className="shopper-hub__text">
            <span className="shopper-hub__title">Financiamiento</span>
            <span className="shopper-hub__subtitle">Calcula una cuota de referencia</span>
          </div>
          <span className="shopper-hub__arrow" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </span>
        </button>

        <button
          type="button"
          className="shopper-hub__card reveal-on-scroll reveal-stagger-2"
          onClick={onExploreInventory}
        >
          <div className="shopper-hub__icon-wrapper" aria-hidden="true">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
          </div>
          <div className="shopper-hub__text">
            <span className="shopper-hub__title">Explorar inventario</span>
            <span className="shopper-hub__subtitle">Compara modelos, precios y versiones</span>
          </div>
          <span className="shopper-hub__arrow" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </span>
        </button>

        <button
          type="button"
          className="shopper-hub__card reveal-on-scroll reveal-stagger-3"
          onClick={onViewTrust}
        >
          <div className="shopper-hub__icon-wrapper" aria-hidden="true">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <div className="shopper-hub__text">
            <span className="shopper-hub__title">Información y condiciones</span>
            <span className="shopper-hub__subtitle">Verifica los datos antes de cotizar</span>
          </div>
          <span className="shopper-hub__arrow" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </span>
        </button>

        <button
          type="button"
          className="shopper-hub__card reveal-on-scroll reveal-stagger-4"
          onClick={onDirectContact}
        >
          <div className="shopper-hub__icon-wrapper" aria-hidden="true">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </div>
          <div className="shopper-hub__text">
            <span className="shopper-hub__title">Asesoría & PBX</span>
            <span className="shopper-hub__subtitle">Atención en Managua (+505 2255-0000)</span>
          </div>
          <span className="shopper-hub__arrow" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </span>
        </button>
      </div>
    </section>
  );
}
