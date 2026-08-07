import { test, expect } from '@playwright/test';

async function openAlfafillPage(page: import('@playwright/test').Page, path: string) {
  await page.goto(path);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
}

test.describe('Alfaquest Easy', () => {
  test('accepts countries in any order and collects letters', async ({ page }) => {
    await openAlfafillPage(page, '/alfafilleasy.html');
    await page.locator('#countryInput').fill('Qatar');
    await page.locator('#submitCountry').click();

    await expect(page.locator('#submittedList')).toContainText('Qatar');
    await expect(page.locator('#letterGrid .letter-cell.used')).toHaveCount(4);
    await expect(page.locator('#letterGrid .letter-cell.available')).toHaveCount(22);
    await expect(page.locator('#colourLegend')).toBeVisible();
  });

  test('shows victory summary when alphabet is complete', async ({ page }) => {
    test.setTimeout(120_000);
    await openAlfafillPage(page, '/alfafilleasy.html');
    const winningSequence = [
      'Afghanistan',
      'Albania',
      'Algeria',
      'Andorra',
      'Antigua and Barbuda',
      'Armenia',
      'Azerbaijan',
      'Bolivia',
      'Botswana',
      'Burkina Faso',
      'Cambodia',
      'Cape Verde',
      'Cyprus',
      'Equatorial Guinea',
      'Luxembourg',
    ];
    for (const country of winningSequence) {
      await page.locator('#countryInput').fill(country);
      await page.locator('#submitCountry').click();
    }

    await expect(page.locator('#remainingLetters')).toHaveText('0');
    await expect(page.locator('#completionSummary')).toBeVisible();
    await expect(page.locator('#completionSummary')).toContainText(/Victory — alphabet complete/i);
    await expect(page.locator('#completionSummary')).toContainText(/Completed/i);
    await expect(page.locator('#completionSummary')).toContainText(/Legendary runs use 6 or fewer/i);
    await expect(page.locator('#completionSummary')).toContainText(/15 countries/i);
    await expect(page.locator('#alfa-toast')).toContainText(/Bravo!/i);
    await expect(page.locator('#submitCountry')).toBeDisabled();
    await expect(page.locator('#resetLocal')).toHaveClass(/reset-required/);
  });

  test('shows game over summary for unreachable letters', async ({ page }) => {
    await openAlfafillPage(page, '/alfafilleasy.html');
    await page.evaluate(() => {
      (window as unknown as { __ALFA_TEST__: { triggerEasyUnreachableGameOver: (letters: string[]) => void } }).__ALFA_TEST__
        .triggerEasyUnreachableGameOver(['j', 'q']);
    });

    await expect(page.locator('#gameOverSummary')).toBeVisible();
    await expect(page.locator('#gameOverSummary')).toContainText(/letters unreachable/i);
    await expect(page.locator('#gameOverSummary')).toContainText(/J, Q/);
    await expect(page.locator('#gameOverSummary .game-over-modes')).toContainText(/Alfaquest Fill/i);
    await expect(page.locator('#submitCountry')).toBeDisabled();
  });
});

test.describe('Alfaquest Fill', () => {
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
    await expect(page.locator('#gameOverSummary .game-over-modes')).toContainText(/Alfaquest Classic/i);
    await expect(page.locator('#gameOverSummary .game-over-modes a[href="alfaquest.html"]')).toBeVisible();
    await expect(page.locator('#submitCountry')).toBeDisabled();
  });

  test('shows victory summary when alphabet is complete', async ({ page }) => {
    test.setTimeout(120_000);
    await openAlfafillPage(page, '/alfafillnormal.html');
    const winningSequence = [
      'Antigua and Barbuda',
      'North Korea',
      'Oman',
      'Maldives',
      'Luxembourg',
      'Uzbekistan',
      'Zimbabwe',
      'Italy',
      'Tajikistan',
      'Jamaica',
      'Central African Republic',
      'Equatorial Guinea',
    ];
    for (const country of winningSequence) {
      await page.locator('#countryInput').fill(country);
      await page.locator('#submitCountry').click();
    }

    await expect(page.locator('#remainingLetters')).toHaveText('0');
    await expect(page.locator('#completionSummary')).toBeVisible();
    await expect(page.locator('#completionSummary')).toContainText(/Victory — alphabet complete/i);
    await expect(page.locator('#completionSummary')).toContainText(/Alfaquest Classic/i);
    await expect(page.locator('#requiredLetterInfo')).toBeEmpty();
    await expect(page.locator('#submitCountry')).toBeDisabled();
  });
});

test.describe('Alfaquest Strict', () => {
  test('requires starting letter A on first submission', async ({ page }) => {
    await openAlfafillPage(page, '/alfafillhard.html');
    await page.locator('#countryInput').fill('Germany');
    await page.locator('#submitCountry').click();

    await expect(page.locator('#alfa-toast')).toContainText(/invalid start letter/i);
  });

  test('shows required letter explanation on first turn', async ({ page }) => {
    await openAlfafillPage(page, '/alfafillhard.html');
    await expect(page.locator('#requiredLetterInfo')).toContainText('A');
    await expect(page.locator('#requiredLetterInfo .required-letter-hint')).toContainText(/Strict mode starts at A/i);
  });

  test('shows game over summary on dead-end move', async ({ page }) => {
    await openAlfafillPage(page, '/alfafillhard.html');
    for (const country of ['Antigua and Barbuda', 'Canada']) {
      await page.locator('#countryInput').fill(country);
      await page.locator('#submitCountry').click();
    }

    await expect(page.locator('#gameOverSummary')).toBeVisible();
    await expect(page.locator('#gameOverSummary')).toContainText(/only adds "C"/i);
    await expect(page.locator('#gameOverSummary')).toContainText(/Canada/i);
    await expect(page.locator('#gameOverSummary .game-over-modes')).toContainText(/Alfaquest Fill/i);
    await expect(page.locator('#submitCountry')).toBeDisabled();
  });

  test('shows victory summary when alphabet is complete', async ({ page }) => {
    test.setTimeout(120_000);
    await openAlfafillPage(page, '/alfafillhard.html');
    const winningSequence = [
      'Antigua and Barbuda',
      'Chad',
      'Equatorial Guinea',
      'Fiji',
      'Kazakhstan',
      'Mexico',
      'Papua New Guinea',
      'Vatican City',
    ];
    for (const country of winningSequence) {
      await page.locator('#countryInput').fill(country);
      await page.locator('#submitCountry').click();
    }

    await expect(page.locator('#remainingLetters')).toHaveText('0');
    await expect(page.locator('#completionSummary')).toBeVisible();
    await expect(page.locator('#completionSummary')).toContainText(/Victory — alphabet complete/i);
    await expect(page.locator('#completionSummary')).toContainText(/Legendary/i);
    await expect(page.locator('#completionSummary')).toContainText(/top-tier efficiency/i);
    await expect(page.locator('#completionSummary .completion-next-mode')).toContainText(/Alfaquest Fill/i);
    await expect(page.locator('#requiredLetterInfo')).toBeEmpty();
    await expect(page.locator('#submitCountry')).toBeDisabled();
  });
});
