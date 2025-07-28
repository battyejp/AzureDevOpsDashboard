// Mock the services BEFORE any imports
jest.mock('../services/apiService', () => ({
  ApiService: {
    testApiConnectivity: jest.fn(() => Promise.resolve(true)),
    getProjects: jest.fn(() => Promise.resolve([
      { id: '1', name: 'Project One', description: 'Test project 1', url: 'http://test1', state: 'active', visibility: 'public', lastUpdateTime: '2023-01-01' },
      { id: '2', name: 'Project Two', description: 'Test project 2', url: 'http://test2', state: 'active', visibility: 'public', lastUpdateTime: '2023-01-01' }
    ])),
  }
}));
jest.mock('../services/configService', () => ({
  ConfigService: {
    getDefaultProject: jest.fn(() => undefined),
    setDefaultProject: jest.fn(),
    getConfig: jest.fn(() => ({})),
    saveConfig: jest.fn(),
    clearConfig: jest.fn(),
  }
}));

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import Configuration from './Configuration';
import { ApiService } from '../services/apiService';
import { ConfigService } from '../services/configService';

const mockProjects = [
  { id: '1', name: 'Project One', description: 'Test project 1', url: 'http://test1', state: 'active', visibility: 'public', lastUpdateTime: '2023-01-01' },
  { id: '2', name: 'Project Two', description: 'Test project 2', url: 'http://test2', state: 'active', visibility: 'public', lastUpdateTime: '2023-01-01' }
];

beforeEach(() => {
  jest.clearAllMocks();
  (ApiService.getProjects as jest.Mock).mockResolvedValue(mockProjects);
  (ApiService.testApiConnectivity as jest.Mock).mockResolvedValue(true);
  (ConfigService.getDefaultProject as jest.Mock).mockReturnValue(undefined);
  (ConfigService.setDefaultProject as jest.Mock).mockImplementation(() => {});
});

test('renders Configuration page title', async () => {
  await act(async () => {
    render(<Configuration />);
  });
  expect(screen.getByText('Configuration')).toBeInTheDocument();
});

test('loads projects and displays them in dropdown', async () => {
  await act(async () => {
    render(<Configuration />);
  });
  await waitFor(() => {
    expect(ApiService.getProjects).toHaveBeenCalled();
  });
  expect(screen.getByLabelText('Default Project')).toBeInTheDocument();
});

test('displays current default project if configured', async () => {
  (ConfigService.getDefaultProject as jest.Mock).mockReturnValue('Project One');
  await act(async () => {
    render(<Configuration />);
  });
  await waitFor(() => {
    expect(ApiService.getProjects).toHaveBeenCalled();
    expect(ConfigService.getDefaultProject).toHaveBeenCalled();
  });
  expect(screen.getByLabelText('Default Project')).toHaveTextContent('Project One');
});

test('shows error message when projects fail to load', async () => {
  (ApiService.getProjects as jest.Mock).mockRejectedValue(new Error('API Error'));
  (ConfigService.getDefaultProject as jest.Mock).mockReturnValue(undefined);
  await act(async () => {
    render(<Configuration />);
  });
  await waitFor(() => {
    expect(screen.getByText('API Error')).toBeInTheDocument();
  });
});

test('shows instructions on how configuration works', () => {
  render(<Configuration />);
  expect(screen.getByText('How it works:')).toBeInTheDocument();
  expect(screen.getByText(/Select a default project from the dropdown above/)).toBeInTheDocument();
});