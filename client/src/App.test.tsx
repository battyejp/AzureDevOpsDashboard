import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';
import { appConfig } from './config/appConfig';
import * as apiServiceModule from './services/apiService';

beforeEach(() => {
  jest.spyOn(apiServiceModule.ApiService, 'getProjects').mockResolvedValue([
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
  // Wait for the project name to appear in the select field
  const projectOption = await screen.findByText('Sample Project');
  expect(projectOption).toBeInTheDocument();
});

test('renders environment select field', () => {
  render(<App />);
  // Look for the environment value 
  const envValue = screen.getByText('Development');
  expect(envValue).toBeInTheDocument();
});
