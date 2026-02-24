export interface User {
  id: string;
  email: string;
  name?: string;
  lastName?: string;
  phone?: string;
  role?: string;
  position?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}