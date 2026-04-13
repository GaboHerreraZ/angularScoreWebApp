import { Page } from '@playwright/test';
import { El } from '../../helpers/el';
import { Ui, Notifications } from '../../helpers/ui';
import { TestUser } from '../../fixtures/types';
import testUser from '../../fixtures/test-user.json';

const locators = {
  email: 'email',
  password: 'password',
  submitButton: 'Iniciar sesión',
  googleButton: 'Continuar con Google',
  registerLink: 'Regístrate',
} as const;

const errors = {
  invalidEmail: 'Ingresa un correo electrónico válido.',
  passwordMinLength: 'La contraseña debe tener al menos 6 caracteres.',
  wrongCredentials: 'Correo o contraseña incorrectos.',
  googleError: 'Error al iniciar sesión con Google. Intenta de nuevo.',
} as const;

export class LoginPage {
  readonly locators = locators;
  readonly errors = errors;

  private el: El;
  private ui: Ui;

  constructor(private page: Page) {
    this.el = new El(page);
    this.ui = new Ui(page);
  }

  async visit() {
    await this.page.goto('/auth/iniciar-sesion');
  }

  async fillEmail(value: string) {
    await this.el.type(locators.email, value);
  }

  async fillPassword(value: string) {
    await this.ui.typePassword(locators.password, value);
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

  async goToRegister() {
    await this.el.link(locators.registerLink).click();
  }

  // -----------------------------------------------------------------------
  // Flows
  // -----------------------------------------------------------------------

  /** Login with explicit credentials via UI */
  async loginWithCredentials(email: string, password: string) {
    await this.visit();
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();
    await this.el.waitForUrl('/app', 15000);
  }

  /** Login with fixture test user via UI */
  async login() {
    const user = testUser as TestUser;
    await this.loginWithCredentials(user.email, user.password);
  }
}
