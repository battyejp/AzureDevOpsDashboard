import { Page } from '@playwright/test';

// Comprehensive mock data
export const mockData = {
  projects: [
    {
      id: 'project-1',
      name: 'Sample Project 1',
      description: 'Main dashboard project',
      url: 'https://dev.azure.com/test/Azure%20DevOps%20Dashboard',
      state: 'wellFormed',
      visibility: 'private',
      lastUpdateTime: '2024-01-28T00:00:00Z',
    },
    {
      id: 'project-2', 
      name: 'Sample Project 2',
      description: 'Another test project',
      url: 'https://dev.azure.com/test/Sample%20Project',
      state: 'wellFormed',
      visibility: 'private',
      lastUpdateTime: '2024-01-27T00:00:00Z',
    }
  ],

  pipelines: [
    {
      id: 1,
      name: 'Frontend Build',
      folder: '\\',
      revision: 1,
    },
    {
      id: 2,
      name: 'Backend API',
      folder: '\\Deploy',
      revision: 2,
    },
    {
      id: 3,
      name: 'Integration Tests',
      folder: '\\Tests',
      revision: 1,
    }
  ],

  builds: [
    {
      id: 101,
      buildNumber: '20240128.1',
      status: 'completed',
      result: 'succeeded',
      queueTime: '2024-01-28T10:00:00Z',
      startTime: '2024-01-28T10:01:00Z',
      finishTime: '2024-01-28T10:05:00Z',
      definition: { id: 1, name: 'Frontend Build' },
      sourceBranch: 'refs/heads/main',
      sourceVersion: 'abc123def',
      reason: 'manual',
      requestedFor: {
        displayName: 'John Developer',
        uniqueName: 'john@company.com'
      }
    },
    {
      id: 102,
      buildNumber: '20240128.2',
      status: 'completed',
      result: 'succeeded',
      queueTime: '2024-01-28T11:00:00Z',
      startTime: '2024-01-28T11:01:00Z',
      finishTime: '2024-01-28T11:08:00Z',
      definition: { id: 2, name: 'Backend API' },
      sourceBranch: 'refs/heads/main',
      sourceVersion: 'def456ghi',
      reason: 'continuous integration',
      requestedFor: {
        displayName: 'Jane Developer',
        uniqueName: 'jane@company.com'
      }
    },
    {
      id: 103,
      buildNumber: '20240128.3',
      status: 'inProgress',
      result: null,
      queueTime: '2024-01-28T12:00:00Z',
      startTime: '2024-01-28T12:01:00Z',
      finishTime: null,
      definition: { id: 3, name: 'Integration Tests' },
      sourceBranch: 'refs/heads/feature/new-feature',
      sourceVersion: 'ghi789jkl',
      reason: 'pullRequest',
      requestedFor: {
        displayName: 'Test User',
        uniqueName: 'test@company.com'
      }
    },
    {
      id: 104,
      buildNumber: '20240128.4',
      status: 'completed',
      result: 'failed',
      queueTime: '2024-01-28T13:00:00Z',
      startTime: '2024-01-28T13:01:00Z',
      finishTime: '2024-01-28T13:03:00Z',
      definition: { id: 1, name: 'Frontend Build' },
      sourceBranch: 'refs/heads/bugfix/critical-fix',
      sourceVersion: 'jkl012mno',
      reason: 'manual',
      requestedFor: {
        displayName: 'Emergency Deployer',
        uniqueName: 'emergency@company.com'
      }
    }
  ],

  deployments: [
    {
      id: 201,
      pipelineId: 1,
      environment: 'Development',
      status: 'succeeded',
      deploymentTime: '2024-01-28T10:10:00Z',
      buildId: 101,
      requestedFor: {
        displayName: 'John Developer',
        uniqueName: 'john@company.com'
      }
    },
    {
      id: 202,
      pipelineId: 2,
      environment: 'Development',
      status: 'succeeded',
      deploymentTime: '2024-01-28T11:15:00Z',
      buildId: 102,
      requestedFor: {
        displayName: 'Jane Developer',
        uniqueName: 'jane@company.com'
      }
    },
    {
      id: 203,
      pipelineId: 1,
      environment: 'Testing',
      status: 'inProgress',
      deploymentTime: '2024-01-28T12:30:00Z',
      buildId: 101,
      requestedFor: {
        displayName: 'Auto Deploy',
        uniqueName: 'auto@company.com'
      }
    }
  ],

  pipelineStatuses: [
    {
      pipelineId: 1,
      pipelineName: 'Frontend Build',
      isLoading: false,
      error: undefined,
      latestBuild: {
        id: 101,
        buildNumber: '20240128.1',
        status: 'completed',
        result: 'succeeded',
        finishTime: '2024-01-28T10:05:00Z'
      },
      deployedBuild: {
        id: 101,
        environment: 'Development',
        deploymentTime: '2024-01-28T10:10:00Z',
        status: 'succeeded'
      }
    },
    {
      pipelineId: 2,
      pipelineName: 'Backend API',
      isLoading: false,
      error: undefined,
      latestBuild: {
        id: 102,
        buildNumber: '20240128.2',
        status: 'completed',
        result: 'succeeded',
        finishTime: '2024-01-28T11:08:00Z'
      },
      deployedBuild: {
        id: 102,
        environment: 'Development',
        deploymentTime: '2024-01-28T11:15:00Z',
        status: 'succeeded'
      }
    }
  ]
};

// Enhanced API mocking function
export async function setupComprehensiveMockApi(page: Page) {
  // Mock API connectivity test - return true immediately
  await page.route('**/api/connectivity/test', async route => {
    await route.fulfill({ 
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(true)
    });
  });

  // Mock projects endpoints for both /projects and /api/projects
  await page.route('**/projects', async route => {
    await route.fulfill({ 
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockData.projects)
    });
  });
  await page.route('**/api/projects', async route => {
    await route.fulfill({ 
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockData.projects)
    });
  });

  // Mock pipelines endpoint
  await page.route('**/api/pipelines/**', async route => {
    await route.fulfill({ 
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockData.pipelines)
    });
  });

  // Mock builds endpoint with filtering support
  await page.route('**/api/builds/**', async route => {
    const url = new URL(route.request().url());
    const branch = url.searchParams.get('branch');
    const reason = url.searchParams.get('reason');
    const status = url.searchParams.get('status');
    const pipelineId = url.searchParams.get('pipelineId');
    
    let filteredBuilds = [...mockData.builds];
    
    if (branch) {
      filteredBuilds = filteredBuilds.filter(build => 
        build.sourceBranch.includes(branch)
      );
    }
    
    if (reason) {
      filteredBuilds = filteredBuilds.filter(build => 
        build.reason === reason
      );
    }
    
    if (status) {
      filteredBuilds = filteredBuilds.filter(build => 
        build.status === status
      );
    }

    if (pipelineId) {
      filteredBuilds = filteredBuilds.filter(build => 
        build.definition.id === parseInt(pipelineId)
      );
    }

    await route.fulfill({ 
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(filteredBuilds)
    });
  });

  // Mock deployments endpoint
  await page.route('**/api/deployments/**', async route => {
    const url = new URL(route.request().url());
    const environment = url.searchParams.get('environment');
    const pipelineId = url.searchParams.get('pipelineId');
    
    let filteredDeployments = [...mockData.deployments];
    
    if (environment) {
      filteredDeployments = filteredDeployments.filter(deployment => 
        deployment.environment.toLowerCase() === environment.toLowerCase()
      );
    }
    
    if (pipelineId) {
      filteredDeployments = filteredDeployments.filter(deployment => 
        deployment.pipelineId === parseInt(pipelineId)
      );
    }

    await route.fulfill({ 
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(filteredDeployments)
    });
  });

  // Mock pipeline status endpoint (for dashboard grid)
  await page.route('**/api/pipelines/*/status/**', async route => {
    const url = route.request().url();
    const pipelineIdMatch = url.match(/pipelines\/(\d+)\/status/);
    const pipelineId = pipelineIdMatch ? parseInt(pipelineIdMatch[1]) : null;
    
    const status = mockData.pipelineStatuses.find(s => s.pipelineId === pipelineId) || 
                   mockData.pipelineStatuses[0];

    await route.fulfill({ 
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(status)
    });
  });

  // Mock any other API calls with empty responses
  // Catch-all for other API endpoints except those already handled
  await page.route('**/api/:endpoint((?!projects|pipelines|builds|deployments|connectivity).*)', async route => {
    await route.fulfill({ 
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([])
    });
  });
}
