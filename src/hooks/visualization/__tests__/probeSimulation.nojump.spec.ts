import { test, expect } from '@playwright/test';

test('probe simulation does not jump on play', async ({ page }) => {
  // Go to the app (update to correct dev server URL)
  await page.goto('http://localhost:5173/');

  // Navigate to the Visualize tab
  await page.click('text=Visualize');

  // If the Create Test Sequence button is present, click it
  const createTestSelector = '[data-testid="probe-create-sequence"]';
  if (await page.locator(createTestSelector).isVisible({ timeout: 2000 }).catch(() => false)) {
    const isDisabled = await page.locator(createTestSelector).isDisabled();
    console.log('Create Test Sequence button disabled before click:', isDisabled);
    await page.click(createTestSelector);
    // Wait for the UI to update after creating the sequence
    await page.waitForTimeout(1000);
    // Debug: check if the button is still present
    const stillPresent = await page.locator(createTestSelector).isVisible().catch(() => false);
    console.log('Create Test Sequence button still present after click:', stillPresent);
    // Debug: check for No Sequence badge
    const noSeqBadge = await page.locator('text=No Sequence').isVisible().catch(() => false);
    console.log('No Sequence badge present after click:', noSeqBadge);
  }

  // Wait for the probe simulation Current Position to be visible
  const positionSelector = '[data-testid="probe-current-position"]';
  await page.waitForSelector(positionSelector, { timeout: 10000 });

  // Read the initial position
  const initialText = await page.locator(positionSelector).innerText();
  const initialMatch = initialText.match(/X:([\d.-]+)\s+Y:([\d.-]+)\s+Z:([\d.-]+)/);
  expect(initialMatch).not.toBeNull();
  const initialY = initialMatch ? parseFloat(initialMatch[2]) : NaN;

  // Wait 3 seconds to ensure no background movement
  await page.waitForTimeout(3000);

  // Click Play
  await page.click('[data-testid="probe-sim-play"]');

  // Wait 500ms
  await page.waitForTimeout(500);

  // Read the new position
  const newText = await page.locator(positionSelector).innerText();
  const newMatch = newText.match(/X:([\d.-]+)\s+Y:([\d.-]+)\s+Z:([\d.-]+)/);
  expect(newMatch).not.toBeNull();
  const newY = newMatch ? parseFloat(newMatch[2]) : NaN;

  // The probe should not have jumped more than 1mm
  expect(Math.abs(newY - initialY)).toBeLessThanOrEqual(1);
});
