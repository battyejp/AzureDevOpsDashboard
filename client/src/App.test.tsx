import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';
import { appConfig } from './config/appConfig';

test('renders Azure DevOps Dashboard title', () => {
  render(<App />);
  const titleElement = screen.getByText(/Azure DevOps Dashboard/i);
  expect(titleElement).toBeInTheDocument();
});

test('renders filters section', () => {
  render(<App />);
  const filtersElement = screen.getByText(/Filters/i);
  expect(filtersElement).toBeInTheDocument();
});

test('renders organization select field', () => {
  render(<App />);
  // Look for the organization value since the label has duplicates
  const orgValue = screen.getByText(appConfig.azureDevOpsOrganization);
  expect(orgValue).toBeInTheDocument();
});

test('renders environment select field', () => {
  render(<App />);
  // Look for the environment value 
  const envValue = screen.getByText('Development');
  expect(envValue).toBeInTheDocument();
});
