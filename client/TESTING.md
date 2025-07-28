# Playwright E2E Testing

This document describes the end-to-end testing setup for the Azure DevOps Dashboard client application using Playwright.

## Overview

The client application includes Playwright-based end-to-end tests that use mock data to test the application's functionality without requiring a live backend API.

## Test Structure

### Test Files

- `e2e/smoke.spec.ts` - Basic smoke tests that verify core functionality

### Mock Data

All tests use comprehensive mock data that simulates:
- Azure DevOps projects
- Build pipelines
- Build records
- Deployment information
- API connectivity responses

## Running Tests

### Prerequisites

Ensure you have the project dependencies installed:

```bash
npm install
```

Install Playwright browsers (first time only):

```bash
npx playwright install
```

### Available Test Commands

```bash
# Run all Playwright tests
npm run test:e2e

# Run only smoke tests (fastest, good for CI)
npm run test:e2e:smoke

# Run tests with UI (for debugging)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# View test report
npm run test:e2e:report

# Build application and run smoke tests
npm run build:with-tests
```

### Test Configuration

Tests are configured via `playwright.config.ts`:
- Tests run against `http://localhost:3000`
- Automatically starts the development server before tests
- Runs tests across Chrome, Firefox, and Safari
- Generates HTML reports
- Captures traces on test failure

## Mock API Responses

The tests intercept API calls and return mock data:

### Projects API
- Returns sample Azure DevOps projects
- Simulates project selection scenarios

### Builds API
- Returns mock build records with various statuses
- Supports filtering by branch, reason, and status
- Includes both successful and failed builds

### Pipelines API
- Returns sample pipeline definitions
- Supports pipeline listing and selection

### Connectivity API
- Simulates backend connectivity checks
- Can be configured to simulate failures

## Test Scenarios

### Basic Navigation
- Page loading and routing
- Navigation between sections
- Mobile responsiveness

### Dashboard Functionality
- Project selection
- Environment filtering
- Error handling when backend unavailable

### Builds View
- Build listing and filtering
- Branch and reason filtering
- Loading states

### Configuration
- Form input handling
- Configuration persistence
- Validation scenarios

## CI/CD Integration

Tests are integrated into the GitHub Actions workflow (`client-build.yml`):

1. **Build Phase**: Application is built first
2. **Browser Installation**: Playwright browsers are installed
3. **Test Execution**: Smoke tests are run
4. **Artifact Upload**: Test results and reports are saved

### CI-specific considerations:
- Only smoke tests run in CI for speed
- Test reports are uploaded as artifacts
- Tests run in headless mode
- Failures don't block the build (can be adjusted)

## Writing New Tests

### Test File Structure

```typescript
import { test, expect, Page } from '@playwright/test';

// Mock data setup
const mockData = {
  // Your mock data here
};

async function setupMockApi(page: Page) {
  // Set up API route mocking
  await page.route('**/api/endpoint', async route => {
    await route.fulfill({ 
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockData)
    });
  });
}

test.describe('Your Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockApi(page);
  });

  test('should do something', async ({ page }) => {
    await page.goto('/your-page');
    await expect(page.getByText('Expected Text')).toBeVisible();
  });
});
```

### Best Practices

1. **Use role-based selectors**: `page.getByRole('button', { name: 'Submit' })`
2. **Mock all API calls**: Don't rely on external services
3. **Test user journeys**: Focus on real user scenarios
4. **Keep tests independent**: Each test should be able to run alone
5. **Use descriptive test names**: Clearly describe what is being tested
6. **Add waits for dynamic content**: Use `page.waitForTimeout()` sparingly

### Debugging Tests

```bash
# Run with UI for visual debugging
npm run test:e2e:ui

# Run in headed mode to see browser
npm run test:e2e:headed

# Run specific test file
npx playwright test dashboard.spec.ts

# Run specific test
npx playwright test --grep "should navigate between pages"
```

## Troubleshooting

### Common Issues

1. **Test timeouts**: Increase timeouts or add proper waits
2. **Element not found**: Use more specific selectors
3. **API mocking not working**: Check route patterns match actual calls
4. **Flaky tests**: Add proper waits and make assertions more specific

### Debug Information

- Test reports are generated in `playwright-report/`
- Screenshots and traces are captured on failure
- Console logs are available in test output

## Performance Considerations

- Smoke tests are optimized for CI speed
- Full test suite provides comprehensive coverage
- Tests use mock data to avoid network delays
- Parallel execution across multiple browsers
