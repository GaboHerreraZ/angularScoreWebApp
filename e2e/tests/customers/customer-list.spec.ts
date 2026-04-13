import { test, expect } from '@playwright/test';
import { CustomerListPage } from '../../pages/customers/customer-list.page';
import { El } from '../../helpers/el';

test.describe('Customer List', () => {
  let listPage: CustomerListPage;
  let el: El;

  test.beforeEach(async ({ page }) => {
    listPage = new CustomerListPage(page);
    el = new El(page);
    await listPage.navigateAuthenticated();
  });

  test('should render the customers table', async ({ page }) => {
    await el.textVisible(listPage.locators.title);
    await expect(page.locator(listPage.locators.table)).toBeVisible();
  });

  test('should display the correct table columns', async () => {
    await listPage.assertColumnHeaders();
  });

  test('should display the "Agregar Cliente" button', async () => {
    await expect(el.button(listPage.locators.addButton)).toBeVisible();
  });

  test('should filter results when searching', async ({ page }) => {
    await listPage.search('test');
    await expect(page.locator(listPage.locators.table)).toBeVisible();
  });

  test('should clear search with "Limpiar" button', async ({ page }) => {
    await listPage.search('test');
    await listPage.clearSearch();
    await expect(page.locator(listPage.locators.searchInput)).toHaveValue('');
  });

  test('should navigate to new customer form on "Agregar Cliente"', async () => {
    await listPage.clickAdd();
    await el.waitForUrl('/app/clientes/detalle-cliente');
    await el.textVisible('Nuevo Cliente');
  });

  test('should navigate to edit customer on edit action click', async () => {
    await listPage.waitForTableData();
    await listPage.clickEditOnRow(0);
    await el.waitForUrl(/\/app\/clientes\/detalle-cliente\/\d+/);
    await el.textVisible('Editar Cliente');
  });

  test('should show pagination when there are more than 10 records', async ({ page }) => {
    await expect(page.locator(listPage.locators.table)).toBeVisible();
    await expect(page.locator(listPage.locators.paginator)).toBeVisible();
  });
});
