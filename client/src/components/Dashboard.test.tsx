import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Dashboard from './views/Dashboard';
import { ApiService } from '../services/apiService';
import { ConfigService } from '../services/configService';
import { DeploymentEnvironment } from '../models/types';

// Mock dependencies
jest.mock('../services/apiService');
jest.mock('../services/configService');

const mockApiService = ApiService as jest.Mocked<typeof ApiService>;
const mockConfigService = ConfigService as jest.Mocked<typeof ConfigService>;

describe('Dashboard Component', () => {
  const mockProjects = [
    {
      id: '1',
      name: 'Test Project',
      description: 'Test Description',
      url: 'https://test.com',
      state: 'wellFormed' as const,
      visibility: 'private' as const,
      lastUpdateTime: '2023-01-01T00:00:00Z'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default successful API responses
    mockApiService.testApiConnectivity.mockResolvedValue(true);
    mockApiService.getProjects.mockResolvedValue(mockProjects);
    mockApiService.getPipelines.mockResolvedValue([]);
    mockConfigService.getDefaultProject.mockReturnValue(undefined);
    mockConfigService.isPipelineVisible.mockReturnValue(true);
    
    // Mock console methods
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders dashboard title', () => {
    render(<Dashboard />);
    expect(screen.getByText('Deployments')).toBeInTheDocument();
  });

  test('renders filters section', () => {
    render(<Dashboard />);
    expect(screen.getByText('Filters')).toBeInTheDocument();
  });

  test('renders environment select with default development value', () => {
    render(<Dashboard />);
    expect(screen.getByText('Development')).toBeInTheDocument();
  });

  test('loads projects on mount', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(mockApiService.testApiConnectivity).toHaveBeenCalled();
      expect(mockApiService.getProjects).toHaveBeenCalled();
    });
  });

  test('displays error when API connectivity fails', async () => {
    mockApiService.testApiConnectivity.mockResolvedValue(false);
    
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/Cannot connect to the Azure DevOps API backend/)).toBeInTheDocument();
    });
  });

  test('displays loading indicator initially', () => {
    render(<Dashboard />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('calls getPipelines when project is available', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(mockApiService.getPipelines).toHaveBeenCalledWith(expect.any(String), 'Test Project');
    });
  });

  test('uses ConfigService for pipeline visibility', async () => {
    const mockPipelines = [{ id: 1, name: 'Pipeline 1', folder: '', url: '', queueStatus: 'enabled' }];
    mockApiService.getPipelines.mockResolvedValue(mockPipelines);
    
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(mockConfigService.isPipelineVisible).toHaveBeenCalledWith('Test Project', 1);
    });
  });

  test('uses ConfigService to get default project', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(mockConfigService.getDefaultProject).toHaveBeenCalled();
    });
  });

  test('handles environment enum correctly', () => {
    // Test the getEnvironmentName function indirectly by checking UI
    render(<Dashboard />);
    
    // The component should display "Development" for DeploymentEnvironment.Dev
    expect(screen.getByText('Development')).toBeInTheDocument();
    
    // Verify environment form field is present
    expect(screen.getAllByText('Environment')).toHaveLength(2); // Label and legend
  });
});