import { test, expect } from '@playwright/test';

test('letter grid does not shift on first submit (desktop)', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/alfaquest.html');
  await page.waitForSelector('#letterGrid .letter-cell');

  const before = await page.locator('#letterGrid').boundingBox();
  const scrollBefore = await page.evaluate(() => window.scrollY);

  await page.fill('#countryInput', 'Albania');
  await page.click('#submitCountry');
  await expect(page.locator('#submittedList')).toContainText('Albania');

  const after = await page.locator('#letterGrid').boundingBox();
  const scrollAfter = await page.evaluate(() => window.scrollY);

  expect(before).toBeTruthy();
  expect(after).toBeTruthy();
  expect(Math.abs((after!.y - before!.y) - (scrollAfter - scrollBefore))).toBeLessThan(2);
});

test('letter grid does not shift on first submit (mobile)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/alfaquest.html');
  await page.waitForSelector('#letterGrid .letter-cell');

  await page.fill('#countryInput', 'Albania');
  await page.click('#submitCountry');
  await expect(page.locator('#submittedList')).toContainText('Albania');

  const layout = await page.evaluate(() => {
    const play = document.querySelector('.game-card--play');
    const required = document.getElementById('requiredLetterInfo');
    return {
      playTop: play ? play.getBoundingClientRect().top : 9999,
      requiredTop: required ? required.getBoundingClientRect().top : 9999,
    };
  });
  expect(layout.playTop).toBeLessThan(80);
  expect(layout.playTop).toBeLessThan(layout.requiredTop);
  await expect(page.locator('#countryInput')).toBeFocused();
});

test('mobile keeps country input near top after multiple submits', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/alfaquest.html');
  await page.waitForSelector('#letterGrid .letter-cell');

  // Simulate user scrolled down toward the board before typing again.
  await page.evaluate(() => window.scrollTo(0, 400));

  for (const country of ['Albania', 'Latvia', 'Tonga']) {
    await page.fill('#countryInput', country);
    await page.click('#submitCountry');
    await expect(page.locator('#submittedList')).toContainText(country);

    const layout = await page.evaluate(() => {
      const play = document.querySelector('.game-card--play');
      const required = document.getElementById('requiredLetterInfo');
      return {
        playTop: play ? play.getBoundingClientRect().top : 9999,
        requiredTop: required ? required.getBoundingClientRect().top : 9999,
      };
    });
    expect(layout.playTop).toBeLessThan(80);
    expect(layout.playTop).toBeLessThan(layout.requiredTop);
  }

  await expect(page.locator('#countryInput')).toBeFocused();
});
