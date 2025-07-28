import { test, expect } from '@playwright/test';

test.describe('Navigation Between Views', () => {
  test('should be able to navigate between all three views', async ({ page }) => {
    // Start at the home page (should redirect to deployments)
    await page.goto('/');
    
    // Verify we're on the deployments page
    await expect(page.locator('h1')).toContainText('Deployments');
    await expect(page).toHaveURL('/deployments');
    
    // Navigate to builds
    await page.getByRole('link', { name: /builds/i }).click();
    await expect(page.locator('h1')).toContainText('Builds');
    await expect(page).toHaveURL('/builds');
    
    // Navigate to configuration
    await page.getByRole('link', { name: /configuration/i }).click();
    await expect(page.locator('h1')).toContainText('Configuration');
    await expect(page).toHaveURL('/configuration');
    
    // Navigate back to deployments
    await page.getByRole('link', { name: /deployments/i }).click();
    await expect(page.locator('h1')).toContainText('Deployments');
    await expect(page).toHaveURL('/deployments');
  });

  test('should have consistent navigation across all views', async ({ page }) => {
    const views = ['/deployments', '/builds', '/configuration'];
    
    for (const view of views) {
      await page.goto(view);
      
      // Check that navigation is present and contains all links
      await expect(page.getByRole('navigation')).toBeVisible();
      await expect(page.getByRole('link', { name: /deployments/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /builds/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /configuration/i })).toBeVisible();
    }
  });

  test('should have Material-UI theme applied consistently', async ({ page }) => {
    const views = ['/deployments', '/builds', '/configuration'];
    
    for (const view of views) {
      await page.goto(view);
      
      // Check for Material-UI theme elements
      await expect(page.locator('body')).toBeVisible();
      
      // Check for Paper components (should have Material-UI styling)
      const paperElements = page.locator('[class*="MuiPaper"]');
      const hasTheme = await paperElements.count() > 0;
      
      // At minimum, should have some Material-UI components
      expect(hasTheme).toBeTruthy();
    }
  });

  test('should redirect root path to deployments', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/deployments');
    await expect(page.locator('h1')).toContainText('Deployments');
  });
});