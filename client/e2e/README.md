# Playwright End-to-End Tests

This directory contains Playwright end-to-end tests for the Azure DevOps Dashboard application, covering all three main views:

## Test Coverage

### 1. Dashboard View (`dashboard.spec.ts`)
Tests the main deployments dashboard functionality:
- Page title and filters display
- Environment selection and options
- Project dropdown functionality
- API connectivity error handling
- Navigation structure
- Pipeline status section

### 2. Builds View (`builds.spec.ts`)
Tests the builds list and filtering functionality:
- Page title and filter controls
- Branch and reason filter options
- Filter value changes
- Build table structure
- API connectivity error handling
- Project/pipeline selection dependencies

### 3. Configuration View (`configuration.spec.ts`)
Tests the configuration management functionality:
- Configuration title and description
- Default project dropdown
- Save and clear configuration buttons
- Project selection and validation
- API connectivity error handling
- Instructions section

### 4. Navigation (`navigation.spec.ts`)
Tests cross-view functionality:
- Navigation between all views
- Consistent navigation structure
- Material-UI theme application
- Root path redirection

## Running Tests

### Prerequisites
First, install Playwright browsers:
```bash
npm run test:e2e:install
```

### Test Commands
```bash
# Run all tests headlessly
npm run test:e2e

# Run tests with browser UI visible
npm run test:e2e:headed

# Run tests with Playwright UI mode
npm run test:e2e:ui

# Run tests as part of build process
npm run build:with-e2e
```

### Development
```bash
# Start the development server first
npm start

# In another terminal, run tests
npm run test:e2e
```

## Test Structure

Each test file follows the same pattern:
1. **Navigation**: Navigate to the specific view
2. **Core UI Elements**: Test that essential UI components are present
3. **Interactions**: Test user interactions like dropdown selections
4. **Error Handling**: Test behavior when API is unavailable
5. **Navigation**: Test that navigation links work correctly

## Configuration

The tests are configured in `playwright.config.ts` with:
- **Base URL**: `http://localhost:3000`
- **Test Directory**: `./e2e`
- **Browser**: Chromium (can be extended to Firefox/Safari)
- **Web Server**: Automatically starts `npm start` before tests
- **Retries**: 2 retries on CI, 0 locally
- **Timeout**: Standard timeouts with custom waits for API calls

## Notes

- Tests are designed to work with or without the backend API running
- When API is unavailable, tests verify appropriate error messages are shown
- Tests use Material-UI selectors and ARIA roles for reliable element identification
- Tests include timeouts and retry logic for async operations like API calls
- All tests check for consistent navigation structure across views

## CI/CD Integration

These tests can be integrated into CI/CD pipelines:
1. Install dependencies: `npm install`
2. Install browsers: `npm run test:e2e:install` 
3. Run tests: `npm run test:e2e`

The `build:with-e2e` script combines the React build with Playwright tests for full validation.