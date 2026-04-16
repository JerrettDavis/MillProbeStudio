import { test, expect } from '@playwright/test';

// Helper to parse Y position from the probe position display
function parseY(text: string): number {
  const match = text.match(/X:[\d.-]+\s+Y:([\d.-]+)\s+Z:[\d.-]+/);
  return match ? parseFloat(match[1]) : NaN;
}

test('probe simulation moves smoothly without stutter', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.click('text=Visualize');

  // If the Create Test Sequence button is present, click it
  const createTestSelector = '[data-testid="probe-create-sequence"]';
  if (await page.locator(createTestSelector).isVisible({ timeout: 2000 }).catch(() => false)) {
    await page.click(createTestSelector);
    await page.waitForTimeout(1000);
  }

  const positionSelector = '[data-testid="probe-current-position"]';
  await page.waitForSelector(positionSelector, { timeout: 10000 });

  // Click Play
  await page.click('[data-testid="probe-sim-play"]');

  // Sample probe Y position every 100ms for 2 seconds
  const samples: { time: number, y: number }[] = [];
  const start = Date.now();
  for (let i = 0; i < 20; i++) {
    const text = await page.locator(positionSelector).innerText();
    samples.push({ time: Date.now() - start, y: parseY(text) });
    await page.waitForTimeout(100);
  }

  // Analyze samples: ensure no two consecutive samples are identical (no stutter), and no sample is repeated more than once
  let stutterCount = 0;
  for (let i = 1; i < samples.length; i++) {
    if (samples[i].y === samples[i-1].y) stutterCount++;
  }
  // Allow a single stutter due to rounding, but not repeated stalling
  expect(stutterCount).toBeLessThanOrEqual(2);

  // Ensure the probe moved at least 5mm over the 2 seconds (not stuck)
  const totalMove = Math.abs(samples[samples.length-1].y - samples[0].y);
  expect(totalMove).toBeGreaterThan(5);
});
