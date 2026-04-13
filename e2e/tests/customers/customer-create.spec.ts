import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/auth/login.page';
import { CustomerDetailPage } from '../../pages/customers/customer-detail.page';
import { El } from '../../helpers/el';
import { Ui, Notifications } from '../../helpers/ui';
import customerData from '../../fixtures/customer.json';
import { CustomerFixture } from '../../fixtures/types';

const fixtures = customerData as CustomerFixture;

test.describe('Create Customer', () => {
  let loginPage: LoginPage;
  let detailPage: CustomerDetailPage;
  let el: El;
  let ui: Ui;
  let notifications: Notifications;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    detailPage = new CustomerDetailPage(page);
    el = new El(page);
    ui = new Ui(page);
    notifications = new Notifications(page);

    await loginPage.login();
    await detailPage.visit();
  });

  // -----------------------------------------------------------------------
  // UI & rendering
  // -----------------------------------------------------------------------

  test('should render the new customer form', async ({ page }) => {
    await el.textVisible(detailPage.locators.titleNew);
    await expect(page.locator(detailPage.locators.iconNew)).toBeVisible();
    await expect(el.button(detailPage.locators.saveButton)).toBeVisible();
    await expect(el.button(detailPage.locators.cancelButton)).toBeVisible();
  });

  test('should show all form sections', async () => {
    await el.textVisible(detailPage.locators.sectionGeneral);
    await el.textVisible(detailPage.locators.sectionContact);
    await el.textVisible(detailPage.locators.sectionReferences);
    await el.textVisible(detailPage.locators.sectionObservations);
  });

  test('should NOT show legal representative section initially', async () => {
    await el.textNotVisible(detailPage.locators.sectionLegalRep);
  });

  // -----------------------------------------------------------------------
  // Validations
  // -----------------------------------------------------------------------

  test('should show validation errors when saving empty form', async () => {
    await detailPage.save(true);
    await notifications.expectValidationError(detailPage.errors.required);
  });

  test('should validate email format in contact info', async () => {
    await el.type(detailPage.locators.email, 'not-an-email');
    await el.click(detailPage.locators.phone);
    await notifications.expectValidationError(detailPage.errors.invalidEmail);
  });

  test('should validate seniority minimum value of 0', async () => {
    await ui.typeNumber(detailPage.locators.seniority, -1);
    await el.click(detailPage.locators.email);
    await notifications.expectValidationError(detailPage.errors.minValue);
  });

  // -----------------------------------------------------------------------
  // Persona Jurídica — Legal Representative
  // -----------------------------------------------------------------------

  test('should show legal representative section when persona jurídica is selected', async () => {
    await ui.selectDropdown(detailPage.locators.personTypeId, 'Jurídica');
    await el.textVisible(detailPage.locators.sectionLegalRep);
  });

  test('should require legal rep fields when persona jurídica', async ({ page }) => {
    await ui.selectDropdown(detailPage.locators.personTypeId, 'Jurídica');
    await el.textVisible(detailPage.locators.sectionLegalRep);
    await detailPage.save(true);

    const errorEl = page.locator(`#${detailPage.locators.legalRepName}`)
      .locator('xpath=ancestor::div[contains(@class,"flex-col")]')
      .locator('small.text-red-500');
    await expect(errorEl).toBeVisible();
  });

  test('should hide legal representative section when switching back to persona natural', async () => {
    await ui.selectDropdown(detailPage.locators.personTypeId, 'Jurídica');
    await el.textVisible(detailPage.locators.sectionLegalRep);

    await ui.selectDropdown(detailPage.locators.personTypeId, 'Natural');
    await el.textNotVisible(detailPage.locators.sectionLegalRep);
  });

  test('should validate legal rep email format', async () => {
    await ui.selectDropdown(detailPage.locators.personTypeId, 'Jurídica');
    await el.type(detailPage.locators.legalRepEmail, 'not-valid-email');
    await el.click(detailPage.locators.legalRepName);
    await notifications.expectValidationError(detailPage.errors.invalidEmail);
  });

  // -----------------------------------------------------------------------
  // Contact info — Department/City cascade
  // -----------------------------------------------------------------------

  test('should load cities when department is selected', async ({ page }) => {
    await page.locator(detailPage.locators.stateControl).click();
    const overlay = page.locator('.p-select-overlay, p-select-overlay');
    await overlay.waitFor({ state: 'visible' });
    await overlay.locator('.p-select-option, .p-listbox-option, li').first().click();

    await page.waitForTimeout(1000);
    await expect(page.locator(detailPage.locators.cityControl)).not.toHaveAttribute('disabled');
  });

  // -----------------------------------------------------------------------
  // Cancel navigation
  // -----------------------------------------------------------------------

  test('should navigate back to list on cancel', async () => {
    await detailPage.cancel();
    await el.waitForUrl('/app/clientes');
  });

  test('should navigate back to list on back arrow click', async () => {
    await detailPage.goBack();
    await el.waitForUrl('/app/clientes');
  });

  // -----------------------------------------------------------------------
  // Happy paths
  // -----------------------------------------------------------------------

  test('should create a persona natural customer successfully', async () => {
    await detailPage.createNaturalCustomer(fixtures.natural);
    await el.textVisible(detailPage.locators.titleEdit);
  });

  test('should create a persona jurídica customer successfully', async () => {
    await detailPage.createJuridicaCustomer(fixtures.juridica);
  });
});
