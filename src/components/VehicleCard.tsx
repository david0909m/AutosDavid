import type { Vehicle } from "../types/vehicle";

type VehicleCardProps = {
  vehicle: Vehicle;
  onSelect: (vehicleId: string) => void;
};
/** Centraliza el formato monetario visible para todas las tarjetas (USD y Córdobas). */
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

/** Presenta un resumen navegable de un vehículo dentro del catálogo. */
export function VehicleCard({ vehicle, onSelect }: VehicleCardProps) {
  const hasMultipleTrans = Boolean(
    vehicle.transmissions && vehicle.transmissions.length > 1,
  );
  const displayPriceUSD = hasMultipleTrans && vehicle.transmissions
    ? Math.min(...vehicle.transmissions.map((t) => t.priceUSD))
    : vehicle.price;
  const displayPriceNIO = hasMultipleTrans && vehicle.transmissions
    ? Math.min(...vehicle.transmissions.map((t) => t.priceNIO))
    : vehicle.priceNIO;

  return (
    <article className="vehicle-card reveal-on-scroll">
      <div className="vehicle-card__media">
        <img
          className="vehicle-card__image"
          src={vehicle.image}
          alt={vehicle.imageAlt}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        <span className="vehicle-card__badge">{vehicle.category}</span>
      </div>
      <div className="vehicle-card__body">
        <div className="vehicle-card__header">
          <h3 className="vehicle-card__title">
            {vehicle.brand} {vehicle.model}
          </h3>
          <div className="vehicle-card__price-container">
            <p className="vehicle-card__price">
              <span className="vehicle-card__price-prefix">DESDE:</span>{" "}
              {priceFormatterNIO.format(displayPriceNIO)}
            </p>
            <span className="vehicle-card__price-usd">~ {priceFormatterUSD.format(displayPriceUSD)}</span>{" "}
          </div>
        </div>

        <ul
          className="vehicle-card__specs"
          aria-label={`Especificaciones de ${vehicle.brand} ${vehicle.model}`}
        >
          <li className="spec-pill">{vehicle.year}</li>
          <li className="spec-pill">{vehicle.fuel}</li>
          <li className="spec-pill">
            {hasMultipleTrans ? "Manual / Auto" : vehicle.transmission}
          </li>
        </ul>

        <button
          type="button"
          className="vehicle-card__action"
          onClick={() => onSelect(vehicle.id)}
          aria-label={`Ver ficha técnica de ${vehicle.brand} ${vehicle.model}`}
        >
          <span>Ver ficha técnica</span>
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </article>
  );
}
