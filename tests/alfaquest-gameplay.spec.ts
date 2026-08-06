import { test, expect } from '@playwright/test';

async function submitCountries(page: import('@playwright/test').Page, countries: string[]) {
  for (const country of countries) {
    await page.locator('#countryInput').fill(country);
    await page.locator('#submitCountry').click();
  }
}

test.describe('Alfaquest gameplay', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/alfaquest.html');
  });

  test('first valid answer advances required letter from A to L', async ({ page }) => {
    await page.locator('#countryInput').fill('Albania');
    await page.locator('#submitCountry').click();

    await expect(page.locator('#submittedList')).toContainText('Albania');
    await expect(page.locator('#requiredLetterInfo')).toContainText('L');
    await expect(page.locator('#letterGrid .letter-cell.start-used')).toHaveCount(1);
    await expect(page.locator('#letterGrid .letter-cell.next-required')).toHaveCount(1);
    await expect(page.locator('#colourLegend')).toBeVisible();
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
    await expect(page.locator('#requiredLetterInfo')).toContainText('A');
  });

  test('game over after documented five-move dead-end sequence', async ({ page }) => {
    await submitCountries(page, ['Albania', 'Latvia', 'Tonga', 'Oman', 'Malta']);

    await expect(page.locator('#submittedList')).toContainText('Malta');
    await expect(page.locator('#alfa-toast')).toContainText(/game over|GAME OVER/i);
    await expect(page.locator('#submitCountry')).toBeDisabled();
    await expect(page.locator('#countryInput')).toBeDisabled();
    await expect(page.locator('#remainingLetters')).not.toHaveText('0');
  });

  test('continues after round five when Malaysia avoids the Malta dead-end', async ({ page }) => {
    await submitCountries(page, ['Albania', 'Latvia', 'Tonga', 'Oman', 'Malaysia']);

    await expect(page.locator('#submittedList')).toContainText('Malaysia');
    await expect(page.locator('#requiredLetterInfo')).toContainText('Y');
    await expect(page.locator('#submitCountry')).toBeEnabled();
    await expect(page.locator('#remainingLetters')).toHaveText('19');
  });
});
