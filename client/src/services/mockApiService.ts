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
    },
    {
      id: '22222222-3333-4444-5555-666666666666',
      name: 'Customer Portal',
      description: 'Customer-facing web portal and API services',
      url: 'https://dev.azure.com/mockorg/Customer%20Portal',
      state: 'wellFormed',
      visibility: 'private',
      lastUpdateTime: '2024-01-16T14:20:00Z'
    },
    {
      id: '33333333-4444-5555-6666-777777777777',
      name: 'DevOps Infrastructure',
      description: 'Infrastructure as Code and DevOps automation tools',
      url: 'https://dev.azure.com/mockorg/DevOps%20Infrastructure',
      state: 'wellFormed',
      visibility: 'private',
      lastUpdateTime: '2024-01-17T08:45:00Z'
    },
    {
      id: '44444444-5555-6666-7777-888888888888',
      name: 'Reporting Services',
      description: 'Business intelligence and reporting platform',
      url: 'https://dev.azure.com/mockorg/Reporting%20Services',
      state: 'wellFormed',
      visibility: 'private',
      lastUpdateTime: '2024-01-18T11:30:00Z'
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
      },
      {
        id: 1004,
        name: 'Product Catalog Service',
        url: 'https://dev.azure.com/mockorg/E-Commerce%20Platform/_build?definitionId=1004',
        queueStatus: 'enabled'
      },
      {
        id: 1005,
        name: 'Shopping Cart Service',
        url: 'https://dev.azure.com/mockorg/E-Commerce%20Platform/_build?definitionId=1005',
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
      },
      {
        id: 2003,
        name: 'Notification Service',
        url: 'https://dev.azure.com/mockorg/Mobile%20App%20Backend/_build?definitionId=2003',
        queueStatus: 'enabled'
      },
      {
        id: 2004,
        name: 'Authentication Service',
        url: 'https://dev.azure.com/mockorg/Mobile%20App%20Backend/_build?definitionId=2004',
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
      },
      {
        id: 3003,
        name: 'Data Warehouse Sync',
        url: 'https://dev.azure.com/mockorg/Data%20Analytics%20Pipeline/_build?definitionId=3003',
        queueStatus: 'enabled'
      },
      {
        id: 3004,
        name: 'Reporting Dashboard',
        url: 'https://dev.azure.com/mockorg/Data%20Analytics%20Pipeline/_build?definitionId=3004',
        queueStatus: 'enabled'
      }
    ],
    'Customer Portal': [
      {
        id: 4001,
        name: 'Portal Frontend',
        url: 'https://dev.azure.com/mockorg/Customer%20Portal/_build?definitionId=4001',
        queueStatus: 'enabled'
      },
      {
        id: 4002,
        name: 'Customer API Gateway',
        url: 'https://dev.azure.com/mockorg/Customer%20Portal/_build?definitionId=4002',
        queueStatus: 'enabled'
      },
      {
        id: 4003,
        name: 'Support Ticket System',
        url: 'https://dev.azure.com/mockorg/Customer%20Portal/_build?definitionId=4003',
        queueStatus: 'enabled'
      },
      {
        id: 4004,
        name: 'Knowledge Base Service',
        url: 'https://dev.azure.com/mockorg/Customer%20Portal/_build?definitionId=4004',
        queueStatus: 'enabled'
      },
      {
        id: 4005,
        name: 'Live Chat Integration',
        url: 'https://dev.azure.com/mockorg/Customer%20Portal/_build?definitionId=4005',
        queueStatus: 'enabled'
      }
    ],
    'DevOps Infrastructure': [
      {
        id: 5001,
        name: 'Terraform Infrastructure',
        url: 'https://dev.azure.com/mockorg/DevOps%20Infrastructure/_build?definitionId=5001',
        queueStatus: 'enabled'
      },
      {
        id: 5002,
        name: 'Monitoring Setup',
        url: 'https://dev.azure.com/mockorg/DevOps%20Infrastructure/_build?definitionId=5002',
        queueStatus: 'enabled'
      },
      {
        id: 5003,
        name: 'Security Scanning',
        url: 'https://dev.azure.com/mockorg/DevOps%20Infrastructure/_build?definitionId=5003',
        queueStatus: 'enabled'
      },
      {
        id: 5004,
        name: 'Backup & Recovery',
        url: 'https://dev.azure.com/mockorg/DevOps%20Infrastructure/_build?definitionId=5004',
        queueStatus: 'enabled'
      }
    ],
    'Reporting Services': [
      {
        id: 6001,
        name: 'PowerBI Integration',
        url: 'https://dev.azure.com/mockorg/Reporting%20Services/_build?definitionId=6001',
        queueStatus: 'enabled'
      },
      {
        id: 6002,
        name: 'Report Generation Engine',
        url: 'https://dev.azure.com/mockorg/Reporting%20Services/_build?definitionId=6002',
        queueStatus: 'enabled'
      },
      {
        id: 6003,
        name: 'Data Export Service',
        url: 'https://dev.azure.com/mockorg/Reporting%20Services/_build?definitionId=6003',
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
      
      // More varied results for realistic data - note that actual result assignment is done below
      const reasons = ['IndividualCI', 'Manual', 'Scheduled', 'PullRequest', 'BatchedCI'];
      // More diverse branch patterns
      const branches = [
        'refs/heads/main', 
        'refs/heads/develop', 
        'refs/heads/feature/payment-integration',
        'refs/heads/feature/user-authentication',
        'refs/heads/hotfix/security-patch',
        'refs/heads/release/2024.1',
        'refs/heads/feature/mobile-api',
        'refs/heads/bugfix/data-validation'
      ];
      
      const status = i === 0 && Math.random() > 0.7 ? 'inProgress' : 'completed';
      // Better distribution of results - more successes, some failures
      let result: string | undefined;
      if (status === 'inProgress') {
        result = undefined;
      } else {
        const rand = Math.random();
        if (rand < 0.75) result = 'succeeded';        // 75% success rate
        else if (rand < 0.9) result = 'partiallySucceeded'; // 15% partial
        else result = 'failed';                        // 10% failure
      }
      
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
    // Ensure much better deployment coverage - only 20% chance of no deployment instead of 80%
    // Different pipelines have different deployment patterns
    const deploymentChance = this.getDeploymentChance(pipelineId, environment);
    
    if (Math.random() > deploymentChance) return null;
    
    const now = new Date();
    const deployDate = new Date(now.getTime() - (Math.random() * 24 * 60 * 60 * 1000)); // Within last 24 hours
    const finishTime = new Date(deployDate.getTime() + (Math.random() * 15 + 5) * 60 * 1000); // 5-20 min deploy time
    
    const results = ['succeeded', 'failed', 'partiallySucceeded'];
    // Better success rate for deployments - using explicit logic instead of array
    const rand = Math.random();
    let result: string;
    if (rand < 0.85) result = results[0];        // 85% success rate
    else if (rand < 0.95) result = results[2]; // 10% partial
    else result = results[1];                        // 5% failure
    
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

  private static getDeploymentChance(pipelineId: number, environment: DeploymentEnvironment): number {
    // Different deployment patterns based on pipeline type and environment
    // Infrastructure and critical services deploy to all environments
    // Some services might not deploy to production yet
    
    switch (environment) {
      case DeploymentEnvironment.Dev:
        return 0.95; // 95% of pipelines deploy to Dev
      case DeploymentEnvironment.SIT:
        return 0.85; // 85% deploy to SIT  
      case DeploymentEnvironment.UAT:
        return 0.75; // 75% deploy to UAT
      case DeploymentEnvironment.PPD:
        return 0.65; // 65% deploy to Pre-Prod
      case DeploymentEnvironment.Prod:
        // Production deployments vary by pipeline type
        // Infrastructure and core services more likely to be in prod
        if (pipelineId >= 5000) return 0.8; // Infrastructure pipelines
        if (pipelineId >= 1000 && pipelineId < 2000) return 0.7; // E-commerce platform  
        return 0.5; // Other services 50% chance
      default:
        return 0.8;
    }
  }

  private static generateMockTimeline(buildId: number): BuildTimeline {
    // More varied stages based on build type
    const stageVariations = [
      ['Build', 'Test', 'Code Analysis', 'Package', 'Deploy to Dev'],
      ['Build', 'Unit Tests', 'Integration Tests', 'Code Analysis', 'Package', 'Deploy to Dev', 'Smoke Tests'],
      ['Build', 'Test', 'Security Scan', 'Package', 'Deploy to Dev', 'Integration Tests'],
      ['Build', 'Test', 'Code Analysis', 'Package', 'Deploy to Dev', 'Deploy to Staging', 'End-to-End Tests'],
      ['Restore', 'Build', 'Test', 'Code Analysis', 'Package', 'Publish Artifacts', 'Deploy to Dev']
    ];
    
    const stages = stageVariations[buildId % stageVariations.length];
    
    const records: TimelineRecord[] = [];
    let currentTime = new Date();
    
    const results = ['succeeded', 'failed', 'skipped'];
    
    stages.forEach((stageName, index) => {
      const startTime = new Date(currentTime.getTime() + (index * 2 * 60 * 1000)); // 2 min apart
      const duration = Math.random() * 5 + 1; // 1-6 minutes
      const finishTime = new Date(startTime.getTime() + (duration * 60 * 1000));
      
      // Most stages succeed, some might be skipped, rarely failed
      // Better distribution with more successes
      let result = results[0]; // Start with 'succeeded'
      const rand = Math.random();
      if (rand > 0.95) result = results[1]; // 5% 'failed'
      else if (rand > 0.85) result = results[2]; // 10% 'skipped'
      
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