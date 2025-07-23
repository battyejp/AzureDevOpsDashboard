export interface Project {
  id: string;
  name: string;
  description?: string;
  url: string;
  state: string;
  visibility: string;
  lastUpdateTime: string;
}

export interface Pipeline {
  id: number;
  name: string;
  url: string;
  queueStatus: string;
}

export enum BuildStatus {
  None = 0,
  InProgress = 1,
  Completed = 2,
  Cancelling = 4,
  Postponed = 8,
  NotStarted = 32
}

export enum BuildResult {
  None = 0,
  Succeeded = 2,
  PartiallySucceeded = 4,
  Failed = 8,
  Canceled = 32
}

export interface Build {
  id: number;
  buildNumber: string;
  status: string;
  result?: string;
  queueTime: string;
  startTime?: string;
  finishTime?: string;
  url: string;
  sourceBranch: string;
  reason: string;
  tags: string[];
  definition: {
    id: number;
    name: string;
  };
  project: {
    id: string;
    name: string;
  };
}

export enum DeploymentEnvironment {
  Dev = 0,
  SIT = 1,
  UAT = 2,
  PPD = 3,
  Prod = 4
}

export interface DeployedBuild {
  id: number;
  buildNumber: string;
  status?: string;
  result?: string;
  finishTime?: string;
  startTime?: string;
  environment: DeploymentEnvironment;
  url: string;
  sourceBranch?: string;
}

export interface PipelineStatus {
  pipelineId: number;
  pipelineName: string;
  latestBuild?: Build;
  deployedBuild?: DeployedBuild;
  isLoading: boolean;
  error?: string;
}

export interface DashboardFilters {
  organization: string;
  project: string;
  environment: DeploymentEnvironment;
}

export interface TimelineRecord {
  id: string;
  parentId?: string;
  name: string;
  type: string;
  state: string;
  result?: string;
  startTime?: string;
  finishTime?: string;
  percentComplete?: number;
}

export interface BuildTimeline {
  id: string;
  records: TimelineRecord[];
}
