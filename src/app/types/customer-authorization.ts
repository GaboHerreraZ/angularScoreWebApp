/**
 * Autorización de tratamiento de datos (habeas data + consulta en centrales) del
 * titular. Es el gate del bureau: sin una firmada y vigente no se puede consultar
 * al titular, así que ninguno de los tres productos (estudio con EEFF, estudio de
 * capacidad de pago y consulta de riesgo) se puede crear.
 *
 * Hay UNA sola por titular y empresa, no una por producto: firmarla o cargarla
 * desde cualquiera de los tres la deja vigente para los otros dos y para los
 * estudios futuros del mismo titular.
 *
 * Definición canónica: `types/credit-study.ts` y `types/customer.ts` la
 * re-exportan para no romper los imports existentes.
 */

export type CustomerAuthorizationStatus =
    | 'not_requested'
    | 'pending'
    | 'signed'
    | 'refused'
    | 'expired'
    | 'revoked';

/** Cómo se obtuvo la firma: en línea por el proveedor o cargada por la empresa. */
export type CustomerAuthorizationSignatureSource = 'provider' | 'manual_upload';

export interface CustomerAuthorization {
    id?: string | null;
    /** Ver `CustomerAuthorizationStatus`. */
    status: string | null;
    statusLabel?: string | null;
    /** Firmada y no revocada: lo único que el gate del bureau mira. */
    isSigned: boolean;
    signatureSource?: CustomerAuthorizationSignatureSource | null;
    /** Nombre del PDF cargado; solo con `signatureSource === 'manual_upload'`. */
    signedFileName?: string | null;
    signUrl: string | null;
    sentAt: string | null;
    signedAt: string | null;
    refusedAt: string | null;
    refusedReason: string | null;
    revokedAt: string | null;
    /** Enlace de descarga del PDF firmado; vigencia 1 hora. */
    documentUrl?: string | null;
}
