import { test, expect } from '@playwright/test';
import { setupComprehensiveMockApi } from './helpers/mockApi';

test.describe('Comprehensive Client Tests with Mocked API', () => {
  test.beforeEach(async ({ page }) => {
    // Set up comprehensive API mocking before each test
    await setupComprehensiveMockApi(page);
  });

  test.describe('Navigation and Routing', () => {
    test('should navigate between all main pages', async ({ page }) => {
      // Start at home page (redirects to deployments)
      await page.goto('/');
      await expect(page).toHaveURL(/.*\/deployments/);
      
      // Navigate to builds
      await page.getByRole('link', { name: 'Builds' }).click();
      await expect(page).toHaveURL(/.*\/builds/);
      
      // Navigate to release
      await page.getByRole('link', { name: 'Release' }).click();
      await expect(page).toHaveURL(/.*\/release/);
      
      // Navigate to configuration
      await page.getByRole('link', { name: 'Configuration' }).click();
      await expect(page).toHaveURL(/.*\/configuration/);
      
      // Navigate back to deployments
      await page.getByRole('link', { name: 'Deployments' }).click();
      await expect(page).toHaveURL(/.*\/deployments/);
    });

    test('should handle direct navigation to specific routes', async ({ page }) => {
      const routes = ['/deployments', '/builds', '/release', '/configuration'];
      
      for (const route of routes) {
        await page.goto(route);
        await expect(page).toHaveURL(new RegExp(`.*${route}`));
        
        // Wait for page to load
        await page.waitForTimeout(1000);
        
        // Each page should have the main title
        await expect(page.getByText('Azure DevOps Dashboard')).toBeVisible();
      }
    });
  });

  test.describe('Dashboard/Deployments View', () => {
    test('should display pipeline status grid with mock data', async ({ page }) => {
      await page.goto('/deployments');
      await page.waitForTimeout(2000);

      // Check for filters section
      await expect(page.getByText('Filters')).toBeVisible();
      
      // Check for project selection
      const projectCombobox = page.locator('[role="combobox"]').first();
      await expect(projectCombobox).toBeVisible();
      
      // Take screenshot
      await page.screenshot({ path: 'test-results/dashboard-grid.png', fullPage: true });
    });

    test('should allow project filtering', async ({ page }) => {
      await page.goto('/deployments');
      await page.waitForTimeout(2000);
      
      // Find and click project combobox
      const projectCombobox = page.locator('[role="combobox"]').first();
      await projectCombobox.click();
      
      // Wait for options to appear
      await page.waitForTimeout(500);
      
      // Should have project options (from mock data)
      const projectOptions = page.locator('[role="option"]');
      const optionCount = await projectOptions.count();
      expect(optionCount).toBeGreaterThan(0);
      
      await page.screenshot({ path: 'test-results/project-filter-dropdown.png', fullPage: true });
    });
  });

  test.describe('Builds View', () => {
    test('should display builds table with mock data', async ({ page }) => {
      await page.goto('/builds');
      await page.waitForTimeout(2000);
      
      // Check for filter controls
      await expect(page.getByText('Filters')).toBeVisible();
      
      // Check project selection is available
      const projectCombobox = page.locator('[role="combobox"]').first();
      await expect(projectCombobox).toBeVisible();
      
      await page.screenshot({ path: 'test-results/builds-view-detailed.png', fullPage: true });
    });

    test('should support build filtering options', async ({ page }) => {
      await page.goto('/builds');
      await page.waitForTimeout(2000);
      
      // Select a project first
      const projectCombobox = page.locator('[role="combobox"]').first();
      await projectCombobox.click();
      await page.waitForTimeout(500);
      
      // Select first project option
      const firstOption = page.locator('[role="option"]').first();
      if (await firstOption.isVisible()) {
        await firstOption.click();
        await page.waitForTimeout(1000);
      }
      
      await page.screenshot({ path: 'test-results/builds-with-project-selected.png', fullPage: true });
    });
  });

  test.describe('Release View', () => {
    test('should display release builds with filtering options', async ({ page }) => {
      await page.goto('/release');
      await page.waitForTimeout(2000);
      
      // Check filters are present
      await expect(page.getByText('Filters')).toBeVisible();
      
      // Check project selection
      const projectCombobox = page.locator('[role="combobox"]').first();
      await expect(projectCombobox).toBeVisible();
      
      await page.screenshot({ path: 'test-results/release-view-detailed.png', fullPage: true });
    });

    test('should handle release build selection workflow', async ({ page }) => {
      await page.goto('/release');
      await page.waitForTimeout(2000);
      
      // Try to select a project
      const projectCombobox = page.locator('[role="combobox"]').first();
      await projectCombobox.click();
      await page.waitForTimeout(500);
      
      // Select first available project
      const projectOptions = page.locator('[role="option"]');
      if (await projectOptions.count() > 0) {
        await projectOptions.first().click();
        await page.waitForTimeout(1000);
        
        // After selecting project, more filters should become available
        await page.screenshot({ path: 'test-results/release-project-selected.png', fullPage: true });
      }
    });
  });

  test.describe('Configuration View', () => {
    test('should display configuration form with all fields', async ({ page }) => {
      await page.goto('/configuration');
      await page.waitForTimeout(1000);
      
      // Check for organization field
      await expect(page.getByText('Azure DevOps Organization')).toBeVisible();
      
      // Should have input fields visible
      const inputs = page.locator('input[type="text"], input[type="url"]');
      const inputCount = await inputs.count();
      expect(inputCount).toBeGreaterThan(0);
      
      await page.screenshot({ path: 'test-results/configuration-form.png', fullPage: true });
    });

    test('should handle form interactions', async ({ page }) => {
      await page.goto('/configuration');
      await page.waitForTimeout(1000);
      
      // Try to interact with form fields
      const textInputs = page.locator('input[type="text"]');
      if (await textInputs.count() > 0) {
        const firstInput = textInputs.first();
        await firstInput.fill('test-organization');
        await page.waitForTimeout(500);
        
        // Verify the input was filled
        const inputValue = await firstInput.inputValue();
        expect(inputValue).toBe('test-organization');
      }
      
      await page.screenshot({ path: 'test-results/configuration-form-filled.png', fullPage: true });
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle navigation when no data is loaded', async ({ page }) => {
      // Navigate directly without waiting for data
      await page.goto('/builds');
      
      // Should still show basic structure
      await expect(page.getByText('Azure DevOps Dashboard')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Builds' })).toBeVisible();
      
      // Wait for data to load
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: 'test-results/builds-loading-state.png', fullPage: true });
    });

    test('should maintain responsive design on different viewport sizes', async ({ page }) => {
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/deployments');
      await page.waitForTimeout(1000);
      
      // Navigation should still be accessible
      await expect(page.getByText('Azure DevOps Dashboard')).toBeVisible();
      
      await page.screenshot({ path: 'test-results/mobile-viewport.png', fullPage: true });
      
      // Test tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/deployments');
      await page.waitForTimeout(1000);
      
      await page.screenshot({ path: 'test-results/tablet-viewport.png', fullPage: true });
      
      // Return to desktop
      await page.setViewportSize({ width: 1280, height: 720 });
    });
  });

  test.describe('Data Loading and Display', () => {
    test('should display mock project data consistently across views', async ({ page }) => {
      const views = ['/deployments', '/builds', '/release'];
      
      for (const view of views) {
        await page.goto(view);
        await page.waitForTimeout(2000);
        
        // Each view should have project selection
        const projectCombobox = page.locator('[role="combobox"]').first();
        await expect(projectCombobox).toBeVisible();
        
        // Click to see options
        await projectCombobox.click();
        await page.waitForTimeout(500);
        
        // Should have consistent project options
        const options = page.locator('[role="option"]');
        const optionCount = await options.count();
        expect(optionCount).toBeGreaterThanOrEqual(1);
        
        // Close dropdown
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
    });

    test('should handle rapid navigation between views', async ({ page }) => {
      await page.goto('/');
      
      // Rapidly navigate between views
      const navigation = [
        { name: 'Builds', url: '/builds' },
        { name: 'Release', url: '/release' },
        { name: 'Configuration', url: '/configuration' },
        { name: 'Deployments', url: '/deployments' }
      ];
      
      for (const nav of navigation) {
        await page.getByRole('link', { name: nav.name }).click();
        await expect(page).toHaveURL(new RegExp(`.*${nav.url}`));
        
        // Brief wait to ensure page loads
        await page.waitForTimeout(500);
        
        // Verify basic structure is present
        await expect(page.getByText('Azure DevOps Dashboard')).toBeVisible();
      }
      
      await page.screenshot({ path: 'test-results/rapid-navigation-final.png', fullPage: true });
    });
  });

  test.describe('Accessibility and User Experience', () => {
    test('should have proper heading structure', async ({ page }) => {
      await page.goto('/deployments');
      await page.waitForTimeout(1000);
      
      // Check for main heading
      const mainHeading = page.locator('h1, h2, h3').first();
      await expect(mainHeading).toBeVisible();
      
      // Navigation links should be keyboard accessible
      const navigationLinks = page.locator('nav a, [role="navigation"] a');
      const linkCount = await navigationLinks.count();
      expect(linkCount).toBeGreaterThan(0);
    });

    test('should support keyboard navigation', async ({ page }) => {
      await page.goto('/deployments');
      await page.waitForTimeout(1000);
      
      // Tab through focusable elements
      await page.keyboard.press('Tab');
      await page.waitForTimeout(200);
      
      // Verify some element has focus
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      await page.screenshot({ path: 'test-results/keyboard-navigation.png', fullPage: true });
    });
  });
});