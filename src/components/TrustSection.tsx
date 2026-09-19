interface TrustSectionProps {
  onContactClick?: () => void;
}

/**
 * Resume la información que ayuda a evaluar una unidad antes de solicitar asesoría.
 */
export function TrustSection({ onContactClick }: TrustSectionProps) {
  return (
    <section id="trust-section" className="dealership-trust" aria-label="Información para decidir con confianza">
      <div className="dealership-trust__inner">
        <div className="dealership-trust__header reveal-on-scroll">
          <h2 className="dealership-trust__title">
            Información para decidir con confianza
          </h2>
          <p className="dealership-trust__subtitle">
            Revisa las especificaciones, calcula una cuota de referencia y confirma las condiciones de cada unidad antes de tomar una decisión.
          </p>
        </div>

        <div className="dealership-trust__grid">
          <article className="trust-card reveal-on-scroll reveal-stagger-1">
            <div className="trust-card__icon" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <h3 className="trust-card__title">Revisión de la unidad</h3>
            <p className="trust-card__text">
              La ficha reúne datos de motor, transmisión, equipamiento y dimensiones para comparar cada modelo con claridad.
            </p>
          </article>

          <article className="trust-card reveal-on-scroll reveal-stagger-2">
            <div className="trust-card__icon" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
                <circle cx="6" cy="15" r="1" />
                <circle cx="10" cy="15" r="1" />
              </svg>
            </div>
            <h3 className="trust-card__title">Simulación de financiamiento</h3>
            <p className="trust-card__text">
              Ajusta la prima y el plazo para consultar una cuota estimada. Las condiciones finales deben confirmarse con una entidad financiera.
            </p>
          </article>

          <article className="trust-card reveal-on-scroll reveal-stagger-3">
            <div className="trust-card__icon" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <h3 className="trust-card__title">Documentación y traspaso</h3>
            <p className="trust-card__text">
              Antes de una compra, confirma el historial, la documentación y los requisitos de traspaso con el vendedor.
            </p>
          </article>

          <article className="trust-card reveal-on-scroll reveal-stagger-4">
            <div className="trust-card__icon" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h3 className="trust-card__title">Disponibilidad y entrega</h3>
            <p className="trust-card__text">
              La disponibilidad, ubicación y entrega de cada vehículo se validan durante la cotización.
            </p>
          </article>
        </div>

        <div className="dealership-trust__banner reveal-on-scroll">
          <div className="dealership-trust__banner-content">
            <h3 className="dealership-trust__banner-title">
              ¿Quieres conocer más sobre un vehículo?
            </h3>
            <p className="dealership-trust__banner-desc">
              Consulta la ficha, calcula una cuota de referencia o solicita una cotización para continuar con el proceso.
            </p>
          </div>
          <div className="dealership-trust__banner-actions">
            <a
              href="tel:+50522550000"
              className="trust-cta-btn trust-cta-btn--primary"
              onClick={onContactClick}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <span>Llamar al (+505) 2255-0000</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
