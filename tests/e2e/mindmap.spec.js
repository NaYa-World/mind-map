import { test, expect } from '@playwright/test';

test.describe('MindMap E2E', () => {
  test('Loads the app and renders the root node', async ({ page }) => {
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
    // Navigate to the local dev server
    await page.goto('http://localhost:5500/app.html');

    // Wait for the SVG canvas to be present
    await page.waitForSelector('#canvas');

    // Wait for at least one node-group (the root node should be there)
    const nodeGroups = page.locator('.node-group');
    await expect(nodeGroups.first()).toBeVisible();

    // Verify the root node contains text
    const textElements = page.locator('.node-group text');
    const textContent = await textElements.first().textContent();
    expect(textContent).toBeTruthy();
  });

  test('Can add a new topic', async ({ page }) => {
    await page.goto('http://localhost:5500/app.html');
    
    // Wait for nodes to load
    await page.waitForSelector('.node-group');
    const initialNodesCount = await page.locator('.node-group').count();

    // Click the Add Topic button (opens dropdown)
    await page.click('#btn-add');

    // Click the Add Child option
    await page.click('[data-action="addChild"]');

    // Wait a brief moment for the animation and render
    await page.waitForTimeout(500);

    // Verify there is one more node than before
    const finalNodesCount = await page.locator('.node-group').count();
    expect(finalNodesCount).toBeGreaterThan(initialNodesCount);
  });
});
