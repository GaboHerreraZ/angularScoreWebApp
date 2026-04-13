export interface TestUser {
  email: string;
  password: string;
}

export interface CustomerNatural {
  businessName: string;
  identificationNumber: string;
  seniority: number;
  email: string;
  phone: string;
  address: string;
  commercialRef1Name: string;
  commercialRef1Contact: string;
  commercialRef1Phone: string;
  observations: string;
}

export interface CustomerJuridica {
  businessName: string;
  identificationNumber: string;
  seniority: number;
  legalRepName: string;
  legalRepId: string;
  legalRepEmail: string;
  legalRepPhone: string;
  email: string;
  phone: string;
  address: string;
  observations: string;
}

export interface CustomerFixture {
  natural: CustomerNatural;
  juridica: CustomerJuridica;
}
