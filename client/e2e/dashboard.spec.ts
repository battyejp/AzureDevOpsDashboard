import { test, expect } from '@playwright/test';

test.describe('Dashboard View', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard (deployments) view
    await page.goto('/');
  });

  test('should display the dashboard title and filters', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1')).toContainText('Deployments');
    
    // Check filters section exists
    await expect(page.locator('h6')).toContainText('Filters');
    
    // Check project select exists
    await expect(page.getByRole('combobox', { name: /project/i })).toBeVisible();
    
    // Check environment select exists
    await expect(page.getByRole('combobox', { name: /environment/i })).toBeVisible();
  });

  test('should display default environment selection', async ({ page }) => {
    // Check that Development is the default environment
    const environmentSelect = page.getByRole('combobox', { name: /environment/i });
    await expect(environmentSelect).toHaveText('Development');
  });

  test('should display environment options when clicked', async ({ page }) => {
    // Click on environment select
    const environmentSelect = page.getByRole('combobox', { name: /environment/i });
    await environmentSelect.click();
    
    // Check all environment options are visible
    await expect(page.getByRole('option', { name: /development/i })).toBeVisible();
    await expect(page.getByRole('option', { name: /system integration testing/i })).toBeVisible();
    await expect(page.getByRole('option', { name: /user acceptance testing/i })).toBeVisible();
    await expect(page.getByRole('option', { name: /pre-production/i })).toBeVisible();
    await expect(page.getByRole('option', { name: /production/i })).toBeVisible();
  });

  test('should be able to change environment filter', async ({ page }) => {
    // Click on environment select
    const environmentSelect = page.getByRole('combobox', { name: /environment/i });
    await environmentSelect.click();
    
    // Select Production environment
    await page.getByRole('option', { name: /production/i }).click();
    
    // Verify the selection changed
    await expect(environmentSelect).toHaveText('Production');
  });

  test('should display API connectivity warning when backend is not available', async ({ page }) => {
    // Look for either loading indicator or error message
    // This test will likely show an error since we don't have the backend running
    const errorAlert = page.locator('[role="alert"]');
    
    // Wait for either success or error state
    await expect(async () => {
      const isErrorVisible = await errorAlert.isVisible();
      const errorText = isErrorVisible ? await errorAlert.textContent() : '';
      
      // Should show backend connectivity error
      expect(errorText).toMatch(/Cannot connect to the Azure DevOps API backend|Failed to load projects/);
    }).toPass({ timeout: 10000 });
  });

  test('should have correct navigation structure', async ({ page }) => {
    // Check that navigation exists and contains expected links
    await expect(page.getByRole('navigation')).toBeVisible();
    
    // Check navigation links
    await expect(page.getByRole('link', { name: /deployments/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /builds/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /configuration/i })).toBeVisible();
  });

  test('should display pipeline status section when project is available', async ({ page }) => {
    // Look for the pipeline status section
    const pipelineSection = page.locator('text=Pipeline Status');
    
    // This might be hidden until a project is selected and loaded
    // We'll check for either the section or a "no pipelines" message
    await expect(async () => {
      const hasPipelineSection = await pipelineSection.isVisible();
      const hasNoPipelinesMessage = await page.locator('text=No pipelines').isVisible();
      
      expect(hasPipelineSection || hasNoPipelinesMessage).toBeTruthy();
    }).toPass({ timeout: 10000 });
  });
});