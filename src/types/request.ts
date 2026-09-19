/** Valores internos para distinguir una cotización o una prueba de manejo. */
export type RequestType = "quotation" | "test-drive";

/** Parámetros cuantitativos calculados en el simulador de financiamiento. */
export interface FinancingSimulationData {
  downPaymentPercent: number;
  downPaymentNIO: number;
  downPaymentUSD: number;
  termMonths: number;
  monthlyPaymentNIO: number;
  monthlyPaymentUSD: number;
  financedAmountNIO: number;
  financedAmountUSD: number;
}

/** Datos mínimos que una futura API necesitaría para procesar una solicitud. */
export interface VehicleRequest {
  vehicleId: string;
  name: string;
  email: string;
  phone: string;
  requestType: RequestType;
  preferredDate?: string;
  city?: string;
  shift?: "mañana" | "tarde";
  notes?: string;
  financing?: FinancingSimulationData;
}

/** Mensajes opcionales por campo que permiten asociar cada error a su control. */
export type RequestErrors = Partial<
  Record<keyof Omit<VehicleRequest, "vehicleId">, string>
>;
