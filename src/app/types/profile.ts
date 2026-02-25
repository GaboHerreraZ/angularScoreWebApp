export interface Profile {
  id: string;
  email: string;
  name: string;
  lastName: string;
  phone: string;
  roleId: number;
  position: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  role: Role;
  userCompanies: UserCompany[];
}

export interface Role {
  id: number;
  type: string;
  code: string;
  label: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserCompany {
  companyId: string;
  company: Company;
}

interface Company {
  city: string;
  nit: string;
  name: string;
  companySubscriptions: Subscription[];

}

interface Subscription {
  startDate: Date;
  endDate: Date;
  isCurrent: boolean;
  status: {
    id: number;
    code: string;
    label: string;
  };
  subscription: {
    id: string;
    name: string;
    emailNotifications: boolean
    excelReports: boolean;
    isMonthly: boolean;
    maxCompanies: number;
    maxCustomers: number;
    maxStudiesPerMonth: number;
    maxUsers: number;
    themeCustomization: boolean;
    isActive: boolean;
    dashboardLevel: {
      id: string;
      code: string;
    },
    supportLevel: {
      id: string;
      code: string;
    }
  }
}