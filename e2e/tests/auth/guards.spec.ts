import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/auth/login.page';
import { El } from '../../helpers/el';

test.describe('Auth Guards', () => {
  let loginPage: LoginPage;
  let el: El;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    el = new El(page);
  });

  test.describe('authGuard', () => {
    test('should redirect unauthenticated user to login', async ({ page }) => {
      await page.goto('/app');
      await el.waitForUrl('/auth/iniciar-sesion');
    });

    test('should preserve returnUrl when redirecting to login', async ({ page }) => {
      await page.goto('/app/clientes');
      await el.waitForUrl('/auth/iniciar-sesion');
      expect(page.url()).toContain('returnUrl');
    });

    test('should allow authenticated user to access /app', async ({ page }) => {
      await loginPage.login();
      await page.goto('/app');
      await el.waitForUrl('/app');
    });
  });

  test.describe('noAuthGuard', () => {
    test('should redirect authenticated user away from login', async ({ page }) => {
      await loginPage.login();
      await page.goto('/auth/iniciar-sesion');
      await el.waitForUrl('/app');
    });

    test('should allow unauthenticated user to access login', async ({ page }) => {
      await page.goto('/auth/iniciar-sesion');
      await el.waitForUrl('/auth/iniciar-sesion');
    });
  });

  test.describe('Error pages', () => {
    test('should show 404 page for unknown routes', async ({ page }) => {
      await page.goto('/ruta-que-no-existe');
      await el.textVisible('PÁGINA NO ENCONTRADA');
    });

    test('should show service unavailable page', async ({ page }) => {
      await page.goto('/servicio-no-disponible');
      await el.textVisible('Servicio No Disponible');
      await expect(el.button('Reintentar')).toBeVisible();
    });
  });

  test.describe('Session', () => {
    test('should not show protected content after logout', async ({ page }) => {
      await loginPage.login();
      await page.goto('/app');
      await el.waitForUrl('/app');

      // Clear session
      await page.evaluate(() => {
        Object.keys(localStorage)
          .filter((key) => key.startsWith('sb-'))
          .forEach((key) => localStorage.removeItem(key));
      });

      await page.goto('/app');
      await el.waitForUrl('/auth/iniciar-sesion');
    });
  });
});
