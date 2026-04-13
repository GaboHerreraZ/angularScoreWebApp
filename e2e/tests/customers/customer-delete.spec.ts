import { test } from '@playwright/test';
import { LoginPage } from '../../pages/auth/login.page';
import { CustomerListPage } from '../../pages/customers/customer-list.page';
import { CustomerDetailPage } from '../../pages/customers/customer-detail.page';

test.describe('Delete Customer', () => {
  let createdCustomerName: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    const loginPage = new LoginPage(page);
    const detailPage = new CustomerDetailPage(page);

    await loginPage.login();
    await detailPage.visit();

    createdCustomerName = `E2E Delete Test ${Date.now()}`;
    await detailPage.createMinimalCustomer(createdCustomerName);

    await page.close();
  });

  test('should delete the created customer from the list', async ({ page }) => {
    const listPage = new CustomerListPage(page);
    const loginPage = new LoginPage(page);

    await loginPage.login();
    await listPage.visit();
    await listPage.search(createdCustomerName);
    await listPage.waitForTableData();
    await listPage.tableContains(createdCustomerName);

    await listPage.clickDeleteOnRow(0);

    await page.waitForTimeout(2000);
    await listPage.tableNotContains(createdCustomerName);
  });
});
