import { test, expect } from '@playwright/test';

async function openAlfafillPage(page: import('@playwright/test').Page, path: string) {
  await page.goto(path);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
}

test.describe('Alfafill Easy', () => {
  test('accepts countries in any order and collects letters', async ({ page }) => {
    await openAlfafillPage(page, '/alfafilleasy.html');
    await page.locator('#countryInput').fill('Qatar');
    await page.locator('#submitCountry').click();

    await expect(page.locator('#submittedList')).toContainText('Qatar');
    await expect(page.locator('#letterGrid .letter-cell.used')).toHaveCount(4);
    await expect(page.locator('#letterGrid .letter-cell.available')).toHaveCount(22);
    await expect(page.locator('#colourLegend')).toBeVisible();
  });
});

test.describe('Alfafill Normal', () => {
  test('enforces Alfaquest-style sequencing from A', async ({ page }) => {
    await openAlfafillPage(page, '/alfafillnormal.html');
    await page.locator('#countryInput').fill('Albania');
    await page.locator('#submitCountry').click();

    await expect(page.locator('#submittedList')).toContainText('Albania');
    await expect(page.locator('#requiredLetterInfo')).toContainText('L');
  });

  test('explains required start when letter already collected inside earlier countries', async ({ page }) => {
    await openAlfafillPage(page, '/alfafillnormal.html');
    for (const country of ['Argentina', 'Romania']) {
      await page.locator('#countryInput').fill(country);
      await page.locator('#submitCountry').click();
    }

    await expect(page.locator('#requiredLetterInfo')).toContainText('O');
    await expect(page.locator('#requiredLetterInfo')).toContainText(/already on your grid/i);
    await expect(page.locator('#requiredLetterInfo')).toContainText(/starting letter/i);
    await expect(page.locator('#letterGrid .letter-cell.required-start-collected')).toHaveText('O');
  });

  test('Argentina Romania Oman loss explains no new letters instead of next required M', async ({ page }) => {
    await openAlfafillPage(page, '/alfafillnormal.html');
    for (const country of ['Argentina', 'Romania', 'Oman']) {
      await page.locator('#countryInput').fill(country);
      await page.locator('#submitCountry').click();
    }

    await expect(page.locator('#gameOverSummary')).toBeVisible();
    await expect(page.locator('#gameOverSummary')).toContainText(/does not add any new letters/i);
    await expect(page.locator('#gameOverSummary')).toContainText(/Oman/i);
    await expect(page.locator('#requiredLetterInfo')).toBeEmpty();
    await expect(page.locator('#submitCountry')).toBeDisabled();
  });

  test('shows game over summary when submission adds no new letters', async ({ page }) => {
    await openAlfafillPage(page, '/alfafillnormal.html');
    for (const country of ['Albania', 'Latvia', 'Tonga', 'Oman', 'Malta']) {
      await page.locator('#countryInput').fill(country);
      await page.locator('#submitCountry').click();
    }

    await expect(page.locator('#gameOverSummary')).toBeVisible();
    await expect(page.locator('#gameOverSummary')).toContainText(/does not add any new letters/i);
    await expect(page.locator('#gameOverSummary')).toContainText(/Malta/i);
    await expect(page.locator('#submitCountry')).toBeDisabled();
  });
});

test.describe('Alfafill Hard', () => {
  test('requires starting letter A on first submission', async ({ page }) => {
    await openAlfafillPage(page, '/alfafillhard.html');
    await page.locator('#countryInput').fill('Germany');
    await page.locator('#submitCountry').click();

    await expect(page.locator('#alfa-toast')).toContainText(/invalid start letter/i);
  });
});
