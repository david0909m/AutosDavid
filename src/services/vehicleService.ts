import type {
  Vehicle,
  VehicleCategory,
  Fuel,
  Transmission,
} from "../types/vehicle";

const categories: VehicleCategory[] = ["SUV", "Sedán", "Pickup", "Hatchback"];
const transmissions: Transmission[] = ["Automática", "Manual"];
const fuels: Fuel[] = ["Gasolina", "Diésel", "Híbrido"];

function isVehicle(value: unknown): value is Vehicle {
  // TypeScript no valida JSON en tiempo de ejecución; esta comprobación delimita los datos
  // que pueden entrar desde una futura API antes de que los componentes los utilicen.
  if (!value || typeof value !== "object") return false;
  const vehicle = value as Record<string, unknown>;
  return (
    typeof vehicle.id === "string" &&
    typeof vehicle.brand === "string" &&
    typeof vehicle.model === "string" &&
    typeof vehicle.year === "number" &&
    typeof vehicle.price === "number" &&
    typeof vehicle.priceNIO === "number" &&
    vehicle.currency === "USD" &&
    categories.includes(vehicle.category as VehicleCategory) &&
    transmissions.includes(vehicle.transmission as Transmission) &&
    fuels.includes(vehicle.fuel as Fuel) &&
    typeof vehicle.description === "string" &&
    typeof vehicle.image === "string" &&
    typeof vehicle.imageAlt === "string" &&
    Array.isArray(vehicle.gallery) &&
    vehicle.gallery.length >= 3 &&
    vehicle.gallery.every((url) => typeof url === "string")
  );
}

export interface VehicleIndexItem {
  id: string;
  brand: string;
  model: string;
  year: number;
  category: VehicleCategory;
  transmission: Transmission;
  fuel: Fuel;
  price: number;
  priceNIO: number;
  image: string;
  imageAlt: string;
  path: string;
}

/** Carga el índice manifiesto de vehículos con rutas a sus respectivos archivos por marca y modelo. */
export async function loadVehicleIndex(): Promise<VehicleIndexItem[]> {
  const basePath = import.meta.env.BASE_URL || "./";
  const normalizedBase = basePath.endsWith("/") ? basePath : `${basePath}/`;
  const indexUrl = `${normalizedBase}data/vehiculos/index.json`;
  const response = await fetch(indexUrl);
  if (!response.ok) {
    throw new Error(`No se pudo cargar el índice de vehículos (HTTP ${response.status}).`);
  }
  return (await response.json()) as VehicleIndexItem[];
}

/** Carga un vehículo individual a partir de su ruta relativa o marca y modelo. */
export async function loadVehicleByPath(relativePath: string): Promise<Vehicle> {
  const basePath = import.meta.env.BASE_URL || "./";
  const normalizedBase = basePath.endsWith("/") ? basePath : `${basePath}/`;
  const url = `${normalizedBase}${relativePath.replace(/^\//, "")}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`No se pudo cargar el archivo del vehículo ${relativePath} (HTTP ${response.status}).`);
  }
  const data: unknown = await response.json();
  if (!isVehicle(data)) {
    throw new Error(`Formato no válido en el vehículo ${relativePath}.`);
  }
  return data;
}

/** Carga el catálogo modular separado por marca y modelo. */
export async function loadVehicles(): Promise<Vehicle[]> {
  // Garantiza compatibilidad tanto en servidor local como en subdirectorios de GitHub Pages
  const basePath = import.meta.env.BASE_URL || "./";
  const normalizedBase = basePath.endsWith("/") ? basePath : `${basePath}/`;
  const indexUrl = `${normalizedBase}data/vehiculos/index.json`;

  const indexResponse = await fetch(indexUrl);
  if (!indexResponse.ok) {
    throw new Error(`No se pudo cargar el índice de vehículos (HTTP ${indexResponse.status}).`);
  }

  const manifest = (await indexResponse.json()) as VehicleIndexItem[];
  const vehiclePromises = manifest.map(async (entry) => {
    const itemUrl = `${normalizedBase}${entry.path.replace(/^\//, "")}`;
    const itemResponse = await fetch(itemUrl);
    if (!itemResponse.ok) {
      throw new Error(`No se pudo cargar ${entry.brand} ${entry.model} (HTTP ${itemResponse.status}).`);
    }
    return (await itemResponse.json()) as unknown;
  });

  const vehicles = await Promise.all(vehiclePromises);
  if (!vehicles.every(isVehicle)) {
    throw new Error("Uno o más vehículos del catálogo modular tienen un formato no válido.");
  }
  return vehicles;
}
