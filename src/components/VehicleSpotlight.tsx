import type { Vehicle } from "../types/vehicle";

interface VehicleSpotlightProps {
  vehicle: Vehicle;
  onSelect: (vehicleId: string) => void;
  onViewFinancing: () => void;
}

const priceFormatterUSD = new Intl.NumberFormat("es-NI", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const priceFormatterNIO = new Intl.NumberFormat("es-NI", {
  style: "currency",
  currency: "NIO",
  maximumFractionDigits: 0,
});

/**
 * Cartel de incentivo y modelo destacado, inspirado en el billboard de campaña de Chevrolet.com
 * ("THE POWER AND DEPENDABILITY YOU NEED" / "New offers for you").
 */
export function VehicleSpotlight({
  vehicle,
  onSelect,
  onViewFinancing,
}: VehicleSpotlightProps) {
  // Cálculo de cuota estimada de referencia (20% de prima, 72 meses, 9.5% tasa anual referencial)
  const downPayment = vehicle.price * 0.2;
  const loanAmount = vehicle.price - downPayment;
  const monthlyRate = 0.095 / 12;
  const months = 72;
  const estimatedMonthly = Math.round(
    (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, months))) /
      (Math.pow(1 + monthlyRate, months) - 1),
  );
  const estimatedMonthlyNIO = Math.round(
    estimatedMonthly * (vehicle.priceNIO / vehicle.price),
  );

  return (
    <section className="vehicle-spotlight" aria-label="Vehículo destacado del mes">
      <div className="vehicle-spotlight__container reveal-on-scroll">
        <div className="vehicle-spotlight__content">
          <h2 className="vehicle-spotlight__title">
            {vehicle.brand} {vehicle.model} {vehicle.year}
          </h2>

          <p className="vehicle-spotlight__slogan">
            {vehicle.slogan || vehicle.description}
          </p>

          <div className="vehicle-spotlight__financing-card">
            <div className="vehicle-spotlight__financial-row">
              <div className="vehicle-spotlight__col">
                <span className="financial-label">Precio al contado:</span>
                <span className="financial-value">
                  {priceFormatterNIO.format(vehicle.priceNIO)}
                </span>
                <span className="financial-sub">
                  {priceFormatterUSD.format(vehicle.price)}
                </span>
              </div>

              <div className="vehicle-spotlight__divider" aria-hidden="true" />

              <div className="vehicle-spotlight__col vehicle-spotlight__col--highlight">
                <span className="financial-label">Cuota mensual estimada:</span>
                <span className="financial-value financial-value--accent">
                  {priceFormatterNIO.format(estimatedMonthlyNIO)}
                  <span className="financial-period">/mes*</span>
                </span>
                <span className="financial-sub">
                  {priceFormatterUSD.format(estimatedMonthly)}/mes · Prima 20% · Plazo 72 meses
                </span>
              </div>
            </div>
          </div>

          {vehicle.metrics && vehicle.metrics.length > 0 && (
            <div className="vehicle-spotlight__specs">
              {vehicle.metrics.slice(0, 4).map((metric) => (
                <div key={metric.label} className="spotlight-spec">
                  <span className="spotlight-spec__label">{metric.label}</span>
                  <strong className="spotlight-spec__value">{metric.value}</strong>
                </div>
              ))}
            </div>
          )}

          <div className="vehicle-spotlight__actions">
            <button
              type="button"
              className="spotlight-btn spotlight-btn--primary"
              onClick={() => onSelect(vehicle.id)}
            >
              <span>Ver ficha técnica completa</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>

            <button
              type="button"
              className="spotlight-btn spotlight-btn--secondary"
              onClick={onViewFinancing}
            >
              <span>Calcular financiamiento</span>
            </button>
          </div>

          <p className="vehicle-spotlight__disclaimer">
            *Cuota referencial calculada con prima del 20% sujeta a aprobación crediticia de bancos asociados en Nicaragua.
          </p>
        </div>

        <div className="vehicle-spotlight__media">
          <div className="vehicle-spotlight__image-frame">
            <img
              src={vehicle.image}
              alt={`${vehicle.brand} ${vehicle.model} en exhibición`}
              className="vehicle-spotlight__image"
              loading="lazy"
            />
            <div className="vehicle-spotlight__badge-category">
              {vehicle.category} Certificado
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
