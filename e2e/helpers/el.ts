import { Page, expect } from '@playwright/test';

/**
 * Element interaction helper.
 * All ID-based methods receive the raw ID (without #).
 */
export class El {
  constructor(private page: Page) {}

  // -------------------------------------------------------------------------
  // Finders
  // -------------------------------------------------------------------------

  /** Get element by ID */
  byId(id: string) {
    return this.page.locator(`#${id}`);
  }

  /** Get element by CSS class */
  byClass(className: string) {
    return this.page.locator(`.${className}`);
  }

  /** Get element by data-cy attribute */
  byCy(selector: string) {
    return this.page.locator(`[data-cy="${selector}"]`);
  }

  /** Get element by formControlName */
  byFormControl(name: string) {
    return this.page.locator(`[formcontrolname="${name}"]`);
  }

  /** Get a button by its label text */
  button(label: string) {
    return this.page.getByRole('button', { name: label });
  }

  /** Get a link by its text */
  link(text: string) {
    return this.page.getByRole('link', { name: text });
  }

  // -------------------------------------------------------------------------
  // Input helpers
  // -------------------------------------------------------------------------

  /** Clear and type a value into an input by ID */
  async type(id: string, value: string) {
    const input = this.byId(id);
    await input.waitFor({ state: 'visible' });
    await input.clear();
    await input.fill(value);
  }

  /** Type without clearing first */
  async typeAppend(id: string, value: string) {
    const input = this.byId(id);
    await input.waitFor({ state: 'visible' });
    await input.fill(value);
  }

  /** Clear an input by ID */
  async clear(id: string) {
    await this.byId(id).clear();
  }

  /** Click on an element by ID */
  async click(id: string) {
    await this.byId(id).click();
  }

  /** Get the current value of an input by ID */
  async getValue(id: string): Promise<string> {
    return await this.byId(id).inputValue();
  }

  // -------------------------------------------------------------------------
  // Assertions
  // -------------------------------------------------------------------------

  /** Assert element by ID is visible */
  async shouldBeVisible(id: string) {
    await expect(this.byId(id)).toBeVisible();
  }

  /** Assert element by ID has a specific value */
  async shouldHaveValue(id: string, value: string) {
    await expect(this.byId(id)).toHaveValue(value);
  }

  /** Assert element by ID is NOT empty */
  async shouldNotBeEmpty(id: string) {
    const val = await this.byId(id).inputValue();
    expect(val).not.toBe('');
  }

  /** Assert element by ID is disabled */
  async shouldBeDisabled(id: string) {
    await expect(this.byId(id)).toBeDisabled();
  }

  /** Assert text is visible anywhere on the page */
  async textVisible(text: string) {
    await expect(this.page.getByText(text).first()).toBeVisible();
  }

  /** Assert text does NOT exist on the page */
  async textNotVisible(text: string) {
    await expect(this.page.getByText(text)).toBeHidden();
  }

  // -------------------------------------------------------------------------
  // Wait helpers
  // -------------------------------------------------------------------------

  /** Wait for a selector to be visible */
  async waitFor(selector: string, timeout = 10000) {
    await this.page.locator(selector).waitFor({ state: 'visible', timeout });
  }

  /** Wait for URL to include a string */
  async waitForUrl(pattern: string | RegExp, timeout = 10000) {
    if (typeof pattern === 'string') {
      await this.page.waitForURL(`**${pattern}**`, { timeout });
    } else {
      await this.page.waitForURL(pattern, { timeout });
    }
  }
}
