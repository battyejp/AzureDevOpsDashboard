import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  // Check if browsers are available
  try {
    const browser = await chromium.launch();
    await browser.close();
    console.log('✓ Playwright browsers are available');
  } catch (error) {
    console.log('⚠ Playwright browsers not installed. Run "npx playwright install" to install them.');
    console.log('⚠ Tests will be skipped until browsers are installed.');
  }
}

export default globalSetup;