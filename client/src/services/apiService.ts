import axios from 'axios';
import { Project, Pipeline, Build, DeploymentEnvironment, DeployedBuild, BuildTimeline } from '../models/types';
import { MockApiService } from './mockApiService';

const API_BASE_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:5031/api' : '');

// Log API URL for debugging
console.log('API Base URL:', API_BASE_URL);
if (!API_BASE_URL) {
  console.error('API Base URL is empty! This will cause API calls to fail.');
}

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag to enable mock data when real API is unavailable
const USE_MOCK_WHEN_UNAVAILABLE = true;

export class ApiService {
  static async testApiConnectivity(): Promise<boolean> {
    try {
      // Test basic connectivity to the API
      const response = await apiClient.get('/projects', { timeout: 5000 });
      return response.status === 200;
    } catch (error: any) {
      console.error('API connectivity test failed:', error);
      console.log('Error details:', {
        code: error.code,
        message: error.message,
        response: error.response,
        status: error.response?.status
      });
      
      // If mock data is enabled, return true so components can proceed and use mock data
      if (USE_MOCK_WHEN_UNAVAILABLE) {
        console.log('Real API unavailable, but mock data is available');
        return true;
      }
      
      return false;
    }
  }

  static async getProjects(organization: string): Promise<Project[]> {
    try {
      const response = await apiClient.get<Project[]>(`/projects`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      
      // Use mock data if enabled and real API is unavailable
      if (USE_MOCK_WHEN_UNAVAILABLE) {
        console.log('Real API unavailable, using mock data for projects');
        return MockApiService.getProjects(organization);
      }
      
      // Provide more specific error messages
      if (error.code === 'ECONNABORTED' || error.code === 'NETWORK_ERROR') {
        throw new Error('Cannot connect to Azure DevOps API. Please check if the backend service is running.');
      }
      if (error.response?.status === 404) {
        throw new Error('API endpoint not found. Please check the backend service configuration.');
      }
      if (error.response?.status >= 500) {
        throw new Error('Azure DevOps API server error. Please try again later.');
      }
      if (!navigator.onLine) {
        throw new Error('No internet connection. Please check your network.');
      }
      
      throw new Error(`Failed to fetch projects: ${error.message || 'Unknown error'}`);
    }
  }

  static async getPipelines(organization: string, project: string): Promise<Pipeline[]> {
    try {
      const response = await apiClient.get<Pipeline[]>(`/pipelines?project=${encodeURIComponent(project)}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching pipelines:', error);
      
      // Use mock data if enabled and real API is unavailable
      if (USE_MOCK_WHEN_UNAVAILABLE) {
        console.log('Real API unavailable, using mock data for pipelines');
        return MockApiService.getPipelines(organization, project);
      }
      
      // Provide more specific error messages
      if (error.code === 'ECONNABORTED' || error.code === 'NETWORK_ERROR') {
        throw new Error('Cannot connect to Azure DevOps API. Please check if the backend service is running.');
      }
      if (error.response?.status === 404) {
        throw new Error('Pipelines API endpoint not found. Please check the backend service configuration.');
      }
      if (error.response?.status >= 500) {
        throw new Error('Azure DevOps API server error. Please try again later.');
      }
      if (!navigator.onLine) {
        throw new Error('No internet connection. Please check your network.');
      }
      
      throw new Error(`Failed to fetch pipelines: ${error.message || 'Unknown error'}`);
    }
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
    try {
      let url = `/builds/${pipelineId}?project=${encodeURIComponent(project)}&count=${count}`;
      if (statusFilter) {
        url += `&statusFilter=${statusFilter}`;
      }
      if (branch !== undefined && branch !== '') {
        url += `&branch=${encodeURIComponent(branch)}`;
      }
      if (reasonFilter !== undefined && reasonFilter !== '') {
        url += `&reasonFilter=${encodeURIComponent(reasonFilter)}`;
      }

      console.log(`API call to ${url}`);

      // Add request timeout for debugging
      const response = await apiClient.get<Build[]>(url, { 
        timeout: 10000,  // 10 second timeout for debugging
        headers: { 'Cache-Control': 'no-cache' } // Prevent caching
      });

      if (!response || !response.data) {
        console.error('API response is empty or invalid');
        return [];
      }

      console.log(`Build API response:`, response.data);
      console.log(`Build API response length:`, response.data.length);

      // Additional validation of the response data
      if (Array.isArray(response.data)) {
        console.log('Response is an array as expected');
      } else {
        console.error('Response is not an array:', typeof response.data);
      }

      return response.data;
    } catch (error: any) {
      console.error('Error fetching builds:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      
      // Use mock data if enabled and real API is unavailable
      if (USE_MOCK_WHEN_UNAVAILABLE) {
        console.log('Real API unavailable, using mock data for builds');
        return MockApiService.getBuilds(organization, project, pipelineId, count, statusFilter, branch, reasonFilter);
      }
      
      // Provide more specific error messages
      if (error.code === 'ECONNABORTED' || error.code === 'NETWORK_ERROR') {
        throw new Error('Cannot connect to Azure DevOps API. Please check if the backend service is running.');
      }
      if (error.response?.status === 404) {
        throw new Error('Builds API endpoint not found. Please check the backend service configuration.');
      }
      if (error.response?.status >= 500) {
        throw new Error('Azure DevOps API server error. Please try again later.');
      }
      if (!navigator.onLine) {
        throw new Error('No internet connection. Please check your network.');
      }
      
      throw new Error(`Failed to fetch builds: ${error.message || 'Unknown error'}`);
    }
  }

  static async getDeployedBuilds(
    organization: string,
    project: string,
    pipelineId: number,
    environment: DeploymentEnvironment
  ): Promise<DeployedBuild[]> {
    try {
      // Convert environment enum to string name
      const environmentName = DeploymentEnvironment[environment];
      console.log(`Fetching deployed builds for pipeline ${pipelineId} in environment ${environmentName}`);
      
      // First, try the direct endpoint for the latest deployed build
      try {
        const response = await apiClient.get<any>(
          `/deployedbuilds/${pipelineId}/${environmentName}?project=${encodeURIComponent(project)}`
        );
        
        console.log('Deployed builds API response:', response.data);
        
        // If the API returns a build, convert it to our DeployedBuild format
        if (response.data && response.data.id) {
          const build: DeployedBuild = {
            id: response.data.id,
            buildNumber: response.data.buildNumber,
            status: response.data.status,
            result: response.data.result,
            startTime: response.data.startTime,
            finishTime: response.data.finishTime,
            environment: environment,
            url: response.data.url,
            sourceBranch: response.data.sourceBranch
          };
          
          return [build];
        }
        
        return [];
      } catch (error) {
        console.error('Error fetching deployed builds:', error);
        return [];
      }
    } catch (error) {
      console.error('Error in getDeployedBuilds:', error);
      throw new Error('Failed to fetch deployed builds');
    }
  }

  static async getLatestDeployedBuild(
    organization: string,
    project: string,
    pipelineId: number,
    environment: DeploymentEnvironment
  ): Promise<DeployedBuild | null> {
    try {
      // Directly fetch the build from the controller endpoint
      const environmentName = DeploymentEnvironment[environment];
      console.log(`Fetching deployed build for pipeline ${pipelineId} in environment ${environmentName}`);
      
      try {
        const response = await apiClient.get<any>(
          `/deployedbuilds/${pipelineId}/${environmentName}?project=${encodeURIComponent(project)}`
        );
        
        console.log('Raw API response for deployed build:', response.data);
        
        // If the API returns a valid build, convert it to DeployedBuild format
        if (response.data && response.data.id) {
          const build: DeployedBuild = {
            id: response.data.id,
            buildNumber: response.data.buildNumber,
            status: response.data.status,
            result: response.data.result,
            startTime: response.data.startTime,
            finishTime: response.data.finishTime,
            environment: environment,
            url: response.data.url,
            sourceBranch: response.data.sourceBranch
          };
          
          console.log('Converted build:', build);
          return build;
        }
        
        console.log('No valid build data found in API response');
        return null;
      } catch (error: any) {
        // If the error is 404 Not Found, that's expected when no build exists
        if (error.response && error.response.status === 404) {
          console.log(`No deployed build found for pipeline ${pipelineId} in ${environmentName}`);
          return null;
        }
        
        // Use mock data if enabled and real API is unavailable
        if (USE_MOCK_WHEN_UNAVAILABLE) {
          console.log('Real API unavailable, using mock data for deployed build');
          return MockApiService.getLatestDeployedBuild(organization, project, pipelineId, environment);
        }
        
        // For other errors, log them and return null
        console.error('Error fetching latest deployed build:', error);
        return null;
      }
    } catch (error) {
      console.error('Error in getLatestDeployedBuild:', error);
      
      // Use mock data if enabled and real API is unavailable
      if (USE_MOCK_WHEN_UNAVAILABLE) {
        console.log('Real API unavailable, using mock data for deployed build (outer catch)');
        return MockApiService.getLatestDeployedBuild(organization, project, pipelineId, environment);
      }
      
      return null;
    }
  }

  static async getLatestBuild(
    organization: string,
    project: string,
    pipelineId: number
  ): Promise<Build | null> {
    try {
      const builds = await this.getBuilds(organization, project, pipelineId, 1);
      return builds.length > 0 ? builds[0] : null;
    } catch (error) {
      console.error('Error fetching latest build:', error);
      return null;
    }
  }

  static async getBuildTimeline(
    organization: string,
    project: string,
    buildId: number,
    type?: string,
    state?: string
  ): Promise<BuildTimeline | null> {
    try {
      let url = `/buildtimeline/${buildId}?project=${encodeURIComponent(project)}`;
      
      if (type) {
        url += `&type=${encodeURIComponent(type)}`;
      }
      
      if (state) {
        url += `&state=${encodeURIComponent(state)}`;
      }
      
      console.log(`API call to get timeline: ${url}`);
      const response = await apiClient.get<BuildTimeline>(url);
      console.log(`Timeline API response for build ${buildId}:`, response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching build timeline:', error);
      
      // Use mock data if enabled and real API is unavailable
      if (USE_MOCK_WHEN_UNAVAILABLE) {
        console.log('Real API unavailable, using mock data for build timeline');
        return MockApiService.getBuildTimeline(organization, project, buildId, type, state);
      }
      
      return null;
    }
  }
}
