import { useEffect, useMemo, useRef, useState } from "react";
import { RequestForm } from "./components/RequestForm";
import { ShopperHub } from "./components/ShopperHub";
import { TrustSection } from "./components/TrustSection";
import { VehicleCard } from "./components/VehicleCard";
import { VehicleDetail } from "./components/VehicleDetail";
import { VehicleSpotlight } from "./components/VehicleSpotlight";
import { useVehiculos } from "./hooks/useVehiculos";
import { useScrollReveal } from "./hooks/useScrollReveal";
import type { FinancingSimulationData, RequestType } from "./types/request";
import type { VehicleTransmissionOption } from "./types/vehicle";

/** Valores permitidos para el orden; `default` conserva el orden del catálogo. */
type PriceOrder = "default" | "asc" | "desc";
/** Vistas locales de la SPA; no requieren rutas mientras no haya URLs compartibles. */
type View = "catalog" | "detail" | "request";
/** Sección del detalle que puede abrirse desde un acceso directo. */
type DetailSectionId = "financiamiento";
/** Fuente única de las categorías que usan los controles de filtrado. */
const categories = ["Todas", "SUV", "Sedán", "Pickup", "Hatchback"] as const;
/** Marcas disponibles en el catálogo para filtrado directo. */
const brands = ["Todas", "Toyota", "Suzuki", "Nissan", "Hyundai", "Kia"] as const;

// Normalizar la consulta evita que capitalización y espacios accidentales alteren la búsqueda.
function normalizeSearchTerm(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("es");
}

/** Coordina la carga de datos y las tres vistas principales de la aplicación. */
function App() {
  /** Hook personalizado que gestiona la carga asíncrona real y los estados del catálogo. */
  const { vehicles, isLoading, error, retryLoad } = useVehiculos();
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("Todas");
  const [selectedBrand, setSelectedBrand] = useState<(typeof brands)[number]>("Todas");
  const [priceOrder, setPriceOrder] = useState<PriceOrder>("default");
  /** Define cuál vista se muestra sin perder los filtros de la sesión. */
  const [view, setView] = useState<View>("catalog");
  /** El ID recupera el vehículo desde la fuente única `vehicles`. */
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [selectedRequestType, setSelectedRequestType] = useState<RequestType>("quotation");
  const [selectedTransmission, setSelectedTransmission] = useState<VehicleTransmissionOption | undefined>(undefined);
  const [selectedFinancing, setSelectedFinancing] = useState<FinancingSimulationData | undefined>(undefined);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pendingCatalogSection, setPendingCatalogSection] = useState<string | null>(null);
  const [pendingDetailSection, setPendingDetailSection] = useState<DetailSectionId | null>(null);
  const catalogHeadingRef = useRef<HTMLHeadingElement>(null);
  const detailHeadingRef = useRef<HTMLHeadingElement>(null);
  const requestHeadingRef = useRef<HTMLHeadingElement>(null);
  const hasNavigated = useRef(false);

  // Se guarda solo el identificador: el vehículo sigue teniendo una única fuente de datos, `vehicles`.
  const selectedVehicle = vehicles.find(
    (vehicle) => vehicle.id === selectedVehicleId,
  );
  // Vehículo seleccionado para el cartel de campaña / spotlight estilo Chevrolet.com
  const spotlightVehicle = useMemo(() => {
    return (
      vehicles.find((v) => v.category === "Pickup") ||
      vehicles.find((v) => v.category === "SUV") ||
      vehicles[0]
    );
  }, [vehicles]);
  // Los resultados son derivados, no otro estado: así filtros y orden siempre parten del catálogo cargado.
  // La copia antes de ordenar protege el arreglo original que se recibió del servicio.
  const visibleVehicles = useMemo(() => {
    const query = normalizeSearchTerm(searchTerm);
    const filteredVehicles = vehicles.filter((vehicle) => {
      const name = normalizeSearchTerm(`${vehicle.brand} ${vehicle.model}`);
      const matchesSearch = !query || name.includes(query);
      const matchesCategory = category === "Todas" || vehicle.category === category;
      const matchesBrand = selectedBrand === "Todas" || vehicle.brand === selectedBrand;
      return matchesSearch && matchesCategory && matchesBrand;
    });
    return priceOrder === "default"
      ? filteredVehicles
      : [...filteredVehicles].sort((first, second) =>
          priceOrder === "asc"
            ? first.price - second.price
            : second.price - first.price,
        );
  }, [category, priceOrder, searchTerm, selectedBrand, vehicles]);

  /** Restaura los controles sin volver a solicitar el catálogo. */
  function clearFilters() {
    setSearchTerm("");
    setCategory("Todas");
    setSelectedBrand("Todas");
    setPriceOrder("default");
  }
  /** Abre la ficha y permite llevar al usuario a una sección concreta cuando corresponde. */
  function openVehicleDetail(vehicleId: string, section?: DetailSectionId) {
    hasNavigated.current = true;
    setSelectedVehicleId(vehicleId);
    setSelectedFinancing(undefined);
    setPendingDetailSection(section ?? null);
    setIsMobileMenuOpen(false);
    setView("detail");
  }
  /** Vuelve al catálogo conservando los filtros aplicados. */
  function returnToCatalog() {
    setSelectedFinancing(undefined);
    setPendingDetailSection(null);
    setView("catalog");
  }
  /** Lleva al formulario conservando el vehículo, la intención y la versión elegida. */
  function openRequest(
    requestType: RequestType,
    transmission?: VehicleTransmissionOption,
    financing?: FinancingSimulationData,
  ) {
    setSelectedRequestType(requestType);
    setSelectedTransmission(transmission);
    setSelectedFinancing(financing);
    setView("request");
  }

  /** Desplaza a una sección del catálogo, incluso cuando el usuario viene de otra vista. */
  function navigateToCatalogSection(sectionId: string) {
    setIsMobileMenuOpen(false);
    if (view !== "catalog") {
      setPendingCatalogSection(sectionId);
      setView("catalog");
      return;
    }
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
  }

  /** Aplica una categoría desde el pie de página y muestra el catálogo ya filtrado. */
  function openCategory(categoryFilter: (typeof categories)[number]) {
    setCategory(categoryFilter);
    navigateToCatalogSection("catalog-title");
  }

  /** Lleva a la calculadora real del vehículo destacado en vez de mostrar una acción ambigua. */
  function openFeaturedFinancing() {
    if (spotlightVehicle) {
      openVehicleDetail(spotlightVehicle.id, "financiamiento");
    }
  }

  // Al cambiar de vista, el foco llega al título nuevo para que teclado y lector de pantalla
  // reciban el mismo contexto que una navegación entre páginas.
  useEffect(() => {
    if (view === "detail") detailHeadingRef.current?.focus();
    else if (view === "request") requestHeadingRef.current?.focus();
    else if (hasNavigated.current) catalogHeadingRef.current?.focus();
  }, [view]);

  // Espera a que la vista destino exista antes de desplazar los accesos del menú y financiamiento.
  useEffect(() => {
    if (view !== "catalog" || !pendingCatalogSection) return;
    const frameId = window.requestAnimationFrame(() => {
      document.getElementById(pendingCatalogSection)?.scrollIntoView({ behavior: "smooth" });
      setPendingCatalogSection(null);
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [pendingCatalogSection, view]);

  useEffect(() => {
    if (view !== "detail" || !pendingDetailSection) return;
    const frameId = window.requestAnimationFrame(() => {
      document.getElementById(pendingDetailSection)?.scrollIntoView({ behavior: "smooth" });
      setPendingDetailSection(null);
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [pendingDetailSection, view]);

  // Activa animaciones fluidas al hacer scroll para los elementos con .reveal-on-scroll
  useScrollReveal(`${view}-${vehicles.length}-${visibleVehicles.length}-${category}-${selectedBrand}-${searchTerm}`);

  const hasActiveFilters =
    searchTerm.length > 0 ||
    category !== "Todas" ||
    selectedBrand !== "Todas" ||
    priceOrder !== "default";
  const activeFilterCount =
    (searchTerm.length > 0 ? 1 : 0) +
    (category !== "Todas" ? 1 : 0) +
    (selectedBrand !== "Todas" ? 1 : 0) +
    (priceOrder !== "default" ? 1 : 0);

  // Este selector mantiene el detalle y el formulario dentro de la SPA sin introducir rutas
  // mientras no sea necesario compartir una URL por vehículo.
  const mainContent = (() => {
    if (selectedVehicle && view === "detail") {
      return (
        <VehicleDetail
          key={selectedVehicle.id}
          vehicle={selectedVehicle}
          headingRef={detailHeadingRef}
          onBack={returnToCatalog}
          onRequest={openRequest}
        />
      );
    }

    if (selectedVehicle && view === "request") {
      return (
        <RequestForm
          vehicle={selectedVehicle}
          initialRequestType={selectedRequestType}
          selectedTransmission={selectedTransmission}
          financingData={selectedFinancing}
          headingRef={requestHeadingRef}
          onBack={() => setView("detail")}
        />
      );
    }

    return (
      <main className="catalog-page">
        <header className="hero">
          <div className="hero__overlay" aria-hidden="true" />
          <div className="hero__content">
            <h1>Encuentra el vehículo que define tu camino.</h1>
            <p className="hero__description">
              Explora vehículos, compara sus especificaciones y calcula una cuota de referencia en C$ y USD antes de solicitar información.
            </p>
            <div className="hero__actions">
              <button
                type="button"
                className="hero__btn hero__btn--primary"
                onClick={() => navigateToCatalogSection("catalog-title")}
              >
                <span>Explorar inventario</span>
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
              </button>
              <button
                type="button"
                className="hero__btn hero__btn--secondary"
                onClick={() => navigateToCatalogSection("vehicle-spotlight-section")}
              >
                Ver oferta destacada
              </button>
            </div>
          </div>
        </header>

        <ShopperHub
          onExploreInventory={() => navigateToCatalogSection("catalog-title")}
          onViewFinancing={openFeaturedFinancing}
          onViewTrust={() => navigateToCatalogSection("trust-section")}
          onDirectContact={() => {
            window.location.href = "tel:+50522550000";
          }}
        />

        {spotlightVehicle && (
          <div id="vehicle-spotlight-section">
            <VehicleSpotlight
              vehicle={spotlightVehicle}
              onSelect={openVehicleDetail}
              onViewFinancing={openFeaturedFinancing}
            />
          </div>
        )}

        <section
          className="catalog"
          aria-labelledby="catalog-title"
          aria-busy={isLoading}
        >
          <div className="catalog__heading reveal-on-scroll">
            <h2 id="catalog-title" ref={catalogHeadingRef} tabIndex={-1}>
              Vehículos disponibles
            </h2>
            {!isLoading && !error && (
              <p className="result-count" aria-live="polite" aria-atomic="true">
                <span className="result-count__number">
                  {visibleVehicles.length}
                </span>{" "}
                {visibleVehicles.length === 1
                  ? "vehículo disponible"
                  : "vehículos disponibles"}
              </p>
            )}
          </div>

          {isLoading && (
            <div className="status status--loading" role="status">
              <span className="loading-spinner" aria-hidden="true" />
              <p>Cargando catálogo de vehículos…</p>
            </div>
          )}

          {error && (
            <div className="status status--error" role="alert">
              <div className="status__icon" aria-hidden="true">
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
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div className="status__body">
                <h3>No pudimos cargar el catálogo</h3>
                <p>{error} Revisa tu conexión e inténtalo de nuevo.</p>
                <button
                  type="button"
                  className="button--primary"
                  onClick={() => void retryLoad()}
                >
                  Reintentar carga
                </button>
              </div>
            </div>
          )}

          {!isLoading && !error && vehicles.length === 0 && (
            <div className="status status--empty" role="status">
              <h3>El catálogo está vacío por ahora</h3>
              <p>
                Vuelve a visitarnos pronto para conocer nuevas unidades
                disponibles.
              </p>
            </div>
          )}

          {!isLoading && !error && vehicles.length > 0 && (
            <>
              <div className="catalog-filters-wrapper reveal-on-scroll">
                {/* Categorías de carrocería: son filtros independientes, no pestañas de contenido. */}
                <div
                  className="catalog-category-tabs"
                  aria-label="Filtrar por carrocería"
                >
                  {categories.map((option) => {
                    const count =
                      option === "Todas"
                        ? vehicles.length
                        : vehicles.filter((v) => v.category === option).length;
                    return (
                      <button
                        key={option}
                        type="button"
                        aria-pressed={category === option}
                        className={`category-tab ${category === option ? "is-active" : ""}`}
                        onClick={() => setCategory(option)}
                      >
                        <span className="category-tab__label">{option}</span>
                        <span className="category-tab__count">{count}</span>
                      </button>
                    );
                  })}
                </div>

                {/* 2. Barra de herramientas unificada (Búsqueda + Marca + Ordenar + Limpiar) */}
                <div className="catalog-toolbar">
                  {/* Búsqueda rápida */}
                  <div className="catalog-toolbar__search">
                    <svg
                      className="search-icon"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                      id="vehicle-search"
                      type="search"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Buscar por modelo o versión..."
                      aria-label="Buscar vehículo"
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        className="search-clear-btn"
                        aria-label="Borrar término de búsqueda"
                        onClick={() => setSearchTerm("")}
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Acciones de filtro y orden */}
                  <div className="catalog-toolbar__actions">
                    {/* Filtro por Marca */}
                    <div className="toolbar-select-wrap">
                      <select
                        id="brand-filter"
                        className={`toolbar-select ${selectedBrand !== "Todas" ? "is-active" : ""}`}
                        value={selectedBrand}
                        onChange={(event) =>
                          setSelectedBrand(
                            event.target.value as (typeof brands)[number],
                          )
                        }
                        aria-label="Filtrar por marca"
                      >
                        <option value="Todas">Todas las marcas</option>
                        {brands
                          .filter((b) => b !== "Todas")
                          .map((b) => {
                            const count = vehicles.filter(
                              (v) => v.brand === b,
                            ).length;
                            return (
                              <option key={b} value={b}>
                                {b} ({count})
                              </option>
                            );
                          })}
                      </select>
                      <svg
                        className="toolbar-select__chevron"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>

                    {/* Ordenar por precio */}
                    <div className="toolbar-select-wrap">
                      <select
                        id="price-order"
                        className={`toolbar-select ${priceOrder !== "default" ? "is-active" : ""}`}
                        value={priceOrder}
                        onChange={(event) =>
                          setPriceOrder(event.target.value as PriceOrder)
                        }
                        aria-label="Ordenar por precio"
                      >
                        <option value="default">Ordenar: Por defecto</option>
                        <option value="asc">Precio: Menor a mayor</option>
                        <option value="desc">Precio: Mayor a menor</option>
                      </select>
                      <svg
                        className="toolbar-select__chevron"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>

                    {/* Botón para limpiar filtros */}
                    {hasActiveFilters && (
                      <button
                        className="toolbar-clear-btn"
                        type="button"
                        onClick={clearFilters}
                        title="Restablecer filtros aplicados"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                        <span>Limpiar ({activeFilterCount})</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {visibleVehicles.length === 0 ? (
                <div className="status status--empty" role="status">
                  <div className="status--empty__icon" aria-hidden="true">
                    <svg
                      width="36"
                      height="36"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </div>
                  <h3>No encontramos vehículos que coincidan</h3>
                  <p>
                    Prueba cambiando la marca seleccionada, la categoría o el término de búsqueda.
                  </p>
                  <button
                    type="button"
                    className="button--secondary"
                    onClick={clearFilters}
                  >
                    Restablecer todos los filtros
                  </button>
                </div>
              ) : (
                <div className="vehicle-grid">
                  {visibleVehicles.map((vehicle) => (
                    <VehicleCard
                      key={vehicle.id}
                      vehicle={vehicle}
                      onSelect={openVehicleDetail}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </section>
        <TrustSection onContactClick={() => { window.location.href = "tel:+50522550000"; }} />
      </main>
    );
  })();

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="site-header__inner">
          <button
            type="button"
            className="site-logo"
            onClick={returnToCatalog}
            aria-label="AutosDavid - Ir al inicio del catálogo"
          >
            <img
              src="./LogoAutosDavid-optimized.png"
              alt="AutosDavid"
              className="site-logo__img"
            />
            <span className="site-logo__brand">
              <span className="site-logo__title">AutosDavid</span>
              <span className="site-logo__tagline">Concesionario Digital · Nicaragua</span>
            </span>
          </button>

          <nav className="site-header__nav" aria-label="Navegación principal">
            <button
              type="button"
              className="site-nav-link"
              onClick={() => navigateToCatalogSection("catalog-title")}
            >
              Inventario
            </button>
            <button
              type="button"
              className="site-nav-link"
              onClick={() => navigateToCatalogSection("vehicle-spotlight-section")}
            >
              Ofertas
            </button>
            <button
              type="button"
              className="site-nav-link"
              onClick={() => navigateToCatalogSection("trust-section")}
            >
              Garantía
            </button>
            <button
              type="button"
              className="site-nav-link"
              onClick={() => navigateToCatalogSection("footer-section")}
            >
              Contacto
            </button>
          </nav>

          <button
            type="button"
            className="mobile-menu-toggle"
            aria-label={isMobileMenuOpen ? "Cerrar menú de navegación" : "Abrir menú de navegación"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {isMobileMenuOpen ? (
                <>
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </>
              ) : (
                <>
                  <path d="M4 6h16" />
                  <path d="M4 12h16" />
                  <path d="M4 18h16" />
                </>
              )}
            </svg>
          </button>

          <div className="site-header__contact">
            <span className="site-header__location">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              Managua, Nicaragua
            </span>
            <a
              href="tel:+50522550000"
              className="site-header__cta"
              aria-label="Llamar a central de atención de AutosDavid"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <span>PBX: (+505) 2255-0000</span>
            </a>
          </div>
        </div>

        {isMobileMenuOpen && (
          <nav id="mobile-navigation" className="mobile-navigation" aria-label="Navegación móvil">
            <button type="button" onClick={() => navigateToCatalogSection("catalog-title")}>
              Inventario
            </button>
            <button type="button" onClick={() => navigateToCatalogSection("vehicle-spotlight-section")}>
              Oferta destacada
            </button>
            <button type="button" onClick={() => navigateToCatalogSection("trust-section")}>
              Garantía
            </button>
            <button type="button" onClick={() => navigateToCatalogSection("footer-section")}>
              Contacto
            </button>
            <a
              href="tel:+50522550000"
              className="mobile-navigation__phone"
              aria-label="Llamar al PBX de AutosDavid"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <span>PBX: (+505) 2255-0000</span>
            </a>
          </nav>
        )}
      </header>

      {mainContent}

      <footer id="footer-section" className="site-footer">
        <div className="site-footer__grid">
          <div className="site-footer__col">
            <div className="site-footer__brand-title">
              <div className="site-footer__logo-wrap">
                <img
                  src="./LogoAutosDavid-optimized.png"
                  alt="AutosDavid"
                  className="site-footer__logo-img"
                />
              </div>
              <span className="site-footer__brand-name">AutosDavid</span>
            </div>
            <p className="site-footer__about">
              Catálogo digital multimarca para explorar vehículos, comparar especificaciones y calcular cuotas de referencia en Nicaragua.
            </p>
          </div>

          <div className="site-footer__col">
            <h3 className="site-footer__col-title">Inventario</h3>
            <ul className="site-footer__list">
              <li>
                <button
                  type="button"
                  onClick={() => openCategory("Pickup")}
                >
                  Pickups y Camionetas
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => openCategory("SUV")}
                >
                  SUVs y Crossovers
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => openCategory("Sedán")}
                >
                  Sedanes Ejecutivos
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => openCategory("Hatchback")}
                >
                  Hatchbacks Urbanos
                </button>
              </li>
            </ul>
          </div>

          <div className="site-footer__col">
            <h3 className="site-footer__col-title">Financiamiento</h3>
            <ul className="site-footer__list">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    openFeaturedFinancing();
                  }}
                >
                  Calcular financiamiento
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    navigateToCatalogSection("trust-section");
                  }}
                >
                  Información de la unidad
                </button>
              </li>
              <li>
                <a href="tel:+50522550000">Prueba de Manejo</a>
              </li>
              <li>
                <a href="tel:+50522550000">Consultar opciones de financiamiento</a>
              </li>
            </ul>
          </div>

          <div className="site-footer__col">
            <h3 className="site-footer__col-title">Sala de Ventas</h3>
            <div className="site-footer__contact-info">
              <div className="site-footer__contact-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>Pista Jean Paul Genie, Managua, Nicaragua</span>
              </div>
              <div className="site-footer__contact-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>Lun - Vie: 8:00 AM - 6:00 PM<br />Sábados: 8:00 AM - 1:00 PM</span>
              </div>
              <div className="site-footer__contact-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <span>Central: (+505) 2255-0000</span>
              </div>
            </div>
          </div>
        </div>

        <div className="site-footer__bottom">
          <p className="site-footer__disclaimer">
            *Sitio de demostración. Precios, cuotas y especificaciones son orientativos y deben verificarse con el vendedor y la entidad financiera correspondiente.
          </p>
          <p className="site-footer__legal">
            © {new Date().getFullYear()} AutosDavid &bull; Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
