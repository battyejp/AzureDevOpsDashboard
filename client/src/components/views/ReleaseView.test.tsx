import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ReleaseView from './ReleaseView';
import { ApiService } from '../../services/apiService';
import { ConfigService } from '../../services/configService';

// Mock the services
jest.mock('../../services/apiService');
jest.mock('../../services/configService');

const mockApiService = ApiService as jest.Mocked<typeof ApiService>;
const mockConfigService = ConfigService as jest.Mocked<typeof ConfigService>;

// Mock data
const mockProjects = [
  {
    id: '1',
    name: 'Test Project',
    description: 'A test project',
    url: 'test-url',
    state: 'wellFormed',
    visibility: 'private',
    lastUpdateTime: '2024-01-01T00:00:00Z'
  }
];

const mockPipelines = [
  {
    id: 1001,
    name: 'Test Pipeline',
    url: 'test-pipeline-url',
    queueStatus: 'enabled'
  }
];

const mockBuilds = [
  {
    id: 1,
    buildNumber: '1.2024.01',
    status: 'completed',
    result: 'succeeded',
    queueTime: '2024-01-01T00:00:00Z',
    startTime: '2024-01-01T00:01:00Z',
    finishTime: '2024-01-01T00:10:00Z',
    url: 'test-build-url',
    sourceBranch: 'refs/heads/main',
    reason: 'individualCI',
    tags: [],
    definition: {
      id: 1001,
      name: 'Test Pipeline'
    },
    project: {
      id: '1',
      name: 'Test Project'
    }
  }
];

const mockTimeline = {
  id: '1',
  records: [
    {
      id: 'stage1',
      name: 'Build',
      type: 'Stage',
      state: 'completed',
      result: 'succeeded',
      startTime: '2024-01-01T00:01:00Z',
      finishTime: '2024-01-01T00:05:00Z'
    },
    {
      id: 'stage2',
      name: 'Test',
      type: 'Stage',
      state: 'completed',
      result: 'succeeded',
      startTime: '2024-01-01T00:05:00Z',
      finishTime: '2024-01-01T00:10:00Z'
    }
  ]
};

describe('ReleaseView', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock successful API connectivity
    mockApiService.testApiConnectivity.mockResolvedValue(true);
    
    // Mock projects
    mockApiService.getProjects.mockResolvedValue(mockProjects);
    
    // Mock pipelines
    mockApiService.getPipelines.mockResolvedValue(mockPipelines);
    
    // Mock builds
    mockApiService.getBuilds.mockResolvedValue(mockBuilds);
    
    // Mock timeline
    mockApiService.getBuildTimeline.mockResolvedValue(mockTimeline);
    
    // Mock config service
    mockConfigService.getDefaultProject.mockReturnValue('Test Project');
    mockConfigService.getPipelineFilters.mockReturnValue(undefined);
    mockConfigService.isPipelineVisible.mockReturnValue(true);
  });

  it('renders release view with correct title', async () => {
    render(
      <BrowserRouter>
        <ReleaseView />
      </BrowserRouter>
    );

    expect(screen.getByText('Release')).toBeInTheDocument();
    expect(screen.getByText('Filters')).toBeInTheDocument();
  });

  it('loads and displays projects', async () => {
    render(
      <BrowserRouter>
        <ReleaseView />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(mockApiService.getProjects).toHaveBeenCalled();
    });
  });

  it('displays pipeline builds table when data is loaded', async () => {
    render(
      <BrowserRouter>
        <ReleaseView />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Pipeline')).toBeInTheDocument();
      expect(screen.getByText('Build Number')).toBeInTheDocument();
      expect(screen.getByText('Branch')).toBeInTheDocument();
      expect(screen.getByText('Reason')).toBeInTheDocument();
    });
  });

  it('handles API connectivity errors gracefully', async () => {
    mockApiService.testApiConnectivity.mockResolvedValue(false);
    
    render(
      <BrowserRouter>
        <ReleaseView />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Cannot connect to the Azure DevOps API backend/)).toBeInTheDocument();
    });
  });

  it('filters builds by main branch', async () => {
    render(
      <BrowserRouter>
        <ReleaseView />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(mockApiService.getBuilds).toHaveBeenCalledWith(
        expect.any(String), // organization
        'Test Project', // project
        1001, // pipelineId
        1, // count
        'all', // statusFilter
        'refs/heads/main', // branch filter
        'individualCI' // reason filter
      );
    });
  });

  it('displays stage filter dropdown', async () => {
    render(
      <BrowserRouter>
        <ReleaseView />
      </BrowserRouter>
    );

    await waitFor(() => {
      // Look for the stage filter in the filters section
      const filters = screen.getByText('Filters').closest('div');
      expect(filters).toContainHTML('Stage');
    });
  });

  it('stage filter is initially empty and available', async () => {
    render(
      <BrowserRouter>
        <ReleaseView />
      </BrowserRouter>
    );

    // Wait for the component to render
    await waitFor(() => {
      const filters = screen.getByText('Filters').closest('div');
      expect(filters).toContainHTML('Stage');
    });

    // Find all combobox elements (Project and Stage selects)
    const comboboxes = screen.getAllByRole('combobox');
    // Should have at least 2 comboboxes (Project and Stage)
    expect(comboboxes.length).toBeGreaterThanOrEqual(2);
  });
});
