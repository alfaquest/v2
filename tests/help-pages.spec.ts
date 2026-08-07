import { test, expect } from '@playwright/test';

test.describe('Help pages', () => {
  test('helpv2 loads without JavaScript errors', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/helpv2.html');
    await expect(page.getByRole('heading', { name: /sequencing tutorial/i })).toBeVisible();
    await expect(page.locator('.game-back')).toHaveAttribute('href', 'index.html');
    await expect(page.getByRole('link', { name: /Practise in Alfaquest Fill/i })).toHaveAttribute('href', 'alfafillnormal.html');
    await expect(page.getByRole('link', { name: /Play Alfaquest Classic/i })).toHaveAttribute('href', 'alfaquest.html');
    expect(pageErrors).toEqual([]);
  });

  test('helpv2 documents Malta dead-end example', async ({ page }) => {
    await page.goto('/helpv2.html');
    await expect(page.locator('body')).toContainText(/Malta/i);
    await expect(page.locator('body')).toContainText(/Malaysia/i);
  });

  test('helpv2 mobile layout avoids horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/helpv2.html');

    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    );
    expect(hasOverflow).toBe(false);
  });

  test('legacy help.html redirects to helpv2', async ({ page }) => {
    await page.goto('/help.html');
    await page.waitForURL(/\/helpv2\/?$/);
    await expect(page.getByRole('heading', { name: /sequencing tutorial/i })).toBeVisible();
  });
});
