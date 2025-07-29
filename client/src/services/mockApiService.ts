import { Project, Pipeline, Build, DeploymentEnvironment, DeployedBuild, BuildTimeline, TimelineRecord, JiraIssue } from '../models/types';

// Mock data to demonstrate the application functionality
export class MockApiService {
  private static mockProjects: Project[] = [
    {
      id: '12345678-1234-1234-1234-123456789012',
      name: 'E-Commerce Platform',
      description: 'Main e-commerce platform with web frontend and API backend',
      url: 'https://dev.azure.com/mockorg/E-Commerce%20Platform',
      state: 'wellFormed',
      visibility: 'private',
      lastUpdateTime: '2024-01-15T10:30:00Z'
    },
    {
      id: '87654321-4321-4321-4321-210987654321',
      name: 'Mobile App Backend',
      description: 'REST API services for mobile applications',
      url: 'https://dev.azure.com/mockorg/Mobile%20App%20Backend',
      state: 'wellFormed',
      visibility: 'private',
      lastUpdateTime: '2024-01-14T15:45:00Z'
    },
    {
      id: '11111111-2222-3333-4444-555555555555',
      name: 'Data Analytics Pipeline',
      description: 'ETL and data processing workflows',
      url: 'https://dev.azure.com/mockorg/Data%20Analytics%20Pipeline',
      state: 'wellFormed',
      visibility: 'private',
      lastUpdateTime: '2024-01-13T09:15:00Z'
    }
  ];

  private static mockPipelines: { [projectName: string]: Pipeline[] } = {
    'E-Commerce Platform': [
      {
        id: 1001,
        name: 'Frontend Build & Deploy',
        url: 'https://dev.azure.com/mockorg/E-Commerce%20Platform/_build?definitionId=1001',
        queueStatus: 'enabled'
      },
      {
        id: 1002,
        name: 'API Service Pipeline',
        url: 'https://dev.azure.com/mockorg/E-Commerce%20Platform/_build?definitionId=1002',
        queueStatus: 'enabled'
      },
      {
        id: 1003,
        name: 'Database Migration',
        url: 'https://dev.azure.com/mockorg/E-Commerce%20Platform/_build?definitionId=1003',
        queueStatus: 'enabled'
      }
    ],
    'Mobile App Backend': [
      {
        id: 2001,
        name: 'User Service API',
        url: 'https://dev.azure.com/mockorg/Mobile%20App%20Backend/_build?definitionId=2001',
        queueStatus: 'enabled'
      },
      {
        id: 2002,
        name: 'Payment Service API',
        url: 'https://dev.azure.com/mockorg/Mobile%20App%20Backend/_build?definitionId=2002',
        queueStatus: 'enabled'
      }
    ],
    'Data Analytics Pipeline': [
      {
        id: 3001,
        name: 'ETL Data Processing',
        url: 'https://dev.azure.com/mockorg/Data%20Analytics%20Pipeline/_build?definitionId=3001',
        queueStatus: 'enabled'
      },
      {
        id: 3002,
        name: 'ML Model Training',
        url: 'https://dev.azure.com/mockorg/Data%20Analytics%20Pipeline/_build?definitionId=3002',
        queueStatus: 'enabled'
      }
    ]
  };

  private static generateMockBuilds(pipelineId: number, count: number = 10, projectName?: string): Build[] {
    const builds: Build[] = [];
    const now = new Date();
    
    for (let i = 0; i < count; i++) {
      const buildDate = new Date(now.getTime() - (i * 6 * 60 * 60 * 1000)); // 6 hours apart
      const startTime = new Date(buildDate.getTime() + (10 * 60 * 1000)); // start 10 min after queue
      const finishTime = new Date(startTime.getTime() + (Math.random() * 20 + 5) * 60 * 1000); // 5-25 min duration
      
      // Vary the results for realistic data
      const results = ['succeeded', 'failed', 'partiallySucceeded'];
      const reasons = ['IndividualCI', 'Manual'];
      const branches = ['refs/heads/main', 'refs/heads/develop'];
      
      const status = i === 0 && Math.random() > 0.7 ? 'inProgress' : 'completed';
      const result = status === 'inProgress' ? undefined : results[Math.floor(Math.random() * results.length)];
      
      builds.push({
        id: 10000 + pipelineId * 100 + i,
        buildNumber: `${pipelineId}.${new Date().getFullYear()}.${(count - i).toString().padStart(2, '0')}`,
        status: status,
        result: result,
        queueTime: buildDate.toISOString(),
        startTime: startTime.toISOString(),
        finishTime: status === 'completed' ? finishTime.toISOString() : undefined,
        url: `https://dev.azure.com/mockorg/_build/results?buildId=${10000 + pipelineId * 100 + i}`,
        sourceBranch: branches[Math.floor(Math.random() * branches.length)],
        reason: reasons[Math.floor(Math.random() * reasons.length)],
        tags: Math.random() > 0.8 ? ['hotfix'] : Math.random() > 0.4 ? [`Xen${Math.floor(Math.random() * 200) + 100}`] : [],
        definition: {
          id: pipelineId,
          name: `Pipeline ${pipelineId}`
        },
        project: {
          id: `proj-${pipelineId}`,
          name: projectName || 'Mock Project'
        }
      });
    }
    
    return builds;
  }

  private static generateMockDeployedBuild(pipelineId: number, environment: DeploymentEnvironment): DeployedBuild | null {
    // Some pipelines don't have deployments to all environments
    if (Math.random() > 0.8) return null;
    
    const now = new Date();
    const deployDate = new Date(now.getTime() - (Math.random() * 24 * 60 * 60 * 1000)); // Within last 24 hours
    const finishTime = new Date(deployDate.getTime() + (Math.random() * 15 + 5) * 60 * 1000); // 5-20 min deploy time
    
    const results = ['succeeded', 'failed', 'partiallySucceeded'];
    const result = results[Math.floor(Math.random() * results.length)];
    
    return {
      id: 20000 + pipelineId * 10 + environment,
      buildNumber: `${pipelineId}.${new Date().getFullYear()}.${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`,
      status: 'completed',
      result: result,
      startTime: deployDate.toISOString(),
      finishTime: finishTime.toISOString(),
      environment: environment,
      url: `https://dev.azure.com/mockorg/_build/results?buildId=${20000 + pipelineId * 10 + environment}`,
      sourceBranch: 'refs/heads/main'
    };
  }

  private static generateMockTimeline(buildId: number): BuildTimeline {
    const stages = [
      'Build',
      'Test',
      'Code Analysis',
      'Package',
      'Deploy to Dev',
      'Integration Tests',
      'Deploy to Staging'
    ];
    
    const records: TimelineRecord[] = [];
    let currentTime = new Date();
    
    const results = ['succeeded', 'failed', 'skipped'];
    const availableResults = results; // Use the array for selection logic
    
    stages.forEach((stageName, index) => {
      const startTime = new Date(currentTime.getTime() + (index * 2 * 60 * 1000)); // 2 min apart
      const duration = Math.random() * 5 + 1; // 1-6 minutes
      const finishTime = new Date(startTime.getTime() + (duration * 60 * 1000));
      
      // Most stages succeed, some might be skipped, rarely failed
      let result = availableResults[0]; // Start with 'succeeded'
      if (Math.random() > 0.9) result = availableResults[2]; // 'skipped'
      else if (Math.random() > 0.95) result = availableResults[1]; // 'failed'
      
      records.push({
        id: `stage-${index}`,
        name: stageName,
        type: 'Stage',
        state: 'completed',
        result: result,
        startTime: startTime.toISOString(),
        finishTime: finishTime.toISOString(),
        percentComplete: 100
      });
    });
    
    return {
      id: `timeline-${buildId}`,
      records: records
    };
  }

  static async getProjects(organization: string): Promise<Project[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return this.mockProjects;
  }

  static async getPipelines(organization: string, project: string): Promise<Pipeline[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return this.mockPipelines[project] || [];
  }

  static async getBuilds(
    organization: string,
    project: string,
    pipelineId: number,
    count: number = 5,
    statusFilter: string = '',
    branch?: string,
    reasonFilter?: string
  ): Promise<Build[]> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    let builds = this.generateMockBuilds(pipelineId, count, project);
    
    // Apply filters
    if (branch && branch !== '') {
      builds = builds.filter(build => build.sourceBranch.includes(branch.replace('refs/heads/', '')));
    }
    
    if (reasonFilter && reasonFilter !== '') {
      builds = builds.filter(build => build.reason === reasonFilter);
    }
    
    return builds;
  }

  static async getLatestDeployedBuild(
    organization: string,
    project: string,
    pipelineId: number,
    environment: DeploymentEnvironment
  ): Promise<DeployedBuild | null> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return this.generateMockDeployedBuild(pipelineId, environment);
  }

  static async getBuildTimeline(
    organization: string,
    project: string,
    buildId: number,
    type?: string,
    state?: string
  ): Promise<BuildTimeline | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return this.generateMockTimeline(buildId);
  }

  static async testApiConnectivity(): Promise<boolean> {
    // Mock always returns true for connectivity
    await new Promise(resolve => setTimeout(resolve, 100));
    return true;
  }

  static async getJiraIssue(issueKey: string): Promise<JiraIssue | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Mock different responses based on issue key for testing
    const issueNumber = parseInt(issueKey.replace(/^Xen-/i, ''), 10);
    
    // Return null for some keys to simulate non-existent issues
    if (issueNumber % 23 === 0) {
      return null;
    }
    
    // Determine status based on issue number - ensuring good variety for demo
    let status: string;
    let priority: string;
    let assignee: string;
    
    if (issueNumber % 5 === 0) {
      status = 'Done';
      priority = 'High';
      assignee = 'John Doe';
    } else if (issueNumber % 3 === 0) {
      status = 'In Progress';
      priority = 'Medium';
      assignee = 'Jane Smith';
    } else if (issueNumber % 7 === 0) {
      status = 'In Review';
      priority = 'Low';
      assignee = 'Bob Wilson';
    } else if (issueNumber % 11 === 0) {
      status = 'Ready for Test';
      priority = 'High';
      assignee = 'Alice Brown';
    } else {
      status = 'To Do';
      priority = 'Medium';
      assignee = 'Charlie Davis';
    }
    
    return {
      id: `${issueNumber}`,
      key: issueKey,
      fields: {
        status: { name: status },
        summary: `Mock Jira issue: ${status === 'Done' ? 'Completed feature' : 'Feature development'} for ${issueKey}`,
        assignee: assignee,
        priority: priority
      }
    };
  }
}