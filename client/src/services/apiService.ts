
import axios from 'axios';
import { Project, Pipeline, Build, DeploymentEnvironment, DeployedBuild, BuildTimeline } from '../models/types';
import { MockApiService } from './mockApiService';
import { appConfig } from '../config/appConfig';

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



export class ApiService {
  static async testApiConnectivity(): Promise<boolean> {
    if (appConfig.apiIsMocked) {
      return MockApiService.testApiConnectivity();
    }
    try {
      const response = await apiClient.get('/projects', { timeout: 5000 });
      return response.status === 200;
    } catch (error: any) {
      console.error('API connectivity test failed:', error);
      return false;
    }
  }

  static async getProjects(organization: string): Promise<Project[]> {
    if (appConfig.apiIsMocked) {
      return MockApiService.getProjects(organization);
    }
    const response = await apiClient.get<Project[]>(`/projects`);
    return response.data;
  }

  static async getPipelines(organization: string, project: string): Promise<Pipeline[]> {
    if (appConfig.apiIsMocked) {
      return MockApiService.getPipelines(organization, project);
    }
    const response = await apiClient.get<Pipeline[]>(`/pipelines?project=${encodeURIComponent(project)}`);
    return response.data;
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
    if (appConfig.apiIsMocked) {
      return MockApiService.getBuilds(organization, project, pipelineId, count, statusFilter, branch, reasonFilter);
    }
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
    const response = await apiClient.get<Build[]>(url, { 
      timeout: 10000,
      headers: { 'Cache-Control': 'no-cache' }
    });
    return response.data;
  }

  static async getDeployedBuilds(
    organization: string,
    project: string,
    pipelineId: number,
    environment: DeploymentEnvironment
  ): Promise<DeployedBuild[]> {
    if (appConfig.apiIsMocked) {
      // Not implemented in mock, but you can add if needed
      return [];
    }
    const environmentName = DeploymentEnvironment[environment];
    const response = await apiClient.get<any>(
      `/deployedbuilds/${pipelineId}/${environmentName}?project=${encodeURIComponent(project)}`
    );
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
  }

  static async getLatestDeployedBuild(
    organization: string,
    project: string,
    pipelineId: number,
    environment: DeploymentEnvironment
  ): Promise<DeployedBuild | null> {
    if (appConfig.apiIsMocked) {
      return MockApiService.getLatestDeployedBuild(organization, project, pipelineId, environment);
    }
    const environmentName = DeploymentEnvironment[environment];
    const response = await apiClient.get<any>(
      `/deployedbuilds/${pipelineId}/${environmentName}?project=${encodeURIComponent(project)}`
    );
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
      return build;
    }
    return null;
  }

  static async getLatestBuild(
    organization: string,
    project: string,
    pipelineId: number
  ): Promise<Build | null> {
    const builds = await this.getBuilds(organization, project, pipelineId, 1);
    return builds.length > 0 ? builds[0] : null;
  }

  static async getBuildTimeline(
    organization: string,
    project: string,
    buildId: number,
    type?: string,
    state?: string
  ): Promise<BuildTimeline | null> {
    if (appConfig.apiIsMocked) {
      return MockApiService.getBuildTimeline(organization, project, buildId, type, state);
    }
    let url = `/buildtimeline/${buildId}?project=${encodeURIComponent(project)}`;
    if (type) {
      url += `&type=${encodeURIComponent(type)}`;
    }
    if (state) {
      url += `&state=${encodeURIComponent(state)}`;
    }
    const response = await apiClient.get<BuildTimeline>(url);
    return response.data;
  }
}
