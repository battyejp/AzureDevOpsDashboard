import axios from 'axios';
import { Project, Pipeline, Build, DeploymentEnvironment, DeployedBuild } from '../models/types';

const API_BASE_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:5031/api' : '');

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export class ApiService {
  static async getProjects(organization: string): Promise<Project[]> {
    try {
      const response = await apiClient.get<Project[]>(`/projects`);
      return response.data;
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw new Error('Failed to fetch projects');
    }
  }

  static async getPipelines(organization: string, project: string): Promise<Pipeline[]> {
    try {
      const response = await apiClient.get<Pipeline[]>(`/pipelines?project=${encodeURIComponent(project)}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching pipelines:', error);
      throw new Error('Failed to fetch pipelines');
    }
  }

  static async getBuilds(
    organization: string,
    project: string,
    pipelineId: number,
    count: number = 5
  ): Promise<Build[]> {
    try {
      const response = await apiClient.get<Build[]>(
        `/builds/${pipelineId}?project=${encodeURIComponent(project)}&count=${count}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching builds:', error);
      throw new Error('Failed to fetch builds');
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
        
        // For other errors, log them and return null
        console.error('Error fetching latest deployed build:', error);
        return null;
      }
    } catch (error) {
      console.error('Error in getLatestDeployedBuild:', error);
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
}
