import { test, expect } from '@playwright/test';

const gamePages = [
  { path: '/alfaquest.html', heading: 'Alfaquest Classic' },
  { path: '/alfafilleasy.html', heading: 'Alfaquest Easy' },
  { path: '/alfafillnormal.html', heading: 'Alfaquest Fill' },
  { path: '/alfafillhard.html', heading: 'Alfaquest Strict' },
];

for (const { path, heading } of gamePages) {
  test.describe(`${path}`, () => {
    test('loads with core game UI', async ({ page }) => {
      const pageErrors: string[] = [];
      page.on('pageerror', (err) => pageErrors.push(err.message));

      await page.goto(path);
      await expect(page.locator('h1')).toHaveText(heading);
      await expect(page.locator('#countryInput')).toBeVisible();
      await expect(page.locator('#submitCountry')).toBeVisible();
      await expect(page.locator('#letterGrid')).toBeVisible();
      await expect(page.locator('#resetLocal')).toBeVisible();
      expect(pageErrors).toEqual([]);
    });

    test('loads game engine script', async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('script[src="allletters-game.js"]')).toHaveCount(1);
    });

    test('mobile layout avoids horizontal overflow', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(path);

      const hasOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
      );
      expect(hasOverflow).toBe(false);

      const sidebar = page.locator('.game-sidebar');
      await expect(sidebar).toBeVisible();
      const sidebarWidth = await sidebar.evaluate((el) => el.getBoundingClientRect().width);
      const viewportWidth = page.viewportSize()?.width ?? 390;
      expect(sidebarWidth).toBeGreaterThan(viewportWidth * 0.85);
    });

    test('phone tier uses six-column letter grid', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(path);

      const columnCount = await page.locator('.letter-grid').evaluate((el) => {
        return getComputedStyle(el).gridTemplateColumns.split(' ').filter(Boolean).length;
      });
      expect(columnCount).toBe(6);
    });
  });
}
