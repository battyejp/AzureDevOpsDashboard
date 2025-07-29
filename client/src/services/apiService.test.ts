import { ApiService } from './apiService';
import { MockApiService } from './mockApiService';
import { DeploymentEnvironment } from '../models/types';

// Mock MockApiService
jest.mock('./mockApiService');
const MockedMockApiService = MockApiService as jest.Mocked<typeof MockApiService>;

// Mock appConfig - define the mock implementation directly
jest.mock('../config/appConfig', () => ({
  appConfig: {
    apiIsMocked: false
  }
}));

// Import after mocking
import { appConfig } from '../config/appConfig';

describe('ApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (appConfig as any).apiIsMocked = false;
    
    // Reset console mocks
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('when API is mocked', () => {
    beforeEach(() => {
      (appConfig as any).apiIsMocked = true;
    });

    test('testApiConnectivity should use mock service', async () => {
      MockedMockApiService.testApiConnectivity.mockResolvedValue(true);

      const result = await ApiService.testApiConnectivity();

      expect(result).toBe(true);
      expect(MockedMockApiService.testApiConnectivity).toHaveBeenCalled();
    });

    test('getProjects should use mock service', async () => {
      const mockProjects = [
        { id: '1', name: 'Project 1', description: 'desc1', url: '', state: 'wellFormed', visibility: 'private', lastUpdateTime: '2023-01-01' }
      ];
      MockedMockApiService.getProjects.mockResolvedValue(mockProjects);

      const result = await ApiService.getProjects('test-org');

      expect(result).toEqual(mockProjects);
      expect(MockedMockApiService.getProjects).toHaveBeenCalledWith('test-org');
    });

    test('getPipelines should use mock service', async () => {
      const mockPipelines = [
        { id: 1, name: 'Pipeline 1', folder: '', url: '' }
      ];
      MockedMockApiService.getPipelines.mockResolvedValue(mockPipelines);

      const result = await ApiService.getPipelines('test-org', 'test-project');

      expect(result).toEqual(mockPipelines);
      expect(MockedMockApiService.getPipelines).toHaveBeenCalledWith('test-org', 'test-project');
    });

    test('getBuilds should use mock service', async () => {
      const mockBuilds = [
        { 
          id: 1, 
          buildNumber: '1.0.1', 
          status: 'completed', 
          result: 'succeeded', 
          startTime: '2023-01-01T10:00:00Z',
          finishTime: '2023-01-01T10:30:00Z',
          url: 'https://example.com/build/1',
          sourceBranch: 'refs/heads/main'
        }
      ];
      MockedMockApiService.getBuilds.mockResolvedValue(mockBuilds);

      const result = await ApiService.getBuilds('test-org', 'test-project', 1);

      expect(result).toEqual(mockBuilds);
      expect(MockedMockApiService.getBuilds).toHaveBeenCalledWith('test-org', 'test-project', 1, 5, '', undefined, undefined);
    });

    test('getLatestDeployedBuild should use mock service', async () => {
      const mockDeployedBuild = {
        id: 1,
        buildNumber: '1.0.1',
        status: 'completed',
        result: 'succeeded',
        startTime: '2023-01-01T10:00:00Z',
        finishTime: '2023-01-01T10:30:00Z',
        environment: DeploymentEnvironment.Dev,
        url: 'https://example.com/build/1',
        sourceBranch: 'refs/heads/main'
      };
      MockedMockApiService.getLatestDeployedBuild.mockResolvedValue(mockDeployedBuild);

      const result = await ApiService.getLatestDeployedBuild('test-org', 'test-project', 1, DeploymentEnvironment.Dev);

      expect(result).toEqual(mockDeployedBuild);
      expect(MockedMockApiService.getLatestDeployedBuild).toHaveBeenCalledWith('test-org', 'test-project', 1, DeploymentEnvironment.Dev);
    });

    test('getJiraIssue should use mock service', async () => {
      const mockJiraIssue = {
        id: 'PROJ-123',
        key: 'PROJ-123',
        summary: 'Test Issue',
        status: 'In Progress',
        assignee: 'John Doe',
        url: 'https://example.atlassian.net/browse/PROJ-123'
      };
      MockedMockApiService.getJiraIssue.mockResolvedValue(mockJiraIssue);

      const result = await ApiService.getJiraIssue('PROJ-123');

      expect(result).toEqual(mockJiraIssue);
      expect(MockedMockApiService.getJiraIssue).toHaveBeenCalledWith('PROJ-123');
    });

    test('getBuildTimeline should use mock service', async () => {
      const mockTimeline = {
        id: '1',
        changeId: 1,
        url: '',
        records: []
      };
      MockedMockApiService.getBuildTimeline.mockResolvedValue(mockTimeline);

      const result = await ApiService.getBuildTimeline('test-org', 'test-project', 1);

      expect(result).toEqual(mockTimeline);
      expect(MockedMockApiService.getBuildTimeline).toHaveBeenCalledWith('test-org', 'test-project', 1, undefined, undefined);
    });
  });

  describe('getLatestBuild', () => {
    test('should return latest build when builds exist', async () => {
      // We'll test the logic of getLatestBuild by using mocked mode
      (appConfig as any).apiIsMocked = true;
      
      const mockBuilds = [
        { id: 2, buildNumber: '1.0.2', status: 'completed', result: 'succeeded', startTime: '2023-01-02T10:00:00Z', finishTime: '2023-01-02T10:30:00Z', url: '', sourceBranch: 'main' },
        { id: 1, buildNumber: '1.0.1', status: 'completed', result: 'succeeded', startTime: '2023-01-01T10:00:00Z', finishTime: '2023-01-01T10:30:00Z', url: '', sourceBranch: 'main' }
      ];
      MockedMockApiService.getBuilds.mockResolvedValue(mockBuilds);

      const result = await ApiService.getLatestBuild('test-org', 'test-project', 1);

      expect(result).toEqual(mockBuilds[0]);
      expect(MockedMockApiService.getBuilds).toHaveBeenCalledWith('test-org', 'test-project', 1, 1, '', undefined, undefined);
    });

    test('should return null when no builds exist', async () => {
      (appConfig as any).apiIsMocked = true;
      MockedMockApiService.getBuilds.mockResolvedValue([]);

      const result = await ApiService.getLatestBuild('test-org', 'test-project', 1);

      expect(result).toBeNull();
    });
  });

  describe('when API is not mocked', () => {
    beforeEach(() => {
      (appConfig as any).apiIsMocked = false;
    });

    test('should handle API errors gracefully in testApiConnectivity', async () => {
      // This test will actually try to make a real API call which will fail
      // due to no backend running, which is what we want to test
      const result = await ApiService.testApiConnectivity();

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('API connectivity test failed:', expect.any(Error));
    });
  });
});