import { test, expect } from '@playwright/test';

test.describe('Homepage regression', () => {
  test('loads without JavaScript errors', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/');
    await expect(page.getByRole('heading', { name: /alfaword.*games/i })).toBeVisible();
    expect(pageErrors).toEqual([]);
  });

  test('does not include legacy prototype game scripts', async ({ page }) => {
    const html = await page.goto('/');
    const source = await html!.text();
    expect(source).not.toContain('getInputValue1');
    expect(source).not.toContain('/api/word1');
    expect(source).not.toContain('id="twohundred"');
    expect(source).not.toMatch(/<form[\s\S]*<!DOCTYPE html>/i);
  });

  test('links to all game modes', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /Play Alfaquest Classic/i })).toHaveAttribute('href', 'alfaquest.html');
    await expect(page.getByRole('link', { name: /Play Alfaquest Fill/i })).toHaveAttribute('href', 'alfafillnormal.html');
    await expect(page.getByRole('link', { name: /Play Alfaquest Easy/i })).toHaveAttribute('href', 'alfafilleasy.html');
    await expect(page.getByRole('link', { name: /Play Alfaquest Strict/i })).toHaveAttribute('href', 'alfafillhard.html');
  });

  test('shows Facebook follow link', async ({ page }) => {
    await page.goto('/');
    const facebookLink = page.getByRole('link', { name: /Follow on Facebook/i });
    await expect(facebookLink).toBeVisible();
    await expect(facebookLink).toHaveAttribute('href', 'https://www.facebook.com/alfaword.games');
    await expect(facebookLink).toHaveAttribute('target', '_blank');
  });
});
