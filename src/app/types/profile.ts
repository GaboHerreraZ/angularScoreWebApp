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
