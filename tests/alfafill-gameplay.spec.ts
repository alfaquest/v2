import { test, expect } from '@playwright/test';

test.describe('Alfafill Easy', () => {
  test('accepts countries in any order and collects letters', async ({ page }) => {
    await page.goto('/alfafilleasy.html');
    await page.locator('#countryInput').fill('Qatar');
    await page.locator('#submitCountry').click();

    await expect(page.locator('#submittedList')).toContainText('Qatar');
    await expect(page.locator('#letterGrid .letter-cell.used')).toHaveCount(4);
    await expect(page.locator('#letterGrid .letter-cell.available')).toHaveCount(22);
    await expect(page.locator('#gridLegend')).toBeVisible();
  });
});

test.describe('Alfafill Normal', () => {
  test('enforces Alfaquest-style sequencing from A', async ({ page }) => {
    await page.goto('/alfafillnormal.html');
    await page.locator('#countryInput').fill('Albania');
    await page.locator('#submitCountry').click();

    await expect(page.locator('#submittedList')).toContainText('Albania');
    await expect(page.locator('#sessionInfo')).toContainText('Required: L');
  });
});

test.describe('Alfafill Hard', () => {
  test('requires starting letter A on first submission', async ({ page }) => {
    await page.goto('/alfafillhard.html');
    await page.locator('#countryInput').fill('Germany');
    await page.locator('#submitCountry').click();

    await expect(page.locator('#alfa-toast')).toContainText(/invalid start letter/i);
  });
});
