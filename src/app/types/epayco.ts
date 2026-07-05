/**
 * Tipos del Smart Checkout v2 de ePayco.
 * @see https://docs.epayco.com/docs/checkout-implementacion
 *
 * El flujo v2 es session-based: el backend crea la sesión con la llave
 * PRIVADA (POST /payment/session/create) y devuelve un `sessionId`. El
 * front sólo configura el handler con ese id, registra los hooks y abre
 * el checkout. La llave privada nunca llega al navegador.
 */

/** Modo de presentación del checkout. */
export type EpaycoCheckoutType = 'onpage' | 'standard';

/** Configuración que recibe `ePayco.checkout.configure(...)`. */
export interface EpaycoCheckoutConfig {
    sessionId: string;
    type: EpaycoCheckoutType;
    test: boolean;
}

/** Callbacks que registra `handler.setHooks(...)`. */
export interface EpaycoCheckoutHooks {
    /** Se dispara cuando el checkout se abre correctamente. */
    onCreated?: (data: unknown) => void;
    /** Se dispara cuando el pago se procesa, con el resultado de la transacción. */
    onResponse?: (response: EpaycoResponse) => void;
    /** Se dispara ante errores durante el procesamiento del pago. */
    onErrors?: (error: unknown) => void;
    /** Se dispara cuando el usuario cierra el checkout. */
    onClosed?: (errors: unknown) => void;
}

/** Resultado de la transacción entregado por el hook `onResponse`. */
export interface EpaycoResponse {
    /** Referencia de la transacción en ePayco. */
    ref_payco?: string;
    /** Código de respuesta de la transacción. */
    cod_response?: number;
    /** Estado legible: "Aceptada", "Rechazada", "Pendiente"… */
    status?: string;
    [key: string]: unknown;
}

/** Handler que devuelve `ePayco.checkout.configure(...)`. */
export interface EpaycoCheckoutHandler {
    setHooks(hooks: EpaycoCheckoutHooks): void;
    /** Abre el checkout embebido (modal onpage). */
    open(): void;
    /** Abre el checkout en una ventana/pestaña nueva. */
    openNew(): void;
}

/** Objeto global que inyecta el script `checkout-v2.js`. */
export interface EpaycoGlobal {
    checkout: {
        configure(config: EpaycoCheckoutConfig): EpaycoCheckoutHandler;
    };
}

/**
 * Datos que devuelve el endpoint público de validación
 * `GET https://secure.epayco.co/validation/v1/reference/{ref}`.
 * Sólo tipamos los campos que usamos; el resto llega igual.
 */
export interface EpaycoValidationData {
    x_ref_payco?: string;
    /** Estado legible: "Aceptada", "Rechazada", "Pendiente", "Fallida". */
    x_response?: string;
    /** Código de estado: 1 aceptada, 2 rechazada, 3 pendiente, 4 fallida. */
    x_cod_response?: number;
    x_transaction_state?: string;
    x_amount?: string | number;
    x_currency_code?: string;
    x_response_reason_text?: string;
    x_transaction_id?: string;
    [key: string]: unknown;
}

/** Envoltura de la respuesta de validación de ePayco. */
export interface EpaycoValidationResponse {
    success: boolean;
    data: EpaycoValidationData;
}

declare global {
    interface Window {
        ePayco?: EpaycoGlobal;
    }
}
