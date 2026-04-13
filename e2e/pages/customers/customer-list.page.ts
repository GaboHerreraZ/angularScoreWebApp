import { Page, expect } from '@playwright/test';
import { El } from '../../helpers/el';
import { LoginPage } from '../auth/login.page';

const locators = {
  title: 'Gestión de Clientes',
  table: 'p-table',
  tableRows: 'p-table tbody tr',
  searchInput: 'input[placeholder*="Buscar"]',
  clearButton: 'Limpiar',
  addButton: 'Agregar Cliente',
  editIcon: 'button .pi-pencil',
  deleteIcon: 'button .pi-trash',
  paginator: 'p-paginator, .p-paginator',
  columns: ['Razón Social', 'Identificación', 'Teléfono', 'Email', 'Ciudad'],
} as const;

export class CustomerListPage {
  readonly locators = locators;

  private el: El;
  private loginPage: LoginPage;

  constructor(private page: Page) {
    this.el = new El(page);
    this.loginPage = new LoginPage(page);
  }

  async visit() {
    await this.page.goto('/app/clientes');
  }

  async waitForTableData(timeout = 10000) {
    await this.page.locator(locators.tableRows).first().waitFor({ state: 'visible', timeout });
  }

  async search(query: string) {
    const input = this.page.locator(locators.searchInput);
    await input.clear();
    await input.fill(query);
  }

  async clearSearch() {
    await this.el.button(locators.clearButton).click();
  }

  async clickAdd() {
    await this.el.button(locators.addButton).click();
  }

  async clickEditOnRow(index = 0) {
    await this.page.locator(locators.tableRows).nth(index).locator(locators.editIcon).first().click();
  }

  async clickDeleteOnRow(index = 0) {
    await this.page.locator(locators.tableRows).nth(index).locator(locators.deleteIcon).first().click();
  }

  async assertColumnHeaders() {
    for (const col of locators.columns) {
      await expect(this.page.locator('p-table th').getByText(col)).toBeVisible();
    }
  }

  async tableContains(text: string) {
    await expect(this.page.locator('p-table tbody')).toContainText(text);
  }

  async tableNotContains(text: string) {
    await expect(this.page.locator('p-table tbody')).not.toContainText(text);
  }

  // -----------------------------------------------------------------------
  // Flows
  // -----------------------------------------------------------------------

  /** Login via UI + navigate to customer list */
  async navigateAuthenticated() {
    await this.loginPage.login();
    await this.visit();
  }

  /** Login + list + open first customer in edit mode */
  async openFirstCustomerForEdit() {
    await this.navigateAuthenticated();
    await this.waitForTableData();
    await this.clickEditOnRow(0);
    await this.page.locator('.pi-user-edit').waitFor({ state: 'visible' });
  }
}
