import { useCallback, useEffect, useState } from "react";
import { loadVehicles } from "../services/vehicleService";
import type { Vehicle } from "../types/vehicle";

/**
 * Hook personalizado para cargar y gestionar el estado del catálogo de vehículos.
 * Encapsula la llamada asíncrona real a través de fetch(), manejando los estados de
 * carga genuina, datos recibidos y posibles errores de red o parseo.
 */
export function useVehiculos() {
  const [vehiculos, setVehiculos] = useState<Vehicle[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carga inicial al montar el componente en el navegador
  useEffect(() => {
    let cancelado = false;

    async function cargarInicial() {
      try {
        const data = await loadVehicles();
        if (!cancelado) {
          setVehiculos(data);
        }
      } catch (err) {
        if (!cancelado) {
          setError(
            err instanceof Error
              ? err.message
              : "No se pudieron cargar los vehículos. Revisa tu conexión.",
          );
        }
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    }

    void cargarInicial();

    return () => {
      cancelado = true;
    };
  }, []);

  /**
   * Permite reintentar manualmente la carga en caso de fallo de red.
   */
  const reintentar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const data = await loadVehicles();
      setVehiculos(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los vehículos. Revisa tu conexión.",
      );
    } finally {
      setCargando(false);
    }
  }, []);

  return {
    vehiculos,
    cargando,
    error,
    reintentar,
    // Alias en inglés para compatibilidad fluida con el resto de la aplicación
    vehicles: vehiculos,
    isLoading: cargando,
    retryLoad: reintentar,
  };
}
