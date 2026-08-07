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
