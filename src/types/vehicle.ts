export type VehicleCategory = "SUV" | "Sedán" | "Pickup" | "Hatchback";
export type Transmission = "Automática" | "Manual";
export type Fuel = "Gasolina" | "Diésel" | "Híbrido";

/** Métrica rápida destacada en el hero de la ficha técnica (ej. Motor, HP, Pasajeros). */
export interface VehicleMetric {
  label: string;
  value: string;
  hint?: string;
}

/** Color oficial de carrocería con muestra visual (swatch). */
export interface VehicleColor {
  name: string;
  hex: string;
}

/** Sección narrativa con historia de producto (Diseño, Interior, Tecnología, Seguridad). */
export interface VehicleFeatureStory {
  id: "design" | "interior" | "technology" | "safety";
  category: string;
  title: string;
  subtitle: string;
  description: string;
  highlights: string[];
}

/** Categoría agrupada dentro de la tabla de especificaciones técnicas. */
export interface VehicleSpecificationGroup {
  category: string;
  items: { label: string; value: string }[];
}

/** Parámetros de crédito predeterminados para la calculadora de financiamiento. */
export interface VehicleFinancingTerms {
  minDownPaymentPercent: number;
  defaultTermMonths: number;
  maxTermMonths: number;
  interestRateAnnual: number;
}

/** Opción de transmisión disponible para el vehículo (Manual vs. Automática) con precio diferenciado. */
export interface VehicleTransmissionOption {
  type: Transmission;
  label: string;
  shortLabel: string;
  priceUSD: number;
  priceNIO: number;
  isDefault?: boolean;
}

/** Datos que la aplicación necesita para presentar un vehículo del catálogo. */
export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  /** Precio en Córdobas (NIO) calculado al tipo de cambio de referencia. */
  priceNIO: number;
  currency: "USD";
  category: VehicleCategory;
  transmission: Transmission;
  fuel: Fuel;
  description: string;
  image: string;
  imageAlt: string;
  /** Galería interactiva con mínimo 3 fotos limpias (exterior e interior). */
  gallery: string[];
  /** Eslogan de campaña del vehículo (ej. 'Yaris sedán conquistará la ciudad'). */
  slogan?: string;
  /** Métricas técnicas inmediatas para el hero. */
  metrics?: VehicleMetric[];
  /** Opciones de transmisión disponibles para el modelo (con precios dinámicos). */
  transmissions?: VehicleTransmissionOption[];
  /** Paleta de colores de carrocería oficiales con código hex. */
  colors?: VehicleColor[];
  /** Módulos editoriales de producto estilo concesionario oficial. */
  features?: VehicleFeatureStory[];
  /** Matriz técnica exhaustiva organizada por categorías. */
  specifications?: VehicleSpecificationGroup[];
  /** Configuración de la calculadora de financiamiento en cuotas. */
  financing?: VehicleFinancingTerms;
}
