import { test, expect } from '@playwright/test';
import { setupComprehensiveMockApi } from './helpers/mockApi';

test.describe('Basic Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up comprehensive API mocking before each test
    await setupComprehensiveMockApi(page);
  });

  test('should load the home page with mock data', async ({ page }) => {
    await page.goto('/');
    
    // Check for the main title
    await expect(page.getByText('Azure DevOps Dashboard')).toBeVisible();
    
    // Check navigation exists
    await expect(page.getByRole('link', { name: 'Deployments' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Builds' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Configuration' })).toBeVisible();
    
    // Wait for mock data to load (should be fast)
    await page.waitForTimeout(1000);
    
    // Check if filters section appears (indicating data loaded)
    await expect(page.getByText('Filters')).toBeVisible();
    
    // Find the project combobox by its role and click to open dropdown
    const projectCombobox = page.locator('[role="combobox"]').first();
    await expect(projectCombobox).toBeVisible();
    
    await page.screenshot({ path: 'test-results/smoke-home-page.png', fullPage: true });
  });

  test('should navigate to builds page and show mock data', async ({ page }) => {
    await page.goto('/builds');
    
    // Check URL
    await expect(page).toHaveURL(/.*\/builds/);
    
    // Check if we can find the builds heading or navigation
    const navigation = page.getByRole('link', { name: 'Builds' });
    await expect(navigation).toBeVisible();
    
    // Wait for mock data to populate
    await page.waitForTimeout(2000);
    
    // Check for filters (indicating page is functional)
    await expect(page.getByText('Filters')).toBeVisible();
    
    // Check for project combobox
    const projectCombobox = page.locator('[role="combobox"]').first();
    await expect(projectCombobox).toBeVisible();
    
    await page.screenshot({ path: 'test-results/smoke-builds-page.png', fullPage: true });
  });

  test('should navigate to configuration page', async ({ page }) => {
    await page.goto('/configuration');
    
    // Check URL
    await expect(page).toHaveURL(/.*\/configuration/);
    
    // Check if we can find navigation
    const navigation = page.getByRole('link', { name: 'Configuration' });
    await expect(navigation).toBeVisible();
    
    // Check for configuration page content
    await expect(page.getByText('Configure your default settings for the Azure DevOps Dashboard')).toBeVisible();
    
    // Check for default project field
    await expect(page.getByText('Default Project')).toBeVisible();
    
    // Wait for any content to load and take screenshot
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/smoke-configuration-page.png', fullPage: true });
  });

  test('should navigate to release page and display mock data', async ({ page }) => {
    await page.goto('/release');
    
    // Check URL
    await expect(page).toHaveURL(/.*\/release/);
    
    // Check navigation link is highlighted
    const navigation = page.getByRole('link', { name: 'Release' });
    await expect(navigation).toBeVisible();
    
    // Wait for data to load
    await page.waitForTimeout(2000);
    
    // Check for filters section
    await expect(page.getByText('Filters')).toBeVisible();
    
    // Check for project selection
    const projectCombobox = page.locator('[role="combobox"]').first();
    await expect(projectCombobox).toBeVisible();
    
    await page.screenshot({ path: 'test-results/smoke-release-page.png', fullPage: true });
  });
});
