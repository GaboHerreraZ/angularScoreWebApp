import { test, expect } from '@playwright/test';
import { CustomerListPage } from '../../pages/customers/customer-list.page';
import { CustomerDetailPage } from '../../pages/customers/customer-detail.page';
import { El } from '../../helpers/el';
import { Notifications } from '../../helpers/ui';

test.describe('Edit Customer', () => {
  let listPage: CustomerListPage;
  let detailPage: CustomerDetailPage;
  let el: El;
  let notifications: Notifications;

  test.beforeEach(async ({ page }) => {
    listPage = new CustomerListPage(page);
    detailPage = new CustomerDetailPage(page);
    el = new El(page);
    notifications = new Notifications(page);

    await listPage.openFirstCustomerForEdit();
    await el.textVisible(detailPage.locators.titleEdit);
  });

  test('should render the edit form with customer data loaded', async ({ page }) => {
    await expect(page.locator(detailPage.locators.iconEdit)).toBeVisible();
    await el.textVisible(detailPage.locators.titleEdit);
    await expect(el.button(detailPage.locators.saveButton)).toBeVisible();
    await expect(el.button(detailPage.locators.cancelButton)).toBeVisible();

    await el.shouldNotBeEmpty(detailPage.locators.businessName);
    await el.shouldNotBeEmpty(detailPage.locators.identificationNumber);
  });

  test('should have "Guardar" button disabled when no changes are made', async () => {
    await expect(el.button(detailPage.locators.saveButton)).toBeDisabled();
  });

  test('should enable "Guardar" button after modifying a field', async () => {
    await el.type(detailPage.locators.businessName, 'Nombre Modificado E2E');
    await expect(el.button(detailPage.locators.saveButton)).toBeEnabled();
  });

  test('should save changes successfully', async () => {
    const originalVal = await el.getValue(detailPage.locators.businessName);

    await el.type(detailPage.locators.businessName, 'Editado E2E Test');
    await detailPage.save();
    await notifications.expectSuccess(detailPage.messages.updatedOk);

    // Restore original name
    await el.type(detailPage.locators.businessName, originalVal);
    await detailPage.save();
    await notifications.expectSuccess(detailPage.messages.updatedOk);
  });

  test('should show legal rep section if customer is persona jurídica', async ({ page }) => {
    const hasLegalRep = await page.getByText(detailPage.locators.sectionLegalRep).isVisible();
    if (hasLegalRep) {
      await el.shouldBeVisible(detailPage.locators.legalRepName);
      await el.shouldBeVisible(detailPage.locators.legalRepId);
      await el.shouldBeVisible(detailPage.locators.legalRepEmail);
    }
  });

  test('should load department and city from existing customer data', async ({ page }) => {
    await expect(page.locator(detailPage.locators.stateControl)).toBeVisible();
    await expect(page.locator(detailPage.locators.cityControl)).toBeVisible();
  });

  test('should navigate back to customer list on cancel', async () => {
    await detailPage.cancel();
    await el.waitForUrl('/app/clientes');
  });
});
