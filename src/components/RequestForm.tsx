import { useState } from "react";
import { submitVehicleRequest } from "../services/requestService";
import type {
  FinancingSimulationData,
  RequestErrors,
  RequestType,
  VehicleRequest,
} from "../types/request";
import type { Vehicle, VehicleTransmissionOption } from "../types/vehicle";

type RequestFormProps = {
  vehicle: Vehicle;
  initialRequestType: RequestType;
  selectedTransmission?: VehicleTransmissionOption;
  financingData?: FinancingSimulationData;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  onBack: () => void;
};

/* Traduce el valor interno del tipo de solicitud para los mensajes visibles. */
const requestLabels: Record<RequestType, string> = {
  quotation: "Cotización formal",
  "test-drive": "Prueba de manejo",
};

/** Sucursales y centros de atención oficial en Nicaragua. */
const branches = [
  "Managua - Showroom Principal (Pista Jean Paul Genie)",
  "Managua - Carretera Norte",
  "León - Entrada Principal",
  "Chinandega - Rotonda Los Encuentros",
  "Matagalpa - Salida a Managua",
  "Estelí - Panamericana Norte",
] as const;

/** Formateadores monetarios en USD y Córdobas (NIO). */
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

/** Devuelve la fecha local en el formato requerido por un control HTML de fecha. */
function today() {
  return new Date().toLocaleDateString("en-CA");
}

function validateRequest(request: VehicleRequest): RequestErrors {
  const errors: RequestErrors = {};
  if (!request.name.trim()) errors.name = "Por favor ingresa tu nombre completo.";
  if (!/^\S+@\S+\.\S+$/.test(request.email.trim()))
    errors.email = "Ingresa un correo electrónico válido.";
  if (!/^\+?\d{7,15}$/.test(request.phone.replace(/[\s-]/g, "")))
    errors.phone = "Ingresa un número de teléfono o celular válido (7 a 15 dígitos).";
  if (request.requestType === "test-drive") {
    if (!request.preferredDate)
      errors.preferredDate = "Selecciona una fecha preferida.";
    else if (request.preferredDate < today())
      errors.preferredDate = "La fecha no puede ser anterior al día de hoy.";
  }
  return errors;
}

/** Gestiona los datos y los estados de una solicitud personalizada para un vehículo. */
export function RequestForm({
  vehicle,
  initialRequestType,
  selectedTransmission,
  financingData,
  headingRef,
  onBack,
}: RequestFormProps) {
  // Precios y detalles basados en la versión de transmisión elegida
  const effectivePriceUSD = selectedTransmission ? selectedTransmission.priceUSD : vehicle.price;
  const effectivePriceNIO = selectedTransmission ? selectedTransmission.priceNIO : vehicle.priceNIO;
  const effectiveTransmissionLabel = selectedTransmission
    ? selectedTransmission.label
    : `Transmisión ${vehicle.transmission}`;
  const effectiveShortTrans = selectedTransmission
    ? selectedTransmission.shortLabel
    : vehicle.transmission;

  /** Borrador controlado que se conserva si el envío simulado falla. */
  const [request, setRequest] = useState<VehicleRequest>({
    vehicleId: vehicle.id,
    name: "",
    email: "",
    phone: "",
    requestType: initialRequestType,
    preferredDate: "",
    city: branches[0],
    shift: "mañana",
    notes: "",
    financing: initialRequestType === "quotation" ? financingData : undefined,
  });
  const [submittedFolio, setSubmittedFolio] = useState<string>("");
  const [errors, setErrors] = useState<RequestErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  /** Actualiza un campo y limpia solo su error para no ocultar mensajes de otros controles. */
  function updateField<Key extends keyof VehicleRequest>(
    key: Key,
    value: VehicleRequest[Key],
  ) {
    setRequest((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setSubmitError(null);
  }

  /** Cambia la gestión y conserva la simulación solo dentro de la cotización. */
  function selectRequestType(requestType: RequestType) {
    setRequest((current) => ({
      ...current,
      requestType,
      financing: requestType === "quotation" ? financingData : undefined,
    }));
    setErrors((current) => ({ ...current, preferredDate: undefined }));
    setSubmitError(null);
  }

  /** Valida el borrador y controla los estados de envío, éxito y error de la simulación. */
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validateRequest(request);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const shouldFail =
        import.meta.env.DEV &&
        new URLSearchParams(window.location.search).has("simulateRequestError");
      await submitVehicleRequest(request, { shouldFail });
      const randomFolio = `AD-NI-${Math.floor(1000 + Math.random() * 9000)}`;
      setSubmittedFolio(randomFolio);
      setIsSubmitted(true);
    } catch (caughtError) {
      setSubmitError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo enviar la solicitud. Inténtalo de nuevo.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const primaryMetric =
    vehicle.metrics?.find((m) => m.label === "Motor")?.value ||
    "Motor de alta eficiencia";
  const activeFinancing =
    request.requestType === "quotation" ? request.financing : undefined;

  return (
    <main className="request-page">
      <div className="request-page__content">
        {/* Barra superior de retorno */}
        <nav className="detail-nav" aria-label="Navegación de retorno">
          <button
            className="dealer-back-btn back-button"
            type="button"
            onClick={onBack}
            aria-label={`Regresar a la ficha de ${vehicle.brand} ${vehicle.model}`}
          >
            <span aria-hidden="true">←</span>
            <span>Volver a la ficha de {vehicle.brand} {vehicle.model}</span>
          </button>
        </nav>

        {isSubmitted ? (
          /* Pantalla de Confirmación de Alta Fidelidad - Comprobante / Proforma Oficial */
          <div className="submission-success" role="status">
            <div className="submission-success__header">
              <div className="submission-success__badge" aria-hidden="true">
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <div className="submission-success__folio-pill">
                <span className="folio-label">Folio de demostración</span>
                <span className="folio-number">{submittedFolio}</span>
                <span className="folio-status">Simulada</span>
              </div>
              <h1 ref={headingRef} tabIndex={-1} className="submission-success__title">
                ¡Solicitud preparada con éxito!
              </h1>
              <p className="submission-success__subtitle">
                Se preparó un comprobante de demostración para tu solicitud de{" "}
                <strong>
                  {requestLabels[request.requestType].toLocaleLowerCase("es")}
                </strong>{" "}
                para el{" "}
                <strong>
                  {vehicle.brand} {vehicle.model} {vehicle.year}
                </strong>
                . Este comprobante se genera localmente y todavía no se envía a un CRM ni a un asesor comercial.
              </p>
            </div>

            {/* Comprobante / Proforma Oficial Digital */}
            <div className="submission-proforma-slip">
              <div className="proforma-slip__topbar">
                <div className="proforma-slip__brand">
                  <span className="brand-dot" aria-hidden="true" />
                  <strong>AUTOSDAVID CERTIFICADOS</strong>
                  <span className="brand-sub">· Comprobante de demostración</span>
                </div>
                <div className="proforma-slip__date">
                  {new Date().toLocaleDateString("es-NI", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              </div>

              <div className="proforma-slip__grid">
                {/* Bloque 1: Vehículo y Versión */}
                <div className="proforma-card-section">
                  <div className="proforma-section-title">Vehículo Seleccionado</div>
                  <div className="proforma-vehicle-preview">
                    <img
                      src={vehicle.image}
                      alt={`${vehicle.brand} ${vehicle.model}`}
                      className="proforma-vehicle-img"
                      referrerPolicy="no-referrer"
                    />
                    <div className="proforma-vehicle-details">
                      <h4>{vehicle.brand} {vehicle.model} ({vehicle.year})</h4>
                      <p className="proforma-vehicle-meta">
                        {effectiveTransmissionLabel} · {vehicle.category}
                      </p>
                      <div className="proforma-vehicle-price">
                        <strong>{priceFormatterNIO.format(effectivePriceNIO)}</strong>
                        <span>({priceFormatterUSD.format(effectivePriceUSD)})</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bloque 2: Solicitante y Contacto */}
                <div className="proforma-card-section">
                  <div className="proforma-section-title">Datos del Solicitante</div>
                  <dl className="proforma-dl">
                    <div className="proforma-dl-row">
                      <dt>Nombre:</dt>
                      <dd>{request.name}</dd>
                    </div>
                    <div className="proforma-dl-row">
                      <dt>Teléfono:</dt>
                      <dd>{request.phone}</dd>
                    </div>
                    <div className="proforma-dl-row">
                      <dt>Correo:</dt>
                      <dd>{request.email}</dd>
                    </div>
                    <div className="proforma-dl-row">
                      <dt>Sucursal:</dt>
                      <dd>{request.city}</dd>
                    </div>
                    {request.requestType === "test-drive" && (
                      <div className="proforma-dl-row highlight">
                        <dt>Cita de prueba:</dt>
                        <dd>{request.preferredDate} ({request.shift === "mañana" ? "Turno Mañana" : "Turno Tarde"})</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>

              {/* Bloque Destacado de Financiamiento (si aplica) */}
              {activeFinancing && (
                <div className="proforma-finance-box">
                  <div className="proforma-finance-header">
                    <span className="finance-icon" aria-hidden="true">💳</span>
                    <div>
                    <strong>Simulación de financiamiento</strong>
                    <p>Parámetros calculados para esta demostración; sujetos a aprobación bancaria</p>
                    </div>
                  </div>
                  <div className="proforma-finance-grid">
                    <div className="proforma-finance-item highlight">
                      <span className="pfi-label">Cuota mensual estimada</span>
                      <strong className="pfi-value">
                        {priceFormatterNIO.format(activeFinancing.monthlyPaymentNIO)} / mes
                      </strong>
                      <span className="pfi-sub">
                        ({priceFormatterUSD.format(activeFinancing.monthlyPaymentUSD)} / mes)
                      </span>
                    </div>
                    <div className="proforma-finance-item">
                      <span className="pfi-label">Prima pactada ({activeFinancing.downPaymentPercent}%)</span>
                      <strong className="pfi-value">
                        {priceFormatterNIO.format(activeFinancing.downPaymentNIO)}
                      </strong>
                      <span className="pfi-sub">
                        ({priceFormatterUSD.format(activeFinancing.downPaymentUSD)})
                      </span>
                    </div>
                    <div className="proforma-finance-item">
                      <span className="pfi-label">Plazo del crédito</span>
                      <strong className="pfi-value">{activeFinancing.termMonths} meses</strong>
                      <span className="pfi-sub">({Math.round(activeFinancing.termMonths / 12)} años)</span>
                    </div>
                    <div className="proforma-finance-item">
                      <span className="pfi-label">Monto neto a financiar</span>
                      <strong className="pfi-value">
                        {priceFormatterNIO.format(activeFinancing.financedAmountNIO)}
                      </strong>
                      <span className="pfi-sub">
                        ({priceFormatterUSD.format(activeFinancing.financedAmountUSD)})
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {request.notes && (
                <div className="proforma-notes-box">
                  <span className="notes-label">Consulta o nota del solicitante:</span>
                  <p className="notes-content">{request.notes}</p>
                </div>
              )}
            </div>

            {/* Hoja de Ruta / Próximos Pasos */}
            <div className="submission-roadmap">
              <div className="submission-roadmap__title">¿Qué sucede a continuación?</div>
              <div className="submission-roadmap__steps">
                <div className="roadmap-step is-complete">
                  <div className="step-num">1</div>
                  <div className="step-content">
                    <strong>Solicitud preparada</strong>
                    <p>Comprobante generado localmente</p>
                  </div>
                </div>
                <div className="roadmap-step is-current">
                  <div className="step-num">2</div>
                  <div className="step-content">
                    <strong>Contacto con un asesor</strong>
                    <p>Pendiente de conectar un canal real de atención</p>
                  </div>
                </div>
                <div className="roadmap-step">
                  <div className="step-num">3</div>
                  <div className="step-content">
                    <strong>{request.requestType === "test-drive" ? "Coordinación de la prueba" : "Cotización detallada"}</strong>
                    <p>Disponible cuando el formulario se conecte a un canal real de atención.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Acciones Finales */}
            <div className="submission-success__actions">
              <button
                type="button"
                className="submission-success__print-btn"
                onClick={() => window.print()}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
                <span>Imprimir o descargar comprobante (PDF)</span>
              </button>

              <button
                type="button"
                className="dealer-back-btn submission-success__back-btn"
                onClick={onBack}
                aria-label={`Regresar a la ficha de ${vehicle.brand} ${vehicle.model}`}
              >
                <span aria-hidden="true">←</span>
                <span>Volver a la ficha de {vehicle.brand} {vehicle.model}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Disposición Showroom en 2 Columnas */
          <div className="request-layout">
            {/* Columna Izquierda: Tarjeta del Vehículo y Garantías */}
            <aside className="request-sidebar" aria-label="Información del vehículo seleccionado">
              <div className="request-vehicle-card">
                <div className="request-vehicle-card__media">
                  <img
                    src={vehicle.image}
                    alt={`${vehicle.brand} ${vehicle.model} vista frontal`}
                    className="request-vehicle-card__img"
                    referrerPolicy="no-referrer"
                  />
                  <span className="request-vehicle-card__badge">
                    {vehicle.category} · {vehicle.year}
                  </span>
                </div>
                <div className="request-vehicle-card__body">
                  <h2 className="request-vehicle-card__title">
                    {vehicle.brand} {vehicle.model}
                  </h2>
                  <div className="request-vehicle-card__prices">
                    <span className="request-vehicle-card__price-nio">
                      {priceFormatterNIO.format(effectivePriceNIO)}
                    </span>
                    <span className="request-vehicle-card__price-usd">
                      {priceFormatterUSD.format(effectivePriceUSD)}
                    </span>
                  </div>
                  <ul className="request-vehicle-card__specs">
                    <li className="request-vehicle-card__spec-pill">{primaryMetric}</li>
                    <li className="request-vehicle-card__spec-pill">{effectiveShortTrans}</li>
                    <li className="request-vehicle-card__spec-pill">{vehicle.fuel}</li>
                  </ul>

                  {activeFinancing && (
                    <div className="request-vehicle-card__finance-badge">
                      <span className="finance-badge-icon" aria-hidden="true">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="5" width="20" height="14" rx="2" />
                          <line x1="2" y1="10" x2="22" y2="10" />
                        </svg>
                      </span>
                      <div className="finance-badge-info">
                        <span className="finance-badge-label">Financiamiento disponible</span>
                        <strong className="finance-badge-value">
                          {priceFormatterNIO.format(activeFinancing.monthlyPaymentNIO)} / mes
                        </strong>
                        <span className="finance-badge-sub">
                          {activeFinancing.downPaymentPercent}% prima · {activeFinancing.termMonths} meses
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Pilares de Respaldo */}
              <div className="request-guarantees-card">
                <div className="request-guarantees-title">Respaldo AutosDavid</div>
                <ul className="request-guarantees-list">
                  <li className="request-guarantee-item">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                    <span>Información de referencia sobre el vehículo y sus condiciones.</span>
                  </li>
                  <li className="request-guarantee-item">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="2" y="5" width="20" height="14" rx="2" />
                      <line x1="2" y1="10" x2="22" y2="10" />
                    </svg>
                    <span>Simulación de prima y cuotas para orientar tu decisión.</span>
                  </li>
                  <li className="request-guarantee-item">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>Esta demostración no envía la solicitud a un canal de atención real.</span>
                  </li>
                </ul>
              </div>

              {/* Canal Directo de Asistencia Telefónica */}
              <div className="request-direct-chat">
                <strong>¿Prefieres atención telefónica inmediata?</strong>
                <p>Nuestra central de atención está disponible para coordinar tu cita o brindarte asesoría sobre el modelo.</p>
                <a
                  href="tel:+50522550000"
                  className="request-direct-chat__btn"
                  aria-label="Llamar a central telefónica AutosDavid"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <span>Llamar al PBX: (+505) 2255-0000</span>
                </a>
              </div>
            </aside>

            {/* Columna Derecha: Formulario Interactivo */}
            <section className="request-card" aria-labelledby="request-form-title">
              <h1 id="request-form-title" ref={headingRef} tabIndex={-1}>
                Solicita información personalizada
              </h1>
              <p className="request-intro">
                Elige el tipo de gestión que necesitas y completa tus datos. Recibirás tu proforma formal o la confirmación de tu prueba de manejo directamente en tu correo electrónico.
                {activeFinancing && " Las condiciones de financiamiento que simulaste se incluirán en la cotización formal."}
              </p>

              {/* Selector Segmentado de Tipo de Solicitud */}
              <div className="request-type-toggle" role="group" aria-label="Tipo de gestión a solicitar">
                <button
                  type="button"
                  className={`request-type-toggle__btn ${request.requestType === "quotation" ? "is-active" : ""}`}
                  onClick={() => selectRequestType("quotation")}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                  <span>Cotización Formal</span>
                </button>
                <button
                  type="button"
                  className={`request-type-toggle__btn ${request.requestType === "test-drive" ? "is-active" : ""}`}
                  onClick={() => selectRequestType("test-drive")}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                    <circle cx="7" cy="17" r="2" />
                    <path d="M9 17h6" />
                    <circle cx="17" cy="17" r="2" />
                  </svg>
                  <span>Prueba de Manejo</span>
                </button>
              </div>

              {/* El financiamiento calculado se presenta dentro de la cotización formal. */}
              {activeFinancing && (
                <div className="request-finance-summary" role="region" aria-label="Condiciones de financiamiento seleccionadas">
                  <div className="request-finance-summary__header">
                    <div className="request-finance-summary__title">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="2" y="5" width="20" height="14" rx="2" />
                        <line x1="2" y1="10" x2="22" y2="10" />
                      </svg>
                      <span>Financiamiento incluido en la cotización</span>
                    </div>
                    <span className="request-finance-summary__tag">Simulación comercial</span>
                  </div>
                  <div className="request-finance-summary__grid">
                    <div className="request-finance-summary__item highlight">
                      <span className="finance-item-label">Cuota mensual estimada</span>
                      <strong className="finance-item-value">
                        {priceFormatterNIO.format(activeFinancing.monthlyPaymentNIO)} <small>/ mes</small>
                      </strong>
                      <span className="finance-item-sub">({priceFormatterUSD.format(activeFinancing.monthlyPaymentUSD)} / mes)</span>
                    </div>
                    <div className="request-finance-summary__item">
                      <span className="finance-item-label">Prima pactada ({activeFinancing.downPaymentPercent}%)</span>
                      <strong className="finance-item-value">
                        {priceFormatterNIO.format(activeFinancing.downPaymentNIO)}
                      </strong>
                      <span className="finance-item-sub">({priceFormatterUSD.format(activeFinancing.downPaymentUSD)})</span>
                    </div>
                    <div className="request-finance-summary__item">
                      <span className="finance-item-label">Plazo de amortización</span>
                      <strong className="finance-item-value">
                        {activeFinancing.termMonths} meses
                      </strong>
                      <span className="finance-item-sub">({Math.round(activeFinancing.termMonths / 12)} años)</span>
                    </div>
                    <div className="request-finance-summary__item">
                      <span className="finance-item-label">Monto neto financiado</span>
                      <strong className="finance-item-value">
                        {priceFormatterNIO.format(activeFinancing.financedAmountNIO)}
                      </strong>
                      <span className="finance-item-sub">({priceFormatterUSD.format(activeFinancing.financedAmountUSD)})</span>
                    </div>
                  </div>
                </div>
              )}

              {submitError && (
                <div className="form-alert" role="alert">
                  {submitError}
                </div>
              )}

              <form
                className="request-form"
                noValidate
                onSubmit={(event) => void handleSubmit(event)}
              >
                {/* Nombre y Teléfono */}
                <div className="request-form-row">
                  <div className={`control ${errors.name ? "has-error" : ""}`}>
                    <label htmlFor="request-name">
                      Nombre completo <span className="req-marker" aria-hidden="true">*</span>
                    </label>
                    <div className="control-input-wrap">
                      <span className="control-input-icon" aria-hidden="true">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </span>
                      <input
                        id="request-name"
                        autoComplete="name"
                        value={request.name}
                        onChange={(event) =>
                          updateField("name", event.target.value)
                        }
                        placeholder="Ej. Carlos Mendoza"
                        aria-invalid={Boolean(errors.name)}
                        aria-describedby={
                          errors.name ? "request-name-error" : undefined
                        }
                      />
                    </div>
                    {errors.name && (
                      <p id="request-name-error" className="field-error">
                        <svg className="field-error-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span>{errors.name}</span>
                      </p>
                    )}
                  </div>

                  <div className={`control ${errors.phone ? "has-error" : ""}`}>
                    <label htmlFor="request-phone">
                      Teléfono de contacto <span className="req-marker" aria-hidden="true">*</span>
                    </label>
                    <div className="control-input-wrap">
                      <span className="control-input-icon" aria-hidden="true">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                      </span>
                      <input
                        id="request-phone"
                        type="tel"
                        autoComplete="tel"
                        value={request.phone}
                        onChange={(event) =>
                          updateField("phone", event.target.value)
                        }
                        placeholder="Ej. (+505) 8888-0000 o 2255-0000"
                        aria-invalid={Boolean(errors.phone)}
                        aria-describedby={
                          errors.phone ? "request-phone-error" : undefined
                        }
                      />
                    </div>
                    {errors.phone && (
                      <p id="request-phone-error" className="field-error">
                        <svg className="field-error-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span>{errors.phone}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Correo y Sucursal */}
                <div className="request-form-row">
                  <div className={`control ${errors.email ? "has-error" : ""}`}>
                    <label htmlFor="request-email">
                      Correo electrónico <span className="req-marker" aria-hidden="true">*</span>
                    </label>
                    <div className="control-input-wrap">
                      <span className="control-input-icon" aria-hidden="true">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                      </span>
                      <input
                        id="request-email"
                        type="email"
                        autoComplete="email"
                        value={request.email}
                        onChange={(event) =>
                          updateField("email", event.target.value)
                        }
                        placeholder="tu.correo@ejemplo.com"
                        aria-invalid={Boolean(errors.email)}
                        aria-describedby={
                          errors.email ? "request-email-error" : undefined
                        }
                      />
                    </div>
                    {errors.email && (
                      <p id="request-email-error" className="field-error">
                        <svg className="field-error-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span>{errors.email}</span>
                      </p>
                    )}
                  </div>

                  <div className="control">
                    <label htmlFor="request-branch">Sucursal preferida</label>
                    <div className="control-input-wrap">
                      <span className="control-input-icon" aria-hidden="true">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                      </span>
                      <select
                        id="request-branch"
                        value={request.city}
                        onChange={(event) =>
                          updateField("city", event.target.value)
                        }
                      >
                        {branches.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Opciones Específicas de Prueba de Manejo */}
                {request.requestType === "test-drive" && (
                  <div className="request-form-row">
                    <div className={`control ${errors.preferredDate ? "has-error" : ""}`}>
                      <label htmlFor="preferred-date">
                        Fecha preferida para la prueba <span className="req-marker" aria-hidden="true">*</span>
                      </label>
                      <div className="control-input-wrap">
                        <span className="control-input-icon" aria-hidden="true">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                        </span>
                        <input
                          id="preferred-date"
                          type="date"
                          min={today()}
                          value={request.preferredDate}
                          onChange={(event) =>
                            updateField("preferredDate", event.target.value)
                          }
                          aria-invalid={Boolean(errors.preferredDate)}
                          aria-describedby={
                            errors.preferredDate
                              ? "preferred-date-error"
                              : undefined
                          }
                        />
                      </div>
                      {errors.preferredDate && (
                        <p id="preferred-date-error" className="field-error">
                          <svg className="field-error-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                          <span>{errors.preferredDate}</span>
                        </p>
                      )}
                    </div>

                    <div className="control">
                      <label htmlFor="preferred-shift">Turno preferido</label>
                      <div className="control-input-wrap">
                        <span className="control-input-icon" aria-hidden="true">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                        </span>
                        <select
                          id="preferred-shift"
                          value={request.shift}
                          onChange={(event) =>
                            updateField("shift", event.target.value as "mañana" | "tarde")
                          }
                        >
                          <option value="mañana">Mañana (9:00 AM - 12:00 PM)</option>
                          <option value="tarde">Tarde (2:00 PM - 5:30 PM)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Comentarios o preguntas adicionales */}
                <div className="control">
                  <label htmlFor="request-notes">
                    Comentarios o consultas específicas (opcional)
                  </label>
                  <div className="control-input-wrap">
                    <span className="control-input-icon" style={{ top: "0.85rem" }} aria-hidden="true">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </span>
                    <textarea
                      id="request-notes"
                      value={request.notes}
                      onChange={(event) =>
                        updateField("notes", event.target.value)
                      }
                      placeholder="Escribe aquí cualquier consulta, requerimiento específico o si deseas entregar un vehículo a cuenta de prima (opcional)..."
                    />
                  </div>
                </div>

                <button
                  className="submit-request"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    "Preparando solicitud…"
                  ) : (
                    <>
                      <span>
                        {request.requestType === "quotation"
                          ? "Solicitar cotización"
                          : "Agendar prueba de manejo"}
                      </span>
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>

                <div className="request-privacy-note">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span>Tus datos son confidenciales y están protegidos conforme a la ley.</span>
                </div>
              </form>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
