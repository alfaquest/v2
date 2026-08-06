import { test, expect } from '@playwright/test';

test.describe('Alfaquest gameplay', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/alfaquest.html');
  });

  test('first valid answer advances required letter from A to L', async ({ page }) => {
    await page.locator('#countryInput').fill('Albania');
    await page.locator('#submitCountry').click();

    await expect(page.locator('#submittedList')).toContainText('Albania');
    await expect(page.locator('#sessionInfo')).toContainText('Required: L');
  });

  test('rejects invalid country spelling', async ({ page }) => {
    await page.locator('#countryInput').fill('Not A Real Country');
    await page.locator('#submitCountry').click();

    await expect(page.locator('#alfa-toast')).toContainText(/not in list|misspelled/i);
    await expect(page.locator('#submittedList')).toHaveText('');
  });

  test('rejects wrong starting letter on first turn', async ({ page }) => {
    await page.locator('#countryInput').fill('Latvia');
    await page.locator('#submitCountry').click();

    await expect(page.locator('#alfa-toast')).toContainText(/invalid start letter/i);
    await expect(page.locator('#submittedList')).toHaveText('');
  });

  test('reset clears submitted answers', async ({ page }) => {
    await page.locator('#countryInput').fill('Albania');
    await page.locator('#submitCountry').click();
    await expect(page.locator('#submittedList')).toContainText('Albania');

    await page.locator('#resetLocal').click();
    await page.locator('#alfa-toast').click();
    await expect(page.locator('#submittedList')).toHaveText('');
    await expect(page.locator('#sessionInfo')).toContainText('Required: A');
  });
});
