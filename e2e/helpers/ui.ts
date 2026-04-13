import { Page, expect } from '@playwright/test';

/**
 * PrimeNG / form interaction helper.
 * All ID-based methods receive the raw ID (without #).
 */
export class Ui {
  constructor(private page: Page) {}

  /** Select an option from a PrimeNG p-select dropdown by formControlName */
  async selectDropdown(formControlName: string, optionLabel: string) {
    await this.page.locator(`p-select[formcontrolname="${formControlName}"]`).click();
    const overlay = this.page.locator('p-select-overlay, .p-select-overlay, .p-listbox');
    await overlay.waitFor({ state: 'visible' });
    await overlay.getByText(optionLabel, { exact: false }).click();
  }

  /** Type into a PrimeNG password field (handles inner input wrapper) */
  async typePassword(id: string, value: string) {
    const input = this.page.locator(`#${id} input, #${id}`).first();
    await input.waitFor({ state: 'visible' });
    await input.fill(value);
  }

  /** Type into a phone-input component by inputId */
  async typePhone(inputId: string, value: string) {
    const input = this.page.locator(`#${inputId}`);
    await input.waitFor({ state: 'visible' });
    await input.clear();
    await input.fill(value);
  }

  /** Type into a PrimeNG InputNumber by formControlName */
  async typeNumber(formControlName: string, value: number) {
    const input = this.page
      .locator(`#${formControlName} input, p-inputnumber[formcontrolname="${formControlName}"] input`)
      .first();
    await input.clear();
    await input.fill(String(value));
  }

  /** Select first available department then first available city */
  async selectFirstLocation() {
    await this.page.locator('app-state-control p-select').click();
    const stateOverlay = this.page.locator('.p-select-overlay, p-select-overlay');
    await stateOverlay.waitFor({ state: 'visible' });
    await stateOverlay.locator('.p-select-option, .p-listbox-option, li').first().click();

    await this.page.waitForTimeout(1000);

    await this.page.locator('app-city-control p-select').click();
    const cityOverlay = this.page.locator('.p-select-overlay, p-select-overlay');
    await cityOverlay.waitFor({ state: 'visible' });
    await cityOverlay.locator('.p-select-option, .p-listbox-option, li').first().click();
  }
}

/**
 * Notification / toast assertion helpers.
 */
export class Notifications {
  constructor(private page: Page) {}

  /** Assert a PrimeNG toast with specific text appeared */
  async expectSuccess(text: string) {
    const toast = this.page.locator('p-toast .p-toast-message, .p-toast-message');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText(text);
  }

  /** Assert a validation error message is visible */
  async expectValidationError(text: string) {
    await expect(this.page.locator('small.text-red-500').getByText(text)).toBeVisible();
  }

  /** Assert a PrimeNG p-message severity=error is visible */
  async expectErrorMessage() {
    await expect(this.page.locator('p-message[severity="error"]')).toBeVisible();
  }
}
