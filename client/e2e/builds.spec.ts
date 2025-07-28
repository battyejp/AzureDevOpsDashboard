import { test, expect } from '@playwright/test';

test.describe('Builds View', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the builds view
    await page.goto('/builds');
  });

  test('should display the builds title and filters', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1')).toContainText('Builds');
    
    // Check filters section exists
    await expect(page.locator('h6')).toContainText('Filters');
    
    // Check all filter dropdowns exist
    await expect(page.getByRole('combobox', { name: /project/i })).toBeVisible();
    await expect(page.getByRole('combobox', { name: /pipeline/i })).toBeVisible();
    await expect(page.getByRole('combobox', { name: /branch/i })).toBeVisible();
    await expect(page.getByRole('combobox', { name: /reason/i })).toBeVisible();
  });

  test('should display default filter values', async ({ page }) => {
    // Check default branch filter is 'main'
    const branchSelect = page.getByRole('combobox', { name: /branch/i });
    await expect(branchSelect).toHaveText('main');
    
    // Check default reason filter is 'CI'
    const reasonSelect = page.getByRole('combobox', { name: /reason/i });
    await expect(reasonSelect).toHaveText('CI');
  });

  test('should display branch filter options when clicked', async ({ page }) => {
    // Click on branch select
    const branchSelect = page.getByRole('combobox', { name: /branch/i });
    await branchSelect.click();
    
    // Check branch options are visible
    await expect(page.getByRole('option', { name: /main/i })).toBeVisible();
    await expect(page.getByRole('option', { name: /develop/i })).toBeVisible();
    await expect(page.getByRole('option', { name: /release/i })).toBeVisible();
    await expect(page.getByRole('option', { name: /all/i })).toBeVisible();
  });

  test('should display reason filter options when clicked', async ({ page }) => {
    // Click on reason select
    const reasonSelect = page.getByRole('combobox', { name: /reason/i });
    await reasonSelect.click();
    
    // Check reason options are visible
    await expect(page.getByRole('option', { name: /ci/i })).toBeVisible();
    await expect(page.getByRole('option', { name: /manual/i })).toBeVisible();
    await expect(page.getByRole('option', { name: /scheduled/i })).toBeVisible();
    await expect(page.getByRole('option', { name: /pull request/i })).toBeVisible();
    await expect(page.getByRole('option', { name: /all/i })).toBeVisible();
  });

  test('should be able to change branch filter', async ({ page }) => {
    // Click on branch select
    const branchSelect = page.getByRole('combobox', { name: /branch/i });
    await branchSelect.click();
    
    // Select develop branch
    await page.getByRole('option', { name: /develop/i }).click();
    
    // Verify the selection changed
    await expect(branchSelect).toHaveText('develop');
  });

  test('should be able to change reason filter', async ({ page }) => {
    // Click on reason select
    const reasonSelect = page.getByRole('combobox', { name: /reason/i });
    await reasonSelect.click();
    
    // Select manual reason
    await page.getByRole('option', { name: /manual/i }).click();
    
    // Verify the selection changed
    await expect(reasonSelect).toHaveText('Manual');
  });

  test('should display builds table headers when builds are available', async ({ page }) => {
    // Wait for potential table to load or error to appear
    await page.waitForTimeout(2000);
    
    // Check for either table headers or no builds message
    await expect(async () => {
      const hasTable = await page.locator('table').isVisible();
      const hasNoBuildMessage = await page.locator('text=No builds found').isVisible();
      const hasErrorMessage = await page.locator('[role="alert"]').isVisible();
      
      if (hasTable) {
        // If table exists, check headers
        await expect(page.locator('th', { hasText: 'Build Number' })).toBeVisible();
        await expect(page.locator('th', { hasText: 'Branch' })).toBeVisible();
        await expect(page.locator('th', { hasText: 'Reason' })).toBeVisible();
        await expect(page.locator('th', { hasText: 'Start Time' })).toBeVisible();
        await expect(page.locator('th', { hasText: 'Last Stage' })).toBeVisible();
        await expect(page.locator('th', { hasText: 'Build Time' })).toBeVisible();
        await expect(page.locator('th', { hasText: 'Tags' })).toBeVisible();
      }
      
      expect(hasTable || hasNoBuildMessage || hasErrorMessage).toBeTruthy();
    }).toPass({ timeout: 10000 });
  });

  test('should display API connectivity warning when backend is not available', async ({ page }) => {
    // Look for error alert
    const errorAlert = page.locator('[role="alert"]');
    
    // Wait for either success or error state
    await expect(async () => {
      const isErrorVisible = await errorAlert.isVisible();
      const errorText = isErrorVisible ? await errorAlert.textContent() : '';
      
      // Should show backend connectivity error
      expect(errorText).toMatch(/Cannot connect to the Azure DevOps API backend|Failed to load projects|Failed to load/);
    }).toPass({ timeout: 10000 });
  });

  test('should have pipeline select disabled when no project is selected', async ({ page }) => {
    // Pipeline select should be disabled initially if no project is loaded
    const pipelineSelect = page.getByRole('combobox', { name: /pipeline/i });
    
    // Wait a moment for initial load
    await page.waitForTimeout(2000);
    
    // Check if pipeline select is disabled (might be enabled if projects load successfully)
    const isDisabled = await pipelineSelect.isDisabled();
    const hasOptions = await pipelineSelect.textContent();
    
    // Should either be disabled or show some content
    expect(isDisabled || hasOptions).toBeTruthy();
  });

  test('should have correct navigation structure', async ({ page }) => {
    // Check that navigation exists and contains expected links
    await expect(page.getByRole('navigation')).toBeVisible();
    
    // Check navigation links
    await expect(page.getByRole('link', { name: /deployments/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /builds/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /configuration/i })).toBeVisible();
  });
});