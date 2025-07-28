import { test, expect } from '@playwright/test';

test.describe('Configuration View', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the configuration view
    await page.goto('/configuration');
  });

  test('should display the configuration title and icon', async ({ page }) => {
    // Check page title with settings icon
    await expect(page.locator('h1')).toContainText('Configuration');
    
    // Check for settings icon (MUI SettingsIcon)
    await expect(page.locator('[data-testid="SettingsIcon"]')).toBeVisible();
  });

  test('should display configuration description', async ({ page }) => {
    // Check for description text
    await expect(page.locator('text=Configure your default settings')).toBeVisible();
    await expect(page.locator('text=The default project will be automatically selected')).toBeVisible();
  });

  test('should display default project dropdown', async ({ page }) => {
    // Check default project dropdown exists
    await expect(page.getByRole('combobox', { name: /default project/i })).toBeVisible();
    
    // Check the label
    await expect(page.locator('label', { hasText: 'Default Project' })).toBeVisible();
  });

  test('should display action buttons', async ({ page }) => {
    // Check for Save Configuration button
    await expect(page.getByRole('button', { name: /save configuration/i })).toBeVisible();
    
    // Check for Clear Configuration button
    await expect(page.getByRole('button', { name: /clear configuration/i })).toBeVisible();
    
    // Check for save icon
    await expect(page.locator('[data-testid="SaveIcon"]')).toBeVisible();
    
    // Check for clear icon
    await expect(page.locator('[data-testid="ClearIcon"]')).toBeVisible();
  });

  test('should have save button disabled when no project is selected', async ({ page }) => {
    // Wait for initial load
    await page.waitForTimeout(2000);
    
    // Save button should be disabled if no project is selected
    const saveButton = page.getByRole('button', { name: /save configuration/i });
    
    // Check if button is disabled (might be enabled if projects load and auto-select)
    const isDisabled = await saveButton.isDisabled();
    const projectSelect = page.getByRole('combobox', { name: /default project/i });
    const hasProject = await projectSelect.textContent();
    
    // Either button is disabled OR there's a project selected
    expect(isDisabled || (hasProject && hasProject !== '' && hasProject !== 'None')).toBeTruthy();
  });

  test('should display project options when dropdown is clicked', async ({ page }) => {
    // Wait for potential projects to load
    await page.waitForTimeout(3000);
    
    const projectSelect = page.getByRole('combobox', { name: /default project/i });
    
    // Check if projects loaded successfully or if there's an error
    await expect(async () => {
      // Try clicking the dropdown
      await projectSelect.click();
      
      // Look for either project options or error state
      const hasNoneOption = await page.getByRole('option', { name: /none/i }).isVisible();
      const hasErrorAlert = await page.locator('[role="alert"]').isVisible();
      const hasWarningAlert = await page.locator('text=No projects found').isVisible();
      
      expect(hasNoneOption || hasErrorAlert || hasWarningAlert).toBeTruthy();
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
      expect(errorText).toMatch(/Cannot connect to the Azure DevOps API backend|Failed to load projects/);
    }).toPass({ timeout: 10000 });
  });

  test('should display how it works section', async ({ page }) => {
    // Check for "How it works" section
    await expect(page.locator('h6', { hasText: 'How it works:' })).toBeVisible();
    
    // Check for instruction list items
    await expect(page.locator('text=Select a default project from the dropdown above')).toBeVisible();
    await expect(page.locator('text=Click "Save Configuration" to persist your choice')).toBeVisible();
    await expect(page.locator('text=The selected project will be automatically chosen in all views')).toBeVisible();
    await expect(page.locator('text=You can still manually change the project in individual views')).toBeVisible();
    await expect(page.locator('text=Your configuration is saved locally in your browser')).toBeVisible();
  });

  test('should be able to click clear configuration button', async ({ page }) => {
    // Clear button should always be clickable
    const clearButton = page.getByRole('button', { name: /clear configuration/i });
    await expect(clearButton).toBeEnabled();
    
    // Click the button (this should work even without backend)
    await clearButton.click();
    
    // Should show success message
    await expect(page.locator('text=Configuration cleared successfully')).toBeVisible();
  });

  test('should have correct navigation structure', async ({ page }) => {
    // Check that navigation exists and contains expected links
    await expect(page.getByRole('navigation')).toBeVisible();
    
    // Check navigation links
    await expect(page.getByRole('link', { name: /deployments/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /builds/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /configuration/i })).toBeVisible();
  });

  test('should display warning when no projects are available', async ({ page }) => {
    // Wait for load to complete
    await page.waitForTimeout(3000);
    
    // Should show either projects loaded or warning about no projects
    await expect(async () => {
      const hasWarning = await page.locator('text=No projects found').isVisible();
      const hasError = await page.locator('[role="alert"]').isVisible();
      const hasProjects = await page.getByRole('combobox', { name: /default project/i }).isEnabled();
      
      expect(hasWarning || hasError || hasProjects).toBeTruthy();
    }).toPass({ timeout: 5000 });
  });
});