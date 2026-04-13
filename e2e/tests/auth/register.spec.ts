import { test, expect } from '@playwright/test';
import { RegisterPage } from '../../pages/auth/register.page';
import { El } from '../../helpers/el';

test.describe('Register', () => {
  let registerPage: RegisterPage;
  let el: El;

  test.beforeEach(async ({ page }) => {
    registerPage = new RegisterPage(page);
    el = new El(page);
    await registerPage.visit();
  });

  // -----------------------------------------------------------------------
  // UI & rendering
  // -----------------------------------------------------------------------

  test('should render the register form correctly', async () => {
    await el.shouldBeVisible(registerPage.locators.email);
    await el.shouldBeVisible(registerPage.locators.password);
    await el.shouldBeVisible(registerPage.locators.confirmPassword);
    await expect(el.button(registerPage.locators.submitButton)).toBeVisible();
    await el.textVisible('¿Ya tienes cuenta?');
    await expect(el.link(registerPage.locators.loginLink)).toHaveAttribute('href', /\/auth\/iniciar-sesion/);
  });

  test('should have the submit button disabled when form is empty', async () => {
    await expect(el.button(registerPage.locators.submitButton)).toBeDisabled();
  });

  // -----------------------------------------------------------------------
  // Validations
  // -----------------------------------------------------------------------

  test('should show email validation error for invalid email', async () => {
    await registerPage.fillEmail('not-valid');
    await registerPage.blur(registerPage.locators.password);
    await el.textVisible(registerPage.errors.invalidEmail);
  });

  test('should show password minlength error', async () => {
    await registerPage.fillPassword('123');
    await registerPage.blur(registerPage.locators.email);
    await el.textVisible(registerPage.errors.passwordMinLength);
  });

  test('should show password mismatch error', async () => {
    await registerPage.fillPassword('password123');
    await registerPage.fillConfirmPassword('different456');
    await registerPage.blur(registerPage.locators.email);
    await el.textVisible(registerPage.errors.passwordMismatch);
  });

  test('should keep submit button disabled with mismatched passwords', async () => {
    await registerPage.fillForm('test@test.com', 'password123', 'different456');
    await expect(el.button(registerPage.locators.submitButton)).toBeDisabled();
  });

  test('should enable submit button when all validations pass', async () => {
    await registerPage.fillForm('valid@test.com', 'password123', 'password123');
    await expect(el.button(registerPage.locators.submitButton)).toBeEnabled();
  });

  // -----------------------------------------------------------------------
  // Registration with already registered email
  // -----------------------------------------------------------------------

  test('should show error when registering with already registered email', async () => {
    await registerPage.registerWithExistingUser();
    await el.waitFor(registerPage.locators.errorMessage);
  });

  // -----------------------------------------------------------------------
  // Navigation
  // -----------------------------------------------------------------------

  test('should navigate to login page', async () => {
    await registerPage.goToLogin();
    await el.waitForUrl('/auth/iniciar-sesion');
  });

  // -----------------------------------------------------------------------
  // Invitation flow
  // -----------------------------------------------------------------------

  test('should pre-fill and disable email when invitation params are present', async () => {
    const invitationEmail = 'invited@company.com';
    await registerPage.visitWithInvitation('123', invitationEmail, 'abc');

    await el.shouldHaveValue(registerPage.locators.email, invitationEmail);
    await el.shouldBeDisabled(registerPage.locators.email);
  });
});
