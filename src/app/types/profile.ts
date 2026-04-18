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
  isFreeSubscription: boolean;
}

export interface Permissions {
  canAddUser: boolean;
  canAddCustomer: boolean;
  canMakeAiAnalysis: boolean;
  canExportExcel: boolean;
  subscriptionActive: boolean;
  canExtractPdf: boolean;
  canEditTheme: boolean;
  dashboardLevel: string;
  supportLevel: string;
  emailNotification: boolean;
  subscriptionStatus: string;
  hasSubscription: boolean;
}
