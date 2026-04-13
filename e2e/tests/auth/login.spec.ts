import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/auth/login.page';
import { El } from '../../helpers/el';
import { Notifications } from '../../helpers/ui';
import testUser from '../../fixtures/test-user.json';

test.describe('Login', () => {
  let loginPage: LoginPage;
  let el: El;
  let notifications: Notifications;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    el = new El(page);
    notifications = new Notifications(page);
    await loginPage.visit();
  });

  // -----------------------------------------------------------------------
  // UI & rendering
  // -----------------------------------------------------------------------

  test('should render the login form correctly', async () => {
    await el.shouldBeVisible(loginPage.locators.email);
    await el.shouldBeVisible(loginPage.locators.password);
    await expect(el.button(loginPage.locators.submitButton)).toBeVisible();
    await el.textVisible(loginPage.locators.googleButton);
    await el.textVisible('¿No tienes cuenta?');
    await expect(el.link(loginPage.locators.registerLink)).toHaveAttribute('href', /\/auth\/registro/);
  });

  test('should have the submit button disabled when form is empty', async () => {
    await expect(el.button(loginPage.locators.submitButton)).toBeDisabled();
  });

  // -----------------------------------------------------------------------
  // Validations
  // -----------------------------------------------------------------------

  test('should show email validation error for invalid email', async () => {
    await loginPage.fillEmail('not-an-email');
    await loginPage.blur(loginPage.locators.password);
    await el.textVisible(loginPage.errors.invalidEmail);
  });

  test('should show password minlength error', async () => {
    await loginPage.fillPassword('123');
    await loginPage.blur(loginPage.locators.email);
    await el.textVisible(loginPage.errors.passwordMinLength);
  });

  test('should keep submit button disabled with invalid form', async () => {
    await loginPage.fillEmail('bad-email');
    await loginPage.fillPassword('12345');
    await expect(el.button(loginPage.locators.submitButton)).toBeDisabled();
  });

  // -----------------------------------------------------------------------
  // Login failure
  // -----------------------------------------------------------------------

  test('should show error message with wrong credentials', async () => {
    await loginPage.fillEmail('wrong@email.com');
    await loginPage.fillPassword('wrongpassword');
    await loginPage.submit();

    await notifications.expectErrorMessage();
    await el.textVisible(loginPage.errors.wrongCredentials);
  });

  test('should show loading state while authenticating', async () => {
    await loginPage.fillEmail(testUser.email);
    await loginPage.fillPassword(testUser.password);
    await loginPage.submit();
    await expect(el.button(loginPage.locators.submitButton)).toBeDisabled();
  });

  // -----------------------------------------------------------------------
  // Successful login
  // -----------------------------------------------------------------------

  test('should redirect to /app on successful login', async () => {
    await loginPage.loginWithCredentials(testUser.email, testUser.password);
    await el.waitForUrl('/app', 15000);
  });

  // -----------------------------------------------------------------------
  // Navigation
  // -----------------------------------------------------------------------

  test('should navigate to register page', async () => {
    await loginPage.goToRegister();
    await el.waitForUrl('/auth/registro');
  });
});
