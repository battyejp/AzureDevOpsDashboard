#!/usr/bin/env node

/**
 * Script to organize test artifacts for better CI visibility
 * This script runs after Playwright tests to create a summary of screenshots and test results
 */

const fs = require('fs');
const path = require('path');

function organizeTestArtifacts() {
  const testResultsDir = 'test-results';
  const playwrightReportDir = 'playwright-report';
  const summaryFile = 'test-artifacts-summary.md';

  let summary = '# Test Artifacts Summary\n\n';
  summary += `Generated on: ${new Date().toISOString()}\n\n`;

  let screenshots = [];
  let videos = [];
  let traces = [];

  // Check for screenshots in test-results
  if (fs.existsSync(testResultsDir)) {
    const files = fs.readdirSync(testResultsDir);
    screenshots = files.filter(f => f.match(/\.(png|jpg|jpeg)$/i));
    videos = files.filter(f => f.match(/\.(webm|mp4)$/i));
    traces = files.filter(f => f.match(/\.zip$/i));

    if (screenshots.length > 0) {
      summary += '## 📸 Screenshots\n\n';
      screenshots.forEach(screenshot => {
        const filePath = path.join(testResultsDir, screenshot);
        const stats = fs.statSync(filePath);
        summary += `- **${screenshot}** (${(stats.size / 1024).toFixed(1)} KB)\n`;
      });
      summary += '\n';
    }

    if (videos.length > 0) {
      summary += '## 🎥 Videos\n\n';
      videos.forEach(video => {
        const filePath = path.join(testResultsDir, video);
        const stats = fs.statSync(filePath);
        summary += `- **${video}** (${(stats.size / 1024 / 1024).toFixed(1)} MB)\n`;
      });
      summary += '\n';
    }

    if (traces.length > 0) {
      summary += '## 🔍 Trace Files\n\n';
      traces.forEach(trace => {
        summary += `- **${trace}**\n`;
      });
      summary += '\n';
    }
  }

  // Check for Playwright HTML report
  if (fs.existsSync(playwrightReportDir)) {
    summary += '## 📊 Playwright HTML Report\n\n';
    summary += 'Interactive test report available in `playwright-report/index.html`\n\n';
  }

  // Add instructions
  summary += '## 🔧 How to Access\n\n';
  summary += '1. Download the `playwright-test-results` artifact from the GitHub Actions run\n';
  summary += '2. Extract the zip file\n';
  summary += '3. Open files as needed:\n';
  summary += '   - Screenshots: `test-results/*.png`\n';
  summary += '   - Videos: `test-results/*.webm`\n';
  summary += '   - Interactive report: `playwright-report/index.html`\n\n';

  // Write summary file
  fs.writeFileSync(summaryFile, summary);
  console.log(`Test artifacts summary written to ${summaryFile}`);
  
  // Also log to console for CI
  console.log('\n' + summary);

  return {
    screenshots: screenshots.length || 0,
    videos: videos.length || 0,
    traces: traces.length || 0,
    hasReport: fs.existsSync(playwrightReportDir)
  };
}

if (require.main === module) {
  organizeTestArtifacts();
}

module.exports = { organizeTestArtifacts };