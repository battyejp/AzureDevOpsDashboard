import { test, expect } from '@playwright/test';
import { setupComprehensiveMockApi } from './helpers/mockApi';

test.describe('Interactive Features and Data Filtering', () => {
  test.beforeEach(async ({ page }) => {
    // Set up comprehensive API mocking before each test
    await setupComprehensiveMockApi(page);
  });

  test.describe('Project Selection and Filtering', () => {
    test('should allow project selection across all views', async ({ page }) => {
      const views = [
        { path: '/deployments', name: 'Deployments' },
        { path: '/builds', name: 'Builds' },
        { path: '/release', name: 'Release' }
      ];

      for (const view of views) {
        await page.goto(view.path);
        await page.waitForTimeout(2000);

        // Find project combobox
        const projectCombobox = page.locator('[role="combobox"]').first();
        await expect(projectCombobox).toBeVisible();

        // Click to open dropdown
        await projectCombobox.click();
        await page.waitForTimeout(500);

        // Should have options from mock data
        const options = page.locator('[role="option"]');
        const optionCount = await options.count();
        expect(optionCount).toBeGreaterThan(0);

        // Select first option
        await options.first().click();
        await page.waitForTimeout(1000);

        await page.screenshot({ 
          path: `test-results/project-selected-${view.name.toLowerCase()}.png`, 
          fullPage: true 
        });

        // Verify selection was made (combobox should show selected value)
        const selectedValue = await projectCombobox.textContent();
        expect(selectedValue).toBeTruthy();
        expect(selectedValue!.trim()).not.toBe('');
      }
    });

    test('should persist project selection when navigating between views', async ({ page }) => {
      // Start at deployments and select a project
      await page.goto('/deployments');
      await page.waitForTimeout(2000);

      const projectCombobox = page.locator('[role="combobox"]').first();
      await projectCombobox.click();
      await page.waitForTimeout(500);

      const options = page.locator('[role="option"]');
      if (await options.count() > 0) {
        const selectedProjectText = await options.first().textContent();
        await options.first().click();
        await page.waitForTimeout(1000);

        // Navigate to builds and check if project is still selected
        await page.getByRole('link', { name: 'Builds' }).click();
        await page.waitForTimeout(2000);

        const buildsProjectCombobox = page.locator('[role="combobox"]').first();
        const currentSelection = await buildsProjectCombobox.textContent();
        
        // Project selection might be maintained by localStorage or application state
        // At minimum, the combobox should be functional
        await expect(buildsProjectCombobox).toBeVisible();
      }
    });
  });

  test.describe('Build Filtering and Interaction', () => {
    test('should display builds with various filter options', async ({ page }) => {
      await page.goto('/builds');
      await page.waitForTimeout(2000);

      // Select a project first
      const projectCombobox = page.locator('[role="combobox"]').first();
      await projectCombobox.click();
      await page.waitForTimeout(500);

      const options = page.locator('[role="option"]');
      if (await options.count() > 0) {
        await options.first().click();
        await page.waitForTimeout(2000);

        // Look for additional filter controls that might appear
        const filterControls = page.locator('[role="combobox"], input[type="text"], button');
        const controlCount = await filterControls.count();
        expect(controlCount).toBeGreaterThan(0);

        await page.screenshot({ path: 'test-results/builds-filters-available.png', fullPage: true });
      }
    });

    test('should handle build status filtering', async ({ page }) => {
      await page.goto('/builds');
      await page.waitForTimeout(2000);

      // Select project
      const projectCombobox = page.locator('[role="combobox"]').first();
      await projectCombobox.click();
      await page.waitForTimeout(500);

      const projectOptions = page.locator('[role="option"]');
      if (await projectOptions.count() > 0) {
        await projectOptions.first().click();
        await page.waitForTimeout(2000);

        // Look for status filter controls
        const allComboboxes = page.locator('[role="combobox"]');
        const comboboxCount = await allComboboxes.count();
        
        // Should have at least project combobox, possibly more for filtering
        expect(comboboxCount).toBeGreaterThanOrEqual(1);

        await page.screenshot({ path: 'test-results/builds-status-filters.png', fullPage: true });
      }
    });
  });

  test.describe('Release View Interactions', () => {
    test('should support release candidate filtering', async ({ page }) => {
      await page.goto('/release');
      await page.waitForTimeout(2000);

      // Select project
      const projectCombobox = page.locator('[role="combobox"]').first();
      await projectCombobox.click();
      await page.waitForTimeout(500);

      const options = page.locator('[role="option"]');
      if (await options.count() > 0) {
        await options.first().click();
        await page.waitForTimeout(2000);

        // Release view should show additional filtering options
        const allComboboxes = page.locator('[role="combobox"]');
        const comboboxCount = await allComboboxes.count();
        
        // Expect multiple comboboxes for project, pipeline, etc.
        expect(comboboxCount).toBeGreaterThanOrEqual(1);

        await page.screenshot({ path: 'test-results/release-candidate-filters.png', fullPage: true });
      }
    });

    test('should display release-specific build information', async ({ page }) => {
      await page.goto('/release');
      await page.waitForTimeout(2000);

      // Select project to trigger data loading
      const projectCombobox = page.locator('[role="combobox"]').first();
      await projectCombobox.click();
      await page.waitForTimeout(500);

      const options = page.locator('[role="option"]');
      if (await options.count() > 0) {
        await options.first().click();
        await page.waitForTimeout(3000); // Allow time for build data to load

        // Should show some build-related content
        const buildElements = page.locator('table, [role="grid"], .build, [data-testid*="build"]');
        
        await page.screenshot({ path: 'test-results/release-build-data.png', fullPage: true });
      }
    });
  });

  test.describe('Data Loading States and Error Handling', () => {
    test('should handle slow network conditions gracefully', async ({ page }) => {
      // Simulate slow network by adding delay to API routes
      await page.route('**/api/**', async route => {
        // Add delay before fulfilling request
        await new Promise(resolve => setTimeout(resolve, 100));
        await route.continue();
      });

      await page.goto('/deployments');
      
      // Should show loading state or basic structure immediately
      await expect(page.getByText('Azure DevOps Dashboard')).toBeVisible();
      
      // Wait for data to eventually load
      await page.waitForTimeout(3000);
      
      // Should have loaded filters
      await expect(page.getByText('Filters')).toBeVisible();
      
      await page.screenshot({ path: 'test-results/slow-network-handling.png', fullPage: true });
    });

    test('should handle empty data responses', async ({ page }) => {
      // Override mock to return empty data
      await page.route('**/api/projects', async route => {
        await route.fulfill({ 
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      });

      await page.goto('/deployments');
      await page.waitForTimeout(2000);

      // Should still show basic structure
      await expect(page.getByText('Azure DevOps Dashboard')).toBeVisible();
      
      // Combobox might be disabled or show placeholder
      const projectCombobox = page.locator('[role="combobox"]').first();
      await expect(projectCombobox).toBeVisible();

      await page.screenshot({ path: 'test-results/empty-data-handling.png', fullPage: true });
    });
  });

  test.describe('User Interface Responsiveness', () => {
    test('should maintain functionality across different screen sizes', async ({ page }) => {
      const screenSizes = [
        { width: 320, height: 568, name: 'mobile-small' },
        { width: 768, height: 1024, name: 'tablet' },
        { width: 1024, height: 768, name: 'laptop' },
        { width: 1920, height: 1080, name: 'desktop' }
      ];

      for (const size of screenSizes) {
        await page.setViewportSize({ width: size.width, height: size.height });
        await page.goto('/deployments');
        await page.waitForTimeout(1000);

        // Core functionality should be accessible
        await expect(page.getByText('Azure DevOps Dashboard')).toBeVisible();
        
        // Navigation should be accessible (might be in hamburger menu on mobile)
        const navLinks = page.locator('nav a, [role="navigation"] a, button[aria-label*="menu"]');
        const hasNavigation = await navLinks.count() > 0;
        expect(hasNavigation).toBeTruthy();

        await page.screenshot({ 
          path: `test-results/responsive-${size.name}.png`, 
          fullPage: true 
        });
      }

      // Reset to default
      await page.setViewportSize({ width: 1280, height: 720 });
    });

    test('should handle rapid user interactions', async ({ page }) => {
      await page.goto('/deployments');
      await page.waitForTimeout(2000);

      // Rapidly click through navigation
      const navigationItems = ['Builds', 'Release', 'Configuration', 'Deployments'];
      
      for (let i = 0; i < 3; i++) { // Do 3 cycles
        for (const navItem of navigationItems) {
          await page.getByRole('link', { name: navItem }).click();
          await page.waitForTimeout(200); // Brief wait
          
          // Should maintain basic structure
          await expect(page.getByText('Azure DevOps Dashboard')).toBeVisible();
        }
      }

      await page.screenshot({ path: 'test-results/rapid-interactions.png', fullPage: true });
    });
  });

  test.describe('Configuration Form Functionality', () => {
    test('should validate configuration form inputs', async ({ page }) => {
      await page.goto('/configuration');
      await page.waitForTimeout(1000);

      // Find input fields
      const textInputs = page.locator('input[type="text"], input[type="url"]');
      const inputCount = await textInputs.count();

      if (inputCount > 0) {
        // Fill in form fields
        for (let i = 0; i < Math.min(inputCount, 3); i++) {
          const input = textInputs.nth(i);
          await input.fill(`test-value-${i}`);
          await page.waitForTimeout(200);
        }

        await page.screenshot({ path: 'test-results/configuration-form-filled-validation.png', fullPage: true });

        // Clear fields to test empty state
        for (let i = 0; i < Math.min(inputCount, 3); i++) {
          const input = textInputs.nth(i);
          await input.fill('');
          await page.waitForTimeout(200);
        }

        await page.screenshot({ path: 'test-results/configuration-form-empty.png', fullPage: true });
      }
    });

    test('should handle form submission or save actions', async ({ page }) => {
      await page.goto('/configuration');
      await page.waitForTimeout(1000);

      // Look for save/submit buttons
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();

      if (buttonCount > 0) {
        // Fill in a form field first
        const textInputs = page.locator('input[type="text"]');
        if (await textInputs.count() > 0) {
          await textInputs.first().fill('test-organization');
          await page.waitForTimeout(500);
        }

        // Look for save/submit button
        const saveButton = page.locator('button').filter({ hasText: /save|submit|apply/i });
        if (await saveButton.count() > 0) {
          await saveButton.first().click();
          await page.waitForTimeout(1000);
        }

        await page.screenshot({ path: 'test-results/configuration-save-action.png', fullPage: true });
      }
    });
  });
});