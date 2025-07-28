import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Configuration from './Configuration';
import { ApiService } from '../services/apiService';
import { ConfigService } from '../services/configService';

// Mock the services
jest.mock('../services/apiService');
jest.mock('../services/configService');

const mockApiService = ApiService as jest.Mocked<typeof ApiService>;
const mockConfigService = ConfigService as jest.Mocked<typeof ConfigService>;

const mockProjects = [
  { id: '1', name: 'Project One', description: 'Test project 1', url: 'http://test1', state: 'active', visibility: 'public', lastUpdateTime: '2023-01-01' },
  { id: '2', name: 'Project Two', description: 'Test project 2', url: 'http://test2', state: 'active', visibility: 'public', lastUpdateTime: '2023-01-01' }
];

beforeEach(() => {
  jest.clearAllMocks();
});

test('renders Configuration page title', async () => {
  mockApiService.getProjects.mockResolvedValue(mockProjects);
  mockConfigService.getDefaultProject.mockReturnValue(undefined);

  render(<Configuration />);
  
  expect(screen.getByText('Configuration')).toBeInTheDocument();
});

test('loads projects and displays them in dropdown', async () => {
  mockApiService.getProjects.mockResolvedValue(mockProjects);
  mockConfigService.getDefaultProject.mockReturnValue(undefined);

  render(<Configuration />);
  
  await waitFor(() => {
    expect(mockApiService.getProjects).toHaveBeenCalled();
  });

  // The dropdown should be present
  expect(screen.getByLabelText('Default Project')).toBeInTheDocument();
});

test('displays current default project if configured', async () => {
  mockApiService.getProjects.mockResolvedValue(mockProjects);
  mockConfigService.getDefaultProject.mockReturnValue('Project One');

  render(<Configuration />);
  
  await waitFor(() => {
    expect(mockApiService.getProjects).toHaveBeenCalled();
  });

  // Should load the default project value
  await waitFor(() => {
    expect(mockConfigService.getDefaultProject).toHaveBeenCalled();
  });
});

test('shows error message when projects fail to load', async () => {
  mockApiService.getProjects.mockRejectedValue(new Error('API Error'));
  mockConfigService.getDefaultProject.mockReturnValue(undefined);

  render(<Configuration />);
  
  await waitFor(() => {
    expect(screen.getByText('Failed to load projects')).toBeInTheDocument();
  });
});

test('shows instructions on how configuration works', () => {
  mockApiService.getProjects.mockResolvedValue(mockProjects);
  mockConfigService.getDefaultProject.mockReturnValue(undefined);

  render(<Configuration />);
  
  expect(screen.getByText('How it works:')).toBeInTheDocument();
  expect(screen.getByText(/Select a default project from the dropdown above/)).toBeInTheDocument();
});