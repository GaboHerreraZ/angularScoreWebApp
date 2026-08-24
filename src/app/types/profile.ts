/** Estado del onboarding del usuario en el backend. */
export type OnboardingStatus = 'no_pack' | 'payment_pending' | 'ready';

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
   * - `ready`: onboarding completo → dashboard.
   */
  onboardingStatus: OnboardingStatus;
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
