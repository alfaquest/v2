import { test, expect } from '@playwright/test';

const gamePages = [
  { path: '/alfaquest.html', heading: 'Alfaquest - Play' },
  { path: '/alfafilleasy.html', heading: 'Alfafill - Easy mode' },
  { path: '/alfafillnormal.html', heading: 'Alfafill - Normal mode' },
  { path: '/alfafillhard.html', heading: 'Alfafill - Hard mode' },
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
  });
}
