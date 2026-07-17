/** Estado del onboarding del usuario en el backend. */
export type OnboardingStatus = 'no_pack' | 'payment_pending' | 'pending_contract' | 'ready';

/** Estado del contrato macro que el usuario debe firmar (vía ZapSign) antes de operar. */
export type ContractStatus = 'pending_contract' | 'signed' | 'refused' | string;

/**
 * Información del contrato macro devuelta por el backend en el perfil. Cuando
 * `isSigned` es false, el usuario puede entrar a la app pero se le bloquea con
 * un modal hasta que firme (o refresque tras haber firmado en ZapSign).
 */
export interface ContractInfo {
  isSigned: boolean;
  status: ContractStatus;
  statusLabel: string;
  /** URL de ZapSign para firmar el contrato. */
  signUrl: string | null;
  sentAt: string | null;
  signedAt: string | null;
  refusedAt: string | null;
  refusedReason: string | null;
  /** True cuando el documento firmado ya está disponible para descargar. */
  hasSignedDocument?: boolean;
}

export interface Profile {
  id: string;
  email: string;
  name: string;
  lastName: string;
  phone: string;
  roleId: number;
  position: string;
  identificationTypeId?: number;
  identificationNumber?: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  role: string;
  roleName: string;
  hasCompany: boolean;
  isUserActiveInCompany: boolean;
  /** True cuando el usuario ya completó el onboarding (perfil + empresa + compra del paquete confirmada). Equivale a onboardingStatus === 'ready'. */
  isOnboardingReady: boolean;
  /**
   * Estado del onboarding, fuente de verdad para el ruteo tras autenticarse:
   * - `no_pack`: tiene perfil + empresa pero no ha comprado paquete → asistente paso 3.
   * - `payment_pending`: compró pero el pago aún no se confirma → pantalla de pago pendiente.
   * - `pending_contract`: pagó y todo listo, pero falta firmar el contrato macro
   *   → entra al dashboard con un modal bloqueante hasta firmar.
   * - `ready`: onboarding completo → dashboard.
   */
  onboardingStatus: OnboardingStatus;
  /** Estado del contrato macro. Puede faltar en perfiles antiguos ya activos. */
  contract?: ContractInfo;
  permissions: Permissions;
  companyId: string;
  companyName: string;
  companyCity: string;
  companyNit: string;
}

export interface Permissions {
  canAddCreditStudy: boolean;
  canAddUser: boolean;
  canMakeAiAnalysis: boolean;
  canExtractPdf: boolean;
  hasCredits: boolean;
  availableCredits: number;
}
