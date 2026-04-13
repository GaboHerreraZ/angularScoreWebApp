import { Page } from '@playwright/test';
import { El } from '../../helpers/el';
import { Ui } from '../../helpers/ui';
import { TestUser } from '../../fixtures/types';
import testUser from '../../fixtures/test-user.json';

const locators = {
  email: 'email',
  password: 'password',
  confirmPassword: 'confirmPassword',
  submitButton: 'Crear cuenta',
  loginLink: 'Inicia sesión',
  errorMessage: 'p-message[severity="error"]',
  successMessage: 'p-message[severity="success"]',
} as const;

const errors = {
  invalidEmail: 'Ingresa un correo electrónico válido.',
  passwordMinLength: 'La contraseña debe tener al menos 6 caracteres.',
  passwordMismatch: 'Las contraseñas no coinciden.',
  alreadyRegistered: 'Este correo electrónico ya está registrado.',
} as const;

export class RegisterPage {
  readonly locators = locators;
  readonly errors = errors;

  private el: El;
  private ui: Ui;

  constructor(private page: Page) {
    this.el = new El(page);
    this.ui = new Ui(page);
  }

  async visit() {
    await this.page.goto('/auth/registro');
  }

  async visitWithInvitation(invitationId: string, email: string, token: string) {
    await this.page.goto(`/auth/registro?invitation=${invitationId}&email=${email}&token=${token}`);
  }

  async fillEmail(value: string) {
    await this.el.type(locators.email, value);
  }

  async fillPassword(value: string) {
    await this.ui.typePassword(locators.password, value);
  }

  async fillConfirmPassword(value: string) {
    await this.ui.typePassword(locators.confirmPassword, value);
  }

  async blur(fieldId: string) {
    await this.el.click(fieldId);
  }

  async submit() {
    await this.el.button(locators.submitButton).click();
  }

  async submitShouldBeDisabled() {
    await this.el.button(locators.submitButton).isDisabled();
  }

  async goToLogin() {
    await this.el.link(locators.loginLink).click();
  }

  // -----------------------------------------------------------------------
  // Flows
  // -----------------------------------------------------------------------

  async fillForm(email: string, password: string, confirmPassword: string) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.fillConfirmPassword(confirmPassword);
  }

  async registerWithExistingUser() {
    const user = testUser as TestUser;
    await this.fillForm(user.email, user.password, user.password);
    await this.submit();
  }
}
