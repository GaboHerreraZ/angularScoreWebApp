import { Page } from '@playwright/test';
import { El } from '../../helpers/el';
import { Ui, Notifications } from '../../helpers/ui';
import { CustomerNatural, CustomerJuridica } from '../../fixtures/types';

const locators = {
  // Header
  titleNew: 'Nuevo Cliente',
  titleEdit: 'Editar Cliente',
  iconNew: '.pi-user-plus',
  iconEdit: '.pi-user-edit',
  saveButton: 'Guardar',
  cancelButton: 'Cancelar',
  backArrow: 'button .pi-arrow-left',

  // Sections
  sectionGeneral: 'Información General',
  sectionLegalRep: 'Representante Legal',
  sectionContact: 'Información de Contacto',
  sectionReferences: 'Referencias Comerciales',
  sectionObservations: 'Observaciones',

  // General info (IDs)
  businessName: 'businessName',
  identificationNumber: 'identificationNumber',
  seniority: 'seniority',

  // General info (formControlNames for dropdowns)
  personTypeId: 'personTypeId',
  identificationTypeId: 'identificationTypeId',
  economicActivityId: 'economicActivityId',

  // Legal rep (IDs)
  legalRepName: 'legalRepName',
  legalRepId: 'legalRepId',
  legalRepEmail: 'legalRepEmail',
  legalRepPhone: 'legalRepPhone',
  legalRepIdentificationTypeId: 'legalRepIdentificationTypeId',

  // Contact (IDs)
  email: 'email',
  phone: 'phone',
  secondaryPhone: 'secondaryPhone',
  address: 'address',
  stateControl: 'app-state-control p-select',
  cityControl: 'app-city-control p-select',

  // References (IDs)
  ref1Name: 'commercialRef1Name',
  ref1Contact: 'commercialRef1Contact',
  ref1Phone: 'commercialRef1Phone',

  // Observations (ID)
  observations: 'observations',
} as const;

const messages = {
  createdOk: 'Cliente creado correctamente',
  updatedOk: 'Cliente actualizado correctamente',
} as const;

const errors = {
  required: 'Este campo es obligatorio',
  invalidEmail: 'Ingrese un email válido',
  minValue: 'El valor debe ser mayor o igual a 0',
} as const;

export class CustomerDetailPage {
  readonly locators = locators;
  readonly messages = messages;
  readonly errors = errors;

  private el: El;
  private ui: Ui;
  private notifications: Notifications;

  constructor(private page: Page) {
    this.el = new El(page);
    this.ui = new Ui(page);
    this.notifications = new Notifications(page);
  }

  async visit() {
    await this.page.goto('/app/clientes/detalle-cliente');
  }

  async save(force = false) {
    await this.el.button(locators.saveButton).click({ force });
  }

  async cancel() {
    await this.el.button(locators.cancelButton).click();
  }

  async goBack() {
    await this.page.locator(locators.backArrow).first().click();
  }

  async saveShouldBeDisabled() {
    await this.el.button(locators.saveButton).isDisabled();
  }

  async saveShouldBeEnabled() {
    await this.el.button(locators.saveButton).isEnabled();
  }

  // -----------------------------------------------------------------------
  // Form fill methods
  // -----------------------------------------------------------------------

  async fillGeneralInfo(opts: {
    personType: string;
    idType: string;
    businessName: string;
    identificationNumber: string;
    economicActivity: string;
    seniority: number;
  }) {
    await this.ui.selectDropdown(locators.personTypeId, opts.personType);
    await this.ui.selectDropdown(locators.identificationTypeId, opts.idType);
    await this.el.type(locators.businessName, opts.businessName);
    await this.el.type(locators.identificationNumber, opts.identificationNumber);
    await this.ui.selectDropdown(locators.economicActivityId, opts.economicActivity);
    await this.ui.typeNumber(locators.seniority, opts.seniority);
  }

  async fillLegalRep(opts: {
    name: string;
    idType: string;
    id: string;
    email: string;
    phone: string;
  }) {
    await this.el.type(locators.legalRepName, opts.name);
    await this.ui.selectDropdown(locators.legalRepIdentificationTypeId, opts.idType);
    await this.el.type(locators.legalRepId, opts.id);
    await this.el.type(locators.legalRepEmail, opts.email);
    await this.ui.typePhone(locators.legalRepPhone, opts.phone);
  }

  async fillContact(opts: {
    email: string;
    phone: string;
    address: string;
  }) {
    await this.el.type(locators.email, opts.email);
    await this.ui.typePhone(locators.phone, opts.phone);
    await this.el.type(locators.address, opts.address);
    await this.ui.selectFirstLocation();
  }

  async fillReference1(opts: {
    name: string;
    contact: string;
    phone: string;
  }) {
    await this.el.type(locators.ref1Name, opts.name);
    await this.el.type(locators.ref1Contact, opts.contact);
    await this.ui.typePhone(locators.ref1Phone, opts.phone);
  }

  async fillObservations(text: string) {
    await this.el.type(locators.observations, text);
  }

  // -----------------------------------------------------------------------
  // Flows
  // -----------------------------------------------------------------------

  async createNaturalCustomer(customer: CustomerNatural) {
    await this.fillGeneralInfo({
      personType: 'Natural',
      idType: 'Cédula',
      businessName: customer.businessName,
      identificationNumber: customer.identificationNumber,
      economicActivity: 'Comercio',
      seniority: customer.seniority,
    });

    await this.fillContact({
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
    });

    await this.fillReference1({
      name: customer.commercialRef1Name,
      contact: customer.commercialRef1Contact,
      phone: customer.commercialRef1Phone,
    });

    await this.fillObservations(customer.observations);
    await this.save();

    await this.notifications.expectSuccess(messages.createdOk);
    await this.el.waitForUrl(/\/detalle-cliente\/\d+/);
  }

  async createJuridicaCustomer(customer: CustomerJuridica) {
    await this.fillGeneralInfo({
      personType: 'Jurídica',
      idType: 'NIT',
      businessName: customer.businessName,
      identificationNumber: customer.identificationNumber,
      economicActivity: 'Comercio',
      seniority: customer.seniority,
    });

    await this.fillLegalRep({
      name: customer.legalRepName,
      idType: 'Cédula',
      id: customer.legalRepId,
      email: customer.legalRepEmail,
      phone: customer.legalRepPhone,
    });

    await this.fillContact({
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
    });

    await this.fillObservations(customer.observations);
    await this.save();

    await this.notifications.expectSuccess(messages.createdOk);
    await this.el.waitForUrl(/\/detalle-cliente\/\d+/);
  }

  async createMinimalCustomer(name: string) {
    await this.fillGeneralInfo({
      personType: 'Natural',
      idType: 'Cédula',
      businessName: name,
      identificationNumber: String(Math.floor(Math.random() * 9000000000) + 1000000000),
      economicActivity: 'Comercio',
      seniority: 1,
    });

    await this.fillContact({
      email: `e2e-${Date.now()}@test.com`,
      phone: '3001234567',
      address: 'Dirección test',
    });

    await this.save();
    await this.notifications.expectSuccess(messages.createdOk);
    await this.el.waitForUrl(/\/detalle-cliente\/\d+/);
  }
}
