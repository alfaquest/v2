import { test, expect } from '@playwright/test';

const WINNING_SEQUENCE = [
  'Antigua and Barbuda',
  'North Macedonia',
  'Oman',
  'Marshall Islands',
  'Republic of the Congo',
  'Equatorial Guinea',
  'Qatar',
  'Trinidad and Tobago',
  'Ivory Coast',
  'Vatican City',
  'Central African Republic',
  'Liechtenstein',
  'Honduras',
  'Denmark',
  'Kazakhstan',
  'Zimbabwe',
  'Burkina Faso',
  'United Arab Emirates',
  'South Africa',
  'Fiji',
  'Japan',
  'Papua New Guinea',
  'Germany',
  'Yemen',
];

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
    await expect(page.locator('#requiredLetterInfo .required-letter-hint')).toContainText(/Albania/i);
    await expect(page.locator('#requiredLetterInfo .required-letter-hint')).toContainText(/first unused starting letter/i);
    await expect(page.locator('#letterGrid .letter-cell.start-used')).toHaveCount(1);
    await expect(page.locator('#letterGrid .letter-cell.next-required')).toHaveCount(1);
    await expect(page.locator('#colourLegend')).toBeVisible();
  });

  test('first-turn required letter explains the A rule', async ({ page }) => {
    await expect(page.locator('#requiredLetterInfo')).toContainText('A');
    await expect(page.locator('#requiredLetterInfo .required-letter-hint')).toContainText(/begin.*A/i);
  });

  test('scoring modal documents letter-weighted position bonus', async ({ page }) => {
    await page.locator('#scoringInfoLink').click();
    await expect(page.locator('#scoringModal')).toBeVisible();
    await expect(page.locator('#scoringModal')).toContainText(/letter tier/i);
    await expect(page.locator('#scoringModal')).toContainText(/35,500/);
  });

  test('country input has mobile keyboard attributes', async ({ page }) => {
    const input = page.locator('#countryInput');
    await expect(input).toHaveAttribute('autocomplete', 'off');
    await expect(input).toHaveAttribute('autocapitalize', 'words');
    await expect(input).toHaveAttribute('inputmode', 'text');
    await expect(input).toHaveAttribute('enterkeyhint', 'go');
  });

  test('buttons meet minimum touch target height on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const submitHeight = await page.locator('#submitCountry').evaluate(
      (el) => el.getBoundingClientRect().height
    );
    const resetHeight = await page.locator('#resetLocal').evaluate(
      (el) => el.getBoundingClientRect().height
    );
    expect(submitHeight).toBeGreaterThanOrEqual(44);
    expect(resetHeight).toBeGreaterThanOrEqual(44);
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
    await expect(page.locator('#alfa-toast')).toContainText(/game over/i);
    await expect(page.locator('#gameOverSummary')).toBeVisible();
    await expect(page.locator('#gameOverSummary')).toContainText(/needed/i);
    await expect(page.locator('#gameOverSummary')).toContainText(/Malaysia/i);
    await expect(page.locator('#resetLocal')).toHaveClass(/reset-required/);
    await expect(page.locator('#submitCountry')).toBeDisabled();
    await expect(page.locator('#countryInput')).toBeDisabled();
    await expect(page.locator('#remainingLetters')).not.toHaveText('0');
  });

  test('reset highlight clears after game over reset', async ({ page }) => {
    await submitCountries(page, ['Albania', 'Latvia', 'Tonga', 'Oman', 'Malta']);
    await expect(page.locator('#resetLocal')).toHaveClass(/reset-required/);

    await page.locator('#resetLocal').click();
    await expect(page.locator('#resetLocal')).not.toHaveClass(/reset-required/);
    await expect(page.locator('#submittedList')).toHaveText('');
    await expect(page.locator('#submitCountry')).toBeEnabled();
  });

  test('game over summary Reset link clears the game', async ({ page }) => {
    await submitCountries(page, ['Albania', 'Latvia', 'Tonga', 'Oman', 'Malta']);
    await expect(page.locator('#gameOverSummary .game-over-reset-link')).toBeVisible();

    await page.locator('#gameOverSummary .game-over-reset-link').click();
    await expect(page.locator('#submittedList')).toHaveText('');
    await expect(page.locator('#gameOverSummary')).toBeHidden();
    await expect(page.locator('#submitCountry')).toBeEnabled();
  });

  test('run clock stops on game over', async ({ page }) => {
    await submitCountries(page, ['Albania', 'Latvia', 'Tonga', 'Oman', 'Malta']);
    await expect(page.locator('#alfa-toast')).toContainText(/game over|GAME OVER/i);

    const elapsedAtGameOver = await page.locator('#elapsedTime').textContent();
    await page.waitForTimeout(1500);
    await expect(page.locator('#elapsedTime')).toHaveText(elapsedAtGameOver || '');
  });

  test('game over after ten moves omits stuck helper hints', async ({ page }) => {
    const tenMoveDeadEnd = [
      'Antigua and Barbuda',
      'North Macedonia',
      'Oman',
      'Marshall Islands',
      'Republic of the Congo',
      'Equatorial Guinea',
      'Qatar',
      'Trinidad and Tobago',
      'Ivory Coast',
      'Vietnam',
    ];
    await submitCountries(page, tenMoveDeadEnd);

    await expect(page.locator('#submittedList')).toContainText('Vietnam');
    await expect(page.locator('#alfa-toast')).toContainText(/game over|GAME OVER/i);
    await expect(page.locator('#gameOverSummary')).toBeVisible();
    await expect(page.locator('#gameOverSummary')).toContainText(/needed/i);
    await expect(page.locator('#gameOverSummary')).not.toContainText(/Valid answers included/i);
    await expect(page.locator('#gameOverSummary')).not.toContainText(/Instead of/i);
    await expect(page.locator('#gameOverSummary')).not.toContainText(/On the list for/i);
    await expect(page.locator('#gameOverSummary')).not.toContainText(/Malaysia/i);
  });

  test('continues after round five when Malaysia avoids the Malta dead-end', async ({ page }) => {
    await submitCountries(page, ['Albania', 'Latvia', 'Tonga', 'Oman', 'Malaysia']);

    await expect(page.locator('#submittedList')).toContainText('Malaysia');
    await expect(page.locator('#requiredLetterInfo')).toContainText('Y');
    await expect(page.locator('#submitCountry')).toBeEnabled();
    await expect(page.locator('#remainingLetters')).toHaveText('19');
  });

  test('completes all 24 starting letters with a known winning sequence', async ({ page }) => {
    test.setTimeout(120_000);
    await submitCountries(page, WINNING_SEQUENCE);

    await expect(page.locator('#remainingLetters')).toHaveText('0');
    await expect(page.locator('#completionSummary')).toBeVisible();
    await expect(page.locator('#completionSummary')).toContainText(/Victory|24 starting letters/i);
    await expect(page.locator('#submittedList')).toContainText('Yemen');
  });
});
