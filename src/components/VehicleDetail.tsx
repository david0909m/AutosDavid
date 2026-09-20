import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useScrollReveal } from "../hooks/useScrollReveal";
import type { FinancingSimulationData, RequestType } from "../types/request";
import type { Vehicle, VehicleColor, VehicleTransmissionOption } from "../types/vehicle";

type VehicleDetailProps = {
  vehicle: Vehicle;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  onBack: () => void;
  onRequest: (
    requestType: RequestType,
    transmission?: VehicleTransmissionOption,
    financing?: FinancingSimulationData,
  ) => void;
};

/** Formato monetario centralizado en USD (moneda principal de referencia). */
const priceFormatterUSD = new Intl.NumberFormat("es-NI", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/** Formato monetario en Córdobas (NIO) calculado al cambio oficial de referencia. */
const priceFormatterNIO = new Intl.NumberFormat("es-NI", {
  style: "currency",
  currency: "NIO",
  maximumFractionDigits: 0,
});

/** Plazos disponibles para la calculadora de financiamiento en meses. */
const FINANCING_TERMS = [24, 36, 48, 60, 72] as const;


/** Nombres de perspectiva para cada toma del vehículo */
const PHOTO_PERSPECTIVES = [
  "Diseño Exterior 3/4 Frontal",
  "Confort Interior & Cabina",
  "Tecnología & Conectividad",
  "Seguridad Integral & Asistencias",
  "Dinámica y Desempeño",
];

/** Calcula el estilo visual del modo de mezcla y opacidad para el tintado de carrocería. */
function getColorLayerStyle(selectedColorHex: string) {
  const cleanHex = selectedColorHex.replace("#", "");
  if (cleanHex.length !== 6) {
    return {
      backgroundColor: selectedColorHex,
      mixBlendMode: "color" as const,
      opacity: 1,
    };
  }
  const r = parseInt(cleanHex.slice(0, 2), 16);
  const g = parseInt(cleanHex.slice(2, 4), 16);
  const b = parseInt(cleanHex.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const isPureWhite = lum > 0.95;

  if (isPureWhite) {
    return {
      backgroundColor: "#ffffff",
      mixBlendMode: "color" as const,
      opacity: 0.96,
    };
  }

  return {
    backgroundColor: selectedColorHex,
    mixBlendMode: "multiply" as const,
    opacity: 0.94,
  };
}

/** Mantiene los recursos públicos dentro de la ruta relativa usada al publicar en GitHub Pages. */
function resolvePublicAssetPath(assetPath: string) {
  if (/^(?:https?:)?\/\//.test(assetPath)) {
    return assetPath;
  }

  return assetPath.replace(/^\/+/, "./");
}

/**
 * Ficha técnica oficial inspirada en el portal de concesionario Toyota Nicaragua (Casa Pellas).
 * Incluye hero de producto con eslogan y métricas, selector de colores, galería multitoma,
 * historias editoriales de producto, calculadora de financiamiento interactiva en tiempo real,
 * tabla técnica completa y barra de acción fija.
 */
export function VehicleDetail({
  vehicle,
  headingRef,
  onBack,
  onRequest,
}: VehicleDetailProps) {
  // Opciones de transmisión disponibles para el modelo (Manual vs Automática)
  const transmissions: VehicleTransmissionOption[] =
    vehicle.transmissions && vehicle.transmissions.length > 0
      ? vehicle.transmissions
      : [
          {
            type: vehicle.transmission,
            label: `Transmisión ${vehicle.transmission}`,
            shortLabel: vehicle.transmission === "Manual" ? "Mecánico" : "Automático",
            priceUSD: vehicle.price,
            priceNIO: vehicle.priceNIO,
            isDefault: true,
          },
        ];

  // Estado de la versión de transmisión seleccionada
  const defaultTransIdx = transmissions.findIndex((t) => t.isDefault);
  const [selectedTransmissionIndex, setSelectedTransmissionIndex] = useState(
    defaultTransIdx >= 0 ? defaultTransIdx : 0,
  );
  const activeTransmission =
    transmissions[selectedTransmissionIndex] ?? transmissions[0];

  // Precios dinámicos dependientes de la versión seleccionada
  const currentPriceUSD = activeTransmission.priceUSD;
  const currentPriceNIO = activeTransmission.priceNIO;

  // Índice de la fotografía actualmente seleccionada en el visor principal
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  // Índice de fotografía para la sección de Seguridad Integral (por defecto toma 4 -> índice 3)
  const [safetyPhotoIndex, setSafetyPhotoIndex] = useState(3);

  // Paleta de colores oficial con selector interactivo
  const defaultColors: VehicleColor[] = [
    { name: "Rojo Mica", hex: "#9b1717" },
    { name: "Gris Urbano", hex: "#2b3a4a" },
    { name: "Negro Mica", hex: "#111111" },
    { name: "Blanco Perla Platino", hex: "#f3f6f9" },
    { name: "Super Blanco", hex: "#ffffff" },
    { name: "Plata Metálico", hex: "#c4c8cb" },
  ];
  const colors = vehicle.colors && vehicle.colors.length > 0 ? vehicle.colors : defaultColors;
  const [activeColorIndex, setActiveColorIndex] = useState(0);
  const galleryColorStyle = {
    "--vehicle-ambient-color": colors[activeColorIndex]?.hex,
  } as CSSProperties;

  // Estado para la calculadora interactiva de financiamiento
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(
    vehicle.financing?.minDownPaymentPercent ?? 20,
  );
  const [selectedTerm, setSelectedTerm] = useState<number>(
    vehicle.financing?.defaultTermMonths ?? 48,
  );

  // Cálculos financieros dinámicos basados en el precio de la versión seleccionada
  const interestAnnual = vehicle.financing?.interestRateAnnual ?? 8.75;
  const monthlyRate = interestAnnual / 100 / 12;

  const downPaymentUSD = Math.round(currentPriceUSD * (downPaymentPercent / 100));
  const downPaymentNIO = Math.round(currentPriceNIO * (downPaymentPercent / 100));

  const financedUSD = currentPriceUSD - downPaymentUSD;
  const financedNIO = currentPriceNIO - downPaymentNIO;

  const monthlyPaymentUSD = Math.round(
    (financedUSD * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -selectedTerm)),
  );
  const monthlyPaymentNIO = Math.round(
    (financedNIO * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -selectedTerm)),
  );

  // Lista unificada de fotografías memoizada para evitar ejecuciones repetidas
  const photos = useMemo(
    () =>
      vehicle.gallery && vehicle.gallery.length > 0
        ? vehicle.gallery
        : [vehicle.image],
    [vehicle.gallery, vehicle.image],
  );

  // Foto de Portada Panorámica
  const coverPhoto = vehicle.image;

  // Foto base para el configurador de color (foto neutra de estudio si existe, o principal)
  const colorBasePhoto = useMemo(
    () => resolvePublicAssetPath(vehicle.colorPreviewImage || vehicle.image),
    [vehicle.colorPreviewImage, vehicle.image],
  );

  const selectedColorHex = colors[activeColorIndex]?.hex ?? "#ffffff";
  const normalizedMaskUrl = useMemo(() => {
    if (!vehicle.colorPreviewMask) return "";
    return resolvePublicAssetPath(vehicle.colorPreviewMask);
  }, [vehicle.colorPreviewMask]);

  const colorLayerStyle = getColorLayerStyle(selectedColorHex);

  // Animación de entrada fluida al hacer scroll para todas las secciones
  useScrollReveal(vehicle.id);

  // Estado del visor a pantalla completa (Lightbox)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Soporte para gestos táctiles (Swipe)
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const nextPhoto = () => {
    setActivePhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setActivePhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const deltaX = touchStartX - e.changedTouches[0].clientX;
    if (deltaX > 40) {
      nextPhoto();
    } else if (deltaX < -40) {
      prevPhoto();
    }
    setTouchStartX(null);
  };

  // Atajos de teclado y bloqueo de scroll para el visor Lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;

    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsLightboxOpen(false);
      } else if (e.key === "ArrowRight") {
        setActivePhotoIndex((prev) => (prev + 1) % photos.length);
      } else if (e.key === "ArrowLeft") {
        setActivePhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = origOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLightboxOpen, photos.length]);

  // Desplazamiento suave hacia secciones internas
  const scrollToSection = (sectionId: string) => {
    const target = document.getElementById(sectionId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Ocultar la barra flotante cuando el pie de página entra en pantalla para evitar solapar el texto legal
  const [isStickyBarVisible, setIsStickyBarVisible] = useState(true);

  useEffect(() => {
    const footerElement = document.getElementById("footer-section");
    if (!footerElement) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsStickyBarVisible(!entry.isIntersecting);
      },
      { root: null, threshold: 0.05 },
    );

    observer.observe(footerElement);
    return () => observer.disconnect();
  }, []);


  return (
    <main className="dealer-detail-page">
      {/* 1. Barra superior de navegación y migas de pan */}
      <div className="dealer-top-nav">
        <div className="dealer-top-nav__inner">
          <button
            className="dealer-back-btn"
            type="button"
            onClick={onBack}
            aria-label="Regresar al catálogo de vehículos"
          >
            <span aria-hidden="true">←</span> Volver al catálogo
          </button>
          <nav className="dealer-breadcrumbs" aria-label="Migas de pan">
            <span>Catálogo</span>
            <span className="sep">/</span>
            <span>{vehicle.brand}</span>
            <span className="sep">/</span>
            <span className="current">{vehicle.model}</span>
          </nav>
        </div>
      </div>

      {/* 1. Hero Panorámico de Portada (Foto normal grande en alta resolución) */}
      <section
        className="dealer-cover-hero reveal-on-scroll"
        aria-label={`Portada oficial del ${vehicle.brand} ${vehicle.model}`}
      >
        <div className="dealer-cover-hero__media">
          {/* Imagen principal del vehículo con difuminado perimetral ligero */}
          <img
            src={coverPhoto}
            alt={`${vehicle.brand} ${vehicle.model} vista panorámica oficial`}
            className="dealer-cover-hero__img"
            loading="eager"
            referrerPolicy="no-referrer"
          />
          <div className="dealer-cover-hero__overlay">
            <div className="dealer-cover-hero__content">
              <h1 ref={headingRef} tabIndex={-1} className="dealer-cover-hero__title">
                {vehicle.brand} {vehicle.model}
              </h1>
              {vehicle.slogan && (
                <p className="dealer-cover-hero__slogan">{vehicle.slogan}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Sección de Presentación Oficial: Color de Carrocería & Precios */}
      <section className="dealer-hero" id="resumen" aria-label="Resumen y configurador de color del vehículo">
        <div className="dealer-hero__container">
          {/* Columna Izquierda: Datos de Campaña, Precios Oficiales y Acciones */}
          <div className="dealer-hero__info reveal-on-scroll">
            <p className="dealer-description">{vehicle.description}</p>

            {/* Selector de Versión de Transmisión (Mecánico vs Automático) */}
            <div className="dealer-transmission-picker" aria-labelledby="trans-picker-label">
              <div className="dealer-transmission-picker__header">
                <span id="trans-picker-label" className="transmission-label">
                  Versión / Transmisión:
                </span>
                <strong className="transmission-current-label">{activeTransmission.label}</strong>
              </div>

              {transmissions.length > 1 ? (
                <div
                  className="dealer-transmission-toggle"
                  role="radiogroup"
                  aria-labelledby="trans-picker-label"
                >
                  {transmissions.map((t, idx) => (
                    <button
                      key={t.type}
                      type="button"
                      role="radio"
                      aria-checked={selectedTransmissionIndex === idx}
                      className={`dealer-transmission-btn ${
                        selectedTransmissionIndex === idx ? "is-active" : ""
                      }`}
                      onClick={() => setSelectedTransmissionIndex(idx)}
                    >
                      <span className="trans-btn-name">{t.shortLabel}</span>
                      <span className="trans-btn-price">
                        {priceFormatterUSD.format(t.priceUSD)}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="dealer-transmission-single-badge">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 14 14" />
                  </svg>
                  <span>Versión única de fábrica · {activeTransmission.label}</span>
                </div>
              )}
            </div>

            {/* Bloque Oficial de Precios y Financiamiento Inicial */}
            <div className="dealer-pricing-box reveal-on-scroll">
              <div className="dealer-pricing-row">
                <div className="dealer-price-col">
                  <span className="price-tag-label">
                    {transmissions.length > 1 ? "PRECIO DE ESTA VERSIÓN:" : "PRECIO OFICIAL:"}
                  </span>
                  <div className="dealer-price-nio">{priceFormatterNIO.format(currentPriceNIO)}</div>
                  <div className="dealer-price-usd">{priceFormatterUSD.format(currentPriceUSD)}</div>
                </div>
                <div className="dealer-credit-col">
                  <span className="price-tag-label">PRIMA ESTIMADA ({downPaymentPercent}%):</span>
                  <div className="dealer-down-nio">
                    {priceFormatterNIO.format(downPaymentNIO)}
                  </div>
                  <div className="dealer-down-usd">
                    {priceFormatterUSD.format(downPaymentUSD)}
                  </div>
                  <span className="dealer-term-label">Hasta 72 meses plazo</span>
                </div>
              </div>

              <div className="dealer-hero__cta-group">
                <button
                  type="button"
                  className="dealer-btn-primary"
                  onClick={() => onRequest("quotation", activeTransmission)}
                >
                  Solicitar cotización
                </button>
                <button
                  type="button"
                  className="dealer-btn-secondary"
                  onClick={() => scrollToSection("financiamiento")}
                >
                  Calcular cuota mensual
                </button>
              </div>
            </div>

            {/* Métricas destacadas inmediatas (HP, Motor, Tanque, Pasajeros) */}
            {vehicle.metrics && vehicle.metrics.length > 0 && (
              <div className="dealer-metrics-grid reveal-on-scroll" aria-label="Características destacadas">
                {vehicle.metrics.map((m) => {
                  const isTrans = m.label.toLowerCase().includes("transmi");
                  const val = isTrans ? activeTransmission.shortLabel : m.value;
                  return (
                    <div key={m.label} className="dealer-metric-pill">
                      <span className="dealer-metric-label">{m.label}</span>
                      <strong className="dealer-metric-value">{val}</strong>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Columna Derecha: Solo la foto del color + Selector de colores debajo */}
          <div className="dealer-hero__visual">
            <div
              className="dealer-color-stage dealer-color-stage--color-ambience"
              style={galleryColorStyle}
            >
              <img
                className="dealer-color-stage__img"
                src={colorBasePhoto}
                alt={`${vehicle.brand} ${vehicle.model} en color ${colors[activeColorIndex]?.name}`}
                referrerPolicy="no-referrer"
                decoding="async"
                draggable={false}
                loading="eager"
              />

              {/* Capa de Color de Carrocería Dinámica (Toyota Hilux) */}
              {vehicle.colorPreviewMask && (
                <div
                  className="dealer-color-stage__color-layer"
                  style={{
                    backgroundColor: colorLayerStyle.backgroundColor,
                    mixBlendMode: colorLayerStyle.mixBlendMode,
                    opacity: colorLayerStyle.opacity,
                    WebkitMaskImage: `url("${normalizedMaskUrl}")`,
                    maskImage: `url("${normalizedMaskUrl}")`,
                  }}
                  aria-hidden="true"
                />
              )}

              <div className="dealer-gallery__badges">
                <span className="dealer-badge">{vehicle.category}</span>
              </div>
            </div>

            {/* Selector de Colores de Carrocería DEBAJO de la foto */}
            <div className="dealer-color-picker" aria-labelledby="color-picker-title">
              <div className="dealer-color-picker__header">
                <span id="color-picker-title" className="color-label">
                  Color exterior:
                </span>
                <span className="color-name-wrap">
                  <span
                    className="color-chip-preview"
                    style={{ backgroundColor: colors[activeColorIndex]?.hex }}
                    aria-hidden="true"
                  />
                  <strong className="color-name">{colors[activeColorIndex]?.name}</strong>
                </span>
              </div>
              <div className="dealer-color-picker__swatches" role="radiogroup" aria-label="Colores disponibles">
                {colors.map((c, idx) => (
                  <button
                    key={c.name}
                    type="button"
                    role="radio"
                    aria-checked={activeColorIndex === idx}
                    className={`dealer-color-swatch ${activeColorIndex === idx ? "is-active" : ""}`}
                    style={{ backgroundColor: c.hex }}
                    onClick={() => setActiveColorIndex(idx)}
                    title={c.name}
                    aria-label={`Seleccionar color ${c.name}`}
                  />
                ))}
              </div>
              <p className="dealer-color-disclaimer">
                *Color de carrocería seleccionado para cotización y reserva. Disponibilidad sujeta a inventario en Nicaragua.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Showcase Cinemático de Producto estilo Tesla (Experiencia Visual de Pantalla Ancha con Fotos y Scroll Animado) */}
      {vehicle.features && vehicle.features.length > 0 && (
        <section className="dealer-tesla-showcase" aria-label="Historias y características del vehículo">
          <div className="dealer-showcase-intro reveal-on-scroll">
            <span className="dealer-showcase-eyebrow">Experiencia & Confort</span>
            <h2 className="dealer-showcase-main-title">
              Cada detalle concebido para dominar tu camino
            </h2>
            <p className="dealer-showcase-main-desc">
              Descubre el diseño, la habitabilidad interior, la conectividad y la seguridad avanzada del {vehicle.brand} {vehicle.model}.
            </p>
          </div>

          <div className="dealer-showcase-container">
            {vehicle.features.map((story, idx) => {
              const isSafety = story.id === "safety";

              // Asignación de imagen según la sección para máxima concordancia visual
              const storyPhoto =
                story.id === "design"
                  ? photos[0]
                  : story.id === "interior"
                    ? photos[1] || photos[0]
                    : story.id === "technology"
                      ? photos[2] || photos[1] || photos[0]
                      : isSafety
                        ? (photos[safetyPhotoIndex] && safetyPhotoIndex < photos.length
                            ? photos[safetyPhotoIndex]
                            : photos[3] || photos[4] || photos[1] || photos[0])
                        : photos[3] || photos[0];

              const isReversed = idx % 2 !== 0;
              const photoIndexInGallery = photos.indexOf(storyPhoto);

              return (
                <article
                  key={story.id}
                  id={
                    story.id === "design"
                      ? "diseno"
                      : story.id === "interior"
                        ? "interior"
                        : story.id === "technology"
                          ? "tecnologia"
                          : "seguridad"
                  }
                  className={`dealer-showcase-row ${isReversed ? "is-reversed" : ""} ${
                    isSafety ? "dealer-showcase-row--safety" : ""
                  }`}
                >
                  {/* Contenedor Visual de la Imagen (Estilo Tesla con hover-zoom y apertura a Lightbox) */}
                  <div className="dealer-showcase-media reveal-on-scroll">
                    <button
                      type="button"
                      className="dealer-showcase-media__inner"
                      onClick={() => {
                        if (photoIndexInGallery >= 0) {
                          setActivePhotoIndex(photoIndexInGallery);
                        }
                        setIsLightboxOpen(true);
                      }}
                      aria-label={`Ampliar imagen de ${story.title}`}
                    >
                      <img
                        src={storyPhoto}
                        alt={`${story.category} - ${vehicle.brand} ${vehicle.model}`}
                        className="dealer-showcase-img"
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="dealer-showcase-media__overlay">
                        <span className="dealer-showcase-zoom-badge">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            <line x1="11" y1="8" x2="11" y2="14" />
                            <line x1="8" y1="11" x2="14" y2="11" />
                          </svg>
                          Ampliar foto en alta resolución
                        </span>
                      </div>
                    </button>

                    {/* Selector de ángulos para Seguridad Integral si hay 5 o más tomas */}
                    {isSafety && photos.length >= 5 && (
                      <div
                        className="dealer-showcase-angle-switcher"
                        role="group"
                        aria-label="Selector de tomas de seguridad y dinámica"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className={`dealer-angle-btn ${safetyPhotoIndex === 3 ? "is-active" : ""}`}
                          onClick={() => setSafetyPhotoIndex(3)}
                          aria-pressed={safetyPhotoIndex === 3}
                        >

                          <span>Foto 4</span>
                        </button>
                        <button
                          type="button"
                          className={`dealer-angle-btn ${safetyPhotoIndex === 4 ? "is-active" : ""}`}
                          onClick={() => setSafetyPhotoIndex(4)}
                          aria-pressed={safetyPhotoIndex === 4}
                        >

                          <span>Foto 5</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Contenedor Editorial de Texto */}
                  <div className="dealer-showcase-content reveal-on-scroll">
                    <div className="dealer-showcase-badge-wrap">
                      <span className={`dealer-showcase-pill ${isSafety ? "dealer-showcase-pill--safety" : ""}`}>
                        {isSafety && (
                          <svg
                            className="dealer-showcase-pill-icon"
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          </svg>
                        )}
                        {story.category}
                      </span>
                      {isSafety && (
                        <span className="dealer-showcase-pill-sub">
                          <span className="safety-dot" aria-hidden="true" />
                          Protección Activa & Pasiva
                        </span>
                      )}
                    </div>
                    <h3 className="dealer-showcase-title">{story.title}</h3>
                    <p className="dealer-showcase-subtitle">{story.subtitle}</p>
                    <p className="dealer-showcase-desc">{story.description}</p>

                    {story.highlights && story.highlights.length > 0 && (
                      <ul
                        className={`dealer-showcase-highlights ${
                          isSafety ? "dealer-showcase-highlights--safety" : ""
                        }`}
                        aria-label={`Puntos destacados de ${story.title}`}
                      >
                        {story.highlights.map((h) => (
                          <li
                            key={h}
                            className={`dealer-showcase-highlight-item ${isSafety ? "is-safety" : ""}`}
                          >
                            <span
                              className={`dealer-showcase-check ${
                                isSafety ? "dealer-showcase-check--safety" : ""
                              }`}
                              aria-hidden="true"
                            >
                              {isSafety ? (
                                <svg
                                  width="11"
                                  height="11"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              ) : (
                                "✓"
                              )}
                            </span>
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* 5. Calculadora Interactiva de Financiamiento en Tiempo Real */}
      <section
        className="dealer-financing-section reveal-on-scroll"
        id="financiamiento"
        aria-labelledby="financing-title"
      >
        <div className="dealer-section-header">
          <span className="dealer-eyebrow">Simulador de Crédito</span>
          <h2 id="financing-title" className="dealer-section-title">
            Calcula tu financiamiento
          </h2>
          <p className="dealer-section-desc">
            Personaliza tu prima inicial y el plazo para conocer tu cuota mensual estimada para el {vehicle.brand} {vehicle.model} ({activeTransmission.shortLabel} · {priceFormatterNIO.format(currentPriceNIO)} / {priceFormatterUSD.format(currentPriceUSD)}).
          </p>
        </div>

        <div className="dealer-calc-grid">
          {/* Panel de Controles: Slider de Prima y Plazo */}
          <div className="dealer-calc-controls">
            {/* Control de Prima */}
            <div className="dealer-calc-field">
              <div className="dealer-calc-field__top">
                <label htmlFor="downPaymentSlider">Prima inicial ({downPaymentPercent}%):</label>
                <div className="dealer-calc-down-values">
                  <strong>{priceFormatterNIO.format(downPaymentNIO)}</strong>
                  <span>({priceFormatterUSD.format(downPaymentUSD)})</span>
                </div>
              </div>
              <input
                id="downPaymentSlider"
                type="range"
                min="20"
                max="80"
                step="5"
                value={downPaymentPercent}
                onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                className="dealer-range-slider"
                aria-valuemin={20}
                aria-valuemax={80}
                aria-valuenow={downPaymentPercent}
              />
              <div className="dealer-range-labels">
                <span>Mínimo 20%</span>
                <span>50%</span>
                <span>Máximo 80%</span>
              </div>
            </div>

            {/* Selector de Plazo en Meses */}
            <div className="dealer-calc-field">
              <label id="termSelectorLabel">Plazo del financiamiento:</label>
              <div
                className="dealer-terms-selector"
                role="radiogroup"
                aria-labelledby="termSelectorLabel"
              >
                {FINANCING_TERMS.map((term) => (
                  <button
                    key={term}
                    type="button"
                    role="radio"
                    aria-checked={selectedTerm === term}
                    className={`dealer-term-pill ${selectedTerm === term ? "is-active" : ""}`}
                    onClick={() => setSelectedTerm(term)}
                  >
                    {term} meses
                  </button>
                ))}
              </div>
            </div>

            <p className="dealer-calc-note">
              *Tasa de referencia anual calculada al {interestAnnual}% con seguro y gastos sujetos a confirmación bancaria.
            </p>
          </div>

          {/* Tarjeta de Resumen Financiero */}
          <div className="dealer-calc-summary">
            <div className="dealer-summary-card">
              <span className="dealer-summary-badge">Cuota mensual estimada</span>
              <div className="dealer-monthly-nio">
                {priceFormatterNIO.format(monthlyPaymentNIO)}
                <span className="dealer-per-month">/ mes</span>
              </div>
              <div className="dealer-monthly-usd">
                {priceFormatterUSD.format(monthlyPaymentUSD)} / mes
              </div>

              <div className="dealer-summary-details">
                <div className="summary-row">
                  <span>Monto a financiar:</span>
                  <strong>
                    {priceFormatterNIO.format(financedNIO)}{" "}
                    <small style={{ fontWeight: 500, color: "#94a3b8" }}>
                      ({priceFormatterUSD.format(financedUSD)})
                    </small>
                  </strong>
                </div>
                <div className="summary-row">
                  <span>Prima seleccionada:</span>
                  <strong>
                    {priceFormatterNIO.format(downPaymentNIO)}{" "}
                    <small style={{ fontWeight: 500, color: "#94a3b8" }}>
                      ({downPaymentPercent}%)
                    </small>
                  </strong>
                </div>
                <div className="summary-row">
                  <span>Plazo de pago:</span>
                  <strong>{selectedTerm} meses</strong>
                </div>
              </div>

              <button
                type="button"
                className="dealer-summary-cta"
                onClick={() =>
                  onRequest("quotation", activeTransmission, {
                    downPaymentPercent,
                    downPaymentNIO,
                    downPaymentUSD,
                    termMonths: selectedTerm,
                    monthlyPaymentNIO,
                    monthlyPaymentUSD,
                    financedAmountNIO: financedNIO,
                    financedAmountUSD: financedUSD,
                  })
                }
              >
                Solicitar cotización con este financiamiento
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Matriz Técnica Exhaustiva (Ficha Técnica Tabulada) */}
      <section className="dealer-specs-section reveal-on-scroll" id="ficha-tecnica" aria-labelledby="specs-title">
        <div className="dealer-section-header">
          <span className="dealer-eyebrow">Ingeniería & Prestaciones</span>
          <h2 id="specs-title" className="dealer-section-title">
            Ficha técnica
          </h2>
          <p className="dealer-section-desc">
            Especificaciones mecánicas, equipamiento y dimensiones del {vehicle.brand} {vehicle.model} ({vehicle.year}).
          </p>
        </div>

        <div className="dealer-specs-tables">
          {vehicle.specifications?.map((group, idx) => (
            <div key={group.category} className={`dealer-spec-group reveal-on-scroll reveal-stagger-${(idx % 3) + 1}`}>
              <h3 className="dealer-spec-group__title">{group.category}</h3>
              <table className="dealer-spec-table">
                <tbody>
                  {group.items.map((item) => (
                    <tr key={item.label}>
                      <th scope="row">{item.label}</th>
                      <td>{item.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        {/* 6.1 Galería Fotográfica Multitoma en Ficha Técnica */}
        <div className="dealer-specs-gallery reveal-on-scroll" id="galeria" aria-label="Galería oficial del vehículo">
          <div className="dealer-specs-gallery__header">
            <h3 className="dealer-specs-gallery__title">Galería de imágenes</h3>
            
          </div>

          <div
            className="dealer-gallery__stage dealer-gallery__stage--color-ambience"
            style={galleryColorStyle}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {photos.map((photoUrl, index) => (
              <img
                key={photoUrl}
                className={`dealer-gallery__image ${
                  activePhotoIndex === index ? "is-active" : ""
                }`}
                src={photoUrl}
                alt={`${vehicle.brand} ${vehicle.model} - ${PHOTO_PERSPECTIVES[index] || `Toma ${index + 1}`}`}
                aria-hidden={activePhotoIndex !== index}
                referrerPolicy="no-referrer"
                decoding="async"
                draggable={false}
                loading={index === 0 ? "eager" : "lazy"}
                onClick={() => setIsLightboxOpen(true)}
                title="Haz clic para ver en pantalla completa (Zoom)"
              />
            ))}

            <span className="dealer-badge">{vehicle.category}</span>

            {/* Botón superior de ampliación a pantalla completa */}
            <div className="dealer-gallery__top-actions">
              <button
                type="button"
                className="dealer-gallery__expand-btn"
                onClick={() => setIsLightboxOpen(true)}
                aria-label="Ver fotografía en pantalla completa"
                title="Ampliar fotografía"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </svg>
                <span>Ampliar</span>
              </button>
            </div>

            {/* Flechas de navegación rápida */}
            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  className="dealer-gallery__arrow dealer-gallery__arrow--prev"
                  onClick={prevPhoto}
                  aria-label="Fotografía anterior"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="dealer-gallery__arrow dealer-gallery__arrow--next"
                  onClick={nextPhoto}
                  aria-label="Siguiente fotografía"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </>
            )}

            {/* Barra inferior de metadatos y perspectiva */}
            <div className="dealer-gallery__meta-bar">
              <span className="dealer-gallery__perspective">
                {PHOTO_PERSPECTIVES[activePhotoIndex] || `Ángulo ${activePhotoIndex + 1}`}
              </span>
              <span className="dealer-gallery__counter" aria-live="polite">
                {activePhotoIndex + 1} / {photos.length}
              </span>
            </div>
          </div>

          {/* Miniaturas interactivas */}
          {photos.length > 1 && (
            <div className="dealer-gallery__thumbs" aria-label="Miniaturas de la galería">
              {photos.map((photoUrl, index) => (
                <button
                  key={photoUrl}
                  type="button"
                  aria-pressed={activePhotoIndex === index}
                  className={`dealer-thumb ${activePhotoIndex === index ? "is-active" : ""}`}
                  onClick={() => {
                    if (activePhotoIndex !== index) {
                      setActivePhotoIndex(index);
                    }
                  }}
                  aria-label={`Ver ángulo ${index + 1} de ${vehicle.brand} ${vehicle.model}`}
                >
                  <img
                    src={photoUrl}
                    alt=""
                    aria-hidden="true"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                  />
                </button>
              ))}
            </div>
          )}
        </div>


      </section>

      {/* 7. Banner de Contacto Directo / Agendar Prueba de Manejo */}
      <section className="dealer-contact-banner reveal-on-scroll" aria-labelledby="banner-contact-title">
        <div className="dealer-contact-banner__content">
          <span className="dealer-eyebrow-inverse banner-contact-title">Atención Directa</span>
          <h2 id="banner-contact-title" className="dealer-banner-heading">¿Listo para conducir tu próximo {vehicle.brand} {vehicle.model}?</h2>
          <p>
            Nuestros asesores digitales en Managua y departamentos están listos para coordinar tu cotización formal y prueba de manejo.
          </p>
          <div className="dealer-contact-banner__actions">
            <button
              type="button"
              className="dealer-banner-btn-primary"
              onClick={() => onRequest("quotation", activeTransmission)}
            >
              Solicitar cotización
            </button>
            <button
              type="button"
              className="dealer-banner-btn-secondary"
              onClick={() => onRequest("test-drive", activeTransmission)}
            >
              Agendar prueba de manejo
            </button>
          </div>
        </div>
      </section>

      {/* 8. Barra Flotante Inferior Fija (Sticky Action Bar) */}
      <aside
        className={`dealer-sticky-bar ${isStickyBarVisible ? "is-visible" : "is-hidden"}`}
        aria-label="Acceso rápido a cotización"
      >
        <div className="dealer-sticky-bar__inner">
          <div className="dealer-sticky-bar__info">
            <img
              src={photos[0]}
              alt=""
              aria-hidden="true"
              className="dealer-sticky-thumb"
              referrerPolicy="no-referrer"
            />
            <div>
              <strong className="dealer-sticky-title">
                {vehicle.brand} {vehicle.model}
              </strong>
              <span className="dealer-sticky-subtitle">
                Desde {priceFormatterNIO.format(monthlyPaymentNIO)} / mes ({priceFormatterUSD.format(monthlyPaymentUSD)}) · {activeTransmission.shortLabel}
              </span>
            </div>
          </div>
          <div className="dealer-sticky-bar__actions">
            <button
              type="button"
              className="dealer-sticky-btn"
              onClick={() => onRequest("quotation", activeTransmission)}
            >
              Cotizar ahora
            </button>
          </div>
        </div>
      </aside>

      {/* 9. Lightbox Modal de Alta Resolución / Pantalla Completa */}
      {isLightboxOpen && (
        <div
          className="dealer-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`Visor fotográfico en alta resolución: ${vehicle.brand} ${vehicle.model}`}
        >
          <div
            className="dealer-lightbox__backdrop"
            onClick={() => setIsLightboxOpen(false)}
          />
          <div className="dealer-lightbox__content">
            <header className="dealer-lightbox__header">
              <div className="dealer-lightbox__title-info">
                <strong className="dealer-lightbox__car-title">
                  {vehicle.brand} {vehicle.model} ({vehicle.year})
                </strong>
                <span className="dealer-lightbox__angle-label">
                  {PHOTO_PERSPECTIVES[activePhotoIndex] || `Foto ${activePhotoIndex + 1}`}
                </span>
              </div>
              <div className="dealer-lightbox__controls">
                <span className="dealer-lightbox__counter">
                  {activePhotoIndex + 1} de {photos.length}
                </span>
                <button
                  type="button"
                  className="dealer-lightbox__close-btn"
                  onClick={() => setIsLightboxOpen(false)}
                  aria-label="Cerrar visor de fotos (Escape)"
                  title="Cerrar (Esc)"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </header>

            <div
              className="dealer-lightbox__stage"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <img
                key={photos[activePhotoIndex]}
                src={photos[activePhotoIndex]}
                alt={`${vehicle.brand} ${vehicle.model} - ${PHOTO_PERSPECTIVES[activePhotoIndex] || ""}`}
                className="dealer-lightbox__img"
                draggable={false}
              />

              {photos.length > 1 && (
                <>
                  <button
                    type="button"
                    className="dealer-lightbox__arrow dealer-lightbox__arrow--prev"
                    onClick={prevPhoto}
                    aria-label="Fotografía anterior"
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="dealer-lightbox__arrow dealer-lightbox__arrow--next"
                    onClick={nextPhoto}
                    aria-label="Fotografía siguiente"
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </>
              )}
            </div>

            {photos.length > 1 && (
              <div className="dealer-lightbox__thumbs">
                {photos.map((photoUrl, idx) => (
                  <button
                    key={photoUrl}
                    type="button"
                    className={`dealer-lightbox__thumb-btn ${activePhotoIndex === idx ? "is-active" : ""}`}
                    onClick={() => setActivePhotoIndex(idx)}
                    aria-label={`Ver foto ${idx + 1}`}
                  >
                    <img src={photoUrl} alt="" aria-hidden="true" draggable={false} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
