import type { VehicleRequest } from "../types/request";

/** Permite activar un fallo predecible durante las pruebas de interfaz. */
type SubmissionOptions = { shouldFail?: boolean };

/**
 * Aísla la simulación del envío para que el formulario no dependa de cómo se implemente el backend.
 * El retraso y el fallo opcional permiten comprobar estados de interfaz sin usar fallos aleatorios.
 */
export async function submitVehicleRequest(
  request: VehicleRequest,
  { shouldFail = false }: SubmissionOptions = {},
): Promise<VehicleRequest> {
  await new Promise<void>((resolve) => window.setTimeout(resolve, 700));

  if (shouldFail) {
    throw new Error(
      "Error simulado de desarrollo. Tus datos siguen en el formulario.",
    );
  }

  return request;
}
