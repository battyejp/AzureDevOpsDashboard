import { test, expect } from '@playwright/test';
import { setupComprehensiveMockApi } from './helpers/mockApi';

test.describe('Mock API Validation Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up comprehensive API mocking before each test
    await setupComprehensiveMockApi(page);
  });

  test('should validate mock API responses match application expectations', async ({ page }) => {
    // Override default port to match our running server
    await page.goto('http://localhost:3001/');
    
    // Wait for app to load
    await page.waitForTimeout(3000);
    
    // Basic smoke test - verify app loads with mocked data
    await expect(page.getByText('Azure DevOps Dashboard')).toBeVisible();
    
    // Navigation should be present
    await expect(page.getByRole('link', { name: 'Deployments' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Builds' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Configuration' })).toBeVisible();
    
    // Take screenshot to verify layout
    await page.screenshot({ path: 'test-results/mock-api-validation.png', fullPage: true });
  });

  test('should verify configuration shows mocked mode', async ({ page }) => {
    await page.goto('http://localhost:3001/configuration');
    await page.waitForTimeout(2000);
    
    // Configuration page should load
    await expect(page.getByText('Azure DevOps Organization')).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/config-mocked-mode.png', fullPage: true });
  });

  test('should validate projects are loaded from mock data', async ({ page }) => {
    await page.goto('http://localhost:3001/deployments');
    await page.waitForTimeout(3000);
    
    // Should have filters section
    await expect(page.getByText('Filters')).toBeVisible();
    
    // Project combobox should be present
    const projectCombobox = page.locator('[role="combobox"]').first();
    await expect(projectCombobox).toBeVisible();
    
    // Click to see mock project options
    await projectCombobox.click();
    await page.waitForTimeout(1000);
    
    // Should have mock project options
    const options = page.locator('[role="option"]');
    const optionCount = await options.count();
    expect(optionCount).toBeGreaterThan(0);
    
    await page.screenshot({ path: 'test-results/mock-projects-loaded.png', fullPage: true });
  });

  test('should validate builds view with mock data', async ({ page }) => {
    await page.goto('http://localhost:3001/builds');
    await page.waitForTimeout(3000);
    
    // Should show filters
    await expect(page.getByText('Filters')).toBeVisible();
    
    // Should have project selection
    const projectCombobox = page.locator('[role="combobox"]').first();
    await expect(projectCombobox).toBeVisible();
    
    await page.screenshot({ path: 'test-results/builds-mock-data.png', fullPage: true });
  });

  test('should validate release view functionality', async ({ page }) => {
    await page.goto('http://localhost:3001/release');
    await page.waitForTimeout(3000);
    
    // Should show filters
    await expect(page.getByText('Filters')).toBeVisible();
    
    await page.screenshot({ path: 'test-results/release-mock-data.png', fullPage: true });
  });
});