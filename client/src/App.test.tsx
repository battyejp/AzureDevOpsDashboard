import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';
import { appConfig } from './config/appConfig';

import { ApiService } from './services/apiService';
import { ConfigService } from './services/configService';

jest.mock('./services/apiService');
jest.mock('./services/configService');

const mockApiService = ApiService as jest.Mocked<typeof ApiService>;
const mockConfigService = ConfigService as jest.Mocked<typeof ConfigService>;


beforeEach(() => {
  jest.clearAllMocks();
  mockApiService.getProjects.mockResolvedValue([
    {
      id: '1',
      name: 'Sample Project',
      description: 'desc',
      url: '',
      state: 'wellFormed',
      visibility: 'private',
      lastUpdateTime: new Date().toISOString(),
    },
  ]);
  mockApiService.testApiConnectivity.mockResolvedValue(true);
  mockConfigService.getDefaultProject.mockReturnValue(undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

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

test('renders project select field with project name', async () => {
  render(<App />);
  // Wait for all comboboxes to appear
  const comboboxes = await screen.findAllByRole('combobox');
  // Find the combobox that contains 'Sample Project'
  const projectCombo = comboboxes.find(combo => combo.textContent?.includes('Sample Project'));
  expect(projectCombo).toBeDefined();
  expect(projectCombo).toHaveTextContent('Sample Project');
});

test('renders environment select field', () => {
  render(<App />);
  // Look for the environment value 
  const envValue = screen.getByText('Development');
  expect(envValue).toBeInTheDocument();
});
