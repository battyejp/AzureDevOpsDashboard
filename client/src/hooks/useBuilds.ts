import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiService } from '../services/apiService';
import { ConfigService } from '../services/configService';
import { Project, Pipeline, Build, BuildTimeline, DeploymentEnvironment } from '../models/types';
import { appConfig } from '../config/appConfig';
import { extractJiraIssueKey } from '../utils/jiraUtils';
import { useJira } from './useJira';

interface UseBuildsOptions {
  environment?: DeploymentEnvironment;
  autoLoadTimelines?: boolean;
  autoLoadJira?: boolean;
}

export const useBuilds = (options: UseBuildsOptions = {}) => {
  const {
    environment,
    autoLoadTimelines = true,
    autoLoadJira = true
  } = options;

  const [organization] = useState<string>(appConfig.azureDevOpsOrganization);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedPipeline, setSelectedPipeline] = useState<number | ''>('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [builds, setBuilds] = useState<Build[]>([]);
  const [buildTimelines, setBuildTimelines] = useState<Map<number, BuildTimeline>>(new Map());
  const [timelineLoading, setTimelineLoading] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [branchFilter, setBranchFilter] = useState<string>('');
  const [reasonFilter, setReasonFilter] = useState<string>('');

  // Use refs to track loading/loaded state to prevent race conditions
  const loadedTimelinesRef = useRef<Set<number>>(new Set());
  const loadingTimelinesRef = useRef<Set<number>>(new Set());

  // Use shared Jira hook
  const { jiraIssues, jiraLoading, loadJiraIssue } = useJira();

  // Helper to get correct branch value for API
  const getApiBranch = (branch: string) => {
    if (!branch) return '';
    if (branch.startsWith('refs/')) return branch;
    return `refs/heads/${branch}`;
  };

  // Load timeline for a specific build (memoized to avoid changing on every render)
  const loadBuildTimeline = useCallback(async (build: Build) => {
    console.log(`[loadBuildTimeline] Called for build ${build.id}, loaded=${loadedTimelinesRef.current.has(build.id)}, loading=${loadingTimelinesRef.current.has(build.id)}`);

    // Use refs to prevent race conditions - check and set atomically
    if (loadedTimelinesRef.current.has(build.id) || loadingTimelinesRef.current.has(build.id)) {
      console.log(`[loadBuildTimeline] SKIP - Build ${build.id} already loaded/loading`);
      return; // Already loaded or loading
    }

    // Mark as loading immediately in ref (before async operation)
    loadingTimelinesRef.current.add(build.id);
    console.log(`[loadBuildTimeline] START - Loading timeline for build ${build.id}`);

    try {
      // Also update state for UI
      setTimelineLoading(prev => new Set(prev).add(build.id));
      const timeline = await ApiService.getBuildTimeline(
        organization,
        selectedProject,
        build.id,
        'Stage' // Only fetch Stage records, we'll filter out skipped ones in the frontend
      );
      if (timeline) {
        console.log(`[loadBuildTimeline] SUCCESS - Got timeline for build ${build.id}`);
        setBuildTimelines(prev => new Map(prev).set(build.id, timeline));
        loadedTimelinesRef.current.add(build.id);
      } else {
        console.log(`[loadBuildTimeline] NO DATA - No timeline data for build ${build.id}`);
      }
    } catch (err) {
      console.error(`[loadBuildTimeline] ERROR - Error loading timeline for build ${build.id}:`, err);
    } finally {
      // Remove from loading sets
      loadingTimelinesRef.current.delete(build.id);
      setTimelineLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(build.id);
        return newSet;
      });
      console.log(`[loadBuildTimeline] DONE - Build ${build.id} complete, in loaded set=${loadedTimelinesRef.current.has(build.id)}`);
    }
  }, [organization, selectedProject]);

  // Load projects on component mount
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        setError('');

        // Test API connectivity first
        const isConnected = await ApiService.testApiConnectivity();
        if (!isConnected) {
          setError('Cannot connect to the Azure DevOps API backend. Please ensure the backend service is running and accessible.');
          setLoading(false);
          return;
        }
        
        const projectData = await ApiService.getProjects(organization);
        setProjects(projectData);
        
        // Auto-select default project from configuration, or first project if available
        if (projectData.length > 0) {
          const defaultProject = ConfigService.getDefaultProject();
          const projectToSelect = defaultProject && projectData.find(p => p.name === defaultProject)
            ? defaultProject
            : projectData[0].name;
          setSelectedProject(projectToSelect);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load projects');
        console.error('Error loading projects:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, [organization]);

  // Load pipelines when project changes
  useEffect(() => {
    const loadPipelines = async () => {
      if (!selectedProject) return;

      try {
        setLoading(true);
        const allPipelines = await ApiService.getPipelines(organization, selectedProject);
        
        // Apply pipeline filtering based on user configuration
        const filteredPipelines = allPipelines.filter(pipeline => 
          ConfigService.isPipelineVisible(selectedProject, pipeline.id)
        );
        
        setPipelines(filteredPipelines);
        
        // Reset selected pipeline and builds
        setSelectedPipeline('');
        setBuilds([]);
        
        // Auto-select first pipeline if available
        if (filteredPipelines.length > 0) {
          setSelectedPipeline(filteredPipelines[0].id);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load pipelines');
        console.error('Error loading pipelines:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPipelines();
  }, [organization, selectedProject]);

  // Load builds when pipeline changes
  useEffect(() => {
    const loadBuilds = async () => {
      if (!selectedProject || !selectedPipeline) {
        console.log('Not loading builds - project or pipeline not selected');
        return;
      }

      try {
        setLoading(true);
        setError(''); // Clear previous errors
        console.log(`Loading builds for pipeline ${selectedPipeline} in project ${selectedProject} with branch ${branchFilter} and reason ${reasonFilter}`);

        let buildData: Build[];
        
        if (environment !== undefined) {
          // Load deployed builds for specific environment
          const deployedBuild = await ApiService.getLatestDeployedBuild(
            organization,
            selectedProject,
            Number(selectedPipeline),
            environment
          );
          // Convert DeployedBuild to Build format for compatibility
          buildData = deployedBuild ? [{
            ...deployedBuild,
            status: deployedBuild.status || 'completed',
            queueTime: deployedBuild.startTime || '',
            reason: 'Deployment',
            tags: [],
            definition: { id: Number(selectedPipeline), name: `Pipeline ${selectedPipeline}` },
            project: { id: `proj-${selectedPipeline}`, name: selectedProject }
          } as Build] : [];
        } else {
          // Load regular builds
          buildData = await ApiService.getBuilds(
            organization,
            selectedProject,
            Number(selectedPipeline),
            20, // Get more builds for the table view
            'all', // Include in-progress builds
            getApiBranch(branchFilter),
            reasonFilter === '' ? undefined : reasonFilter
          );
        }

        console.log(`Loaded ${buildData ? buildData.length : 0} builds:`, buildData);

        if (!buildData || buildData.length === 0) {
          console.warn('No builds returned from API');
        }

        setBuilds(buildData || []);
        // Clear previous timelines when builds change
        setBuildTimelines(new Map());
        setTimelineLoading(new Set());
        // Clear refs to allow reloading for new builds
        loadedTimelinesRef.current.clear();
        loadingTimelinesRef.current.clear();
      } catch (err: any) {
        const errorMessage = err?.message || 'Unknown error';
        setError(errorMessage);
        console.error('Error loading builds:', err);
        setBuilds([]); // Reset builds on error
      } finally {
        setLoading(false);
      }
    };

    loadBuilds();
  }, [organization, selectedProject, selectedPipeline, branchFilter, reasonFilter, environment]);

  // Auto-load timelines for all builds when builds change
  useEffect(() => {
    if (builds.length > 0 && autoLoadTimelines) {
      console.log(`[useBuilds] Timeline auto-load effect triggered for ${builds.length} builds`);
      // Auto-load timelines for all builds
      builds.forEach((build: Build, index: number) => {
        // Stagger the requests to avoid overwhelming the API
        setTimeout(() => loadBuildTimeline(build), index * 200);
      });
    }
    // Note: Intentionally not including loadBuildTimeline in deps to prevent re-triggering
    // when timelines are loaded. The function has its own guards against duplicate loads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [builds, autoLoadTimelines]);

  // Auto-load Jira issues for builds with matching tags
  useEffect(() => {
    if (builds.length > 0 && appConfig.jiraEnabled && autoLoadJira) {
      // Auto-load Jira issues for builds with matching tags
      builds.forEach((build: Build, index: number) => {
        const issueKey = extractJiraIssueKey(build.tags);
        if (issueKey) {
          // Stagger the requests to avoid overwhelming the API
          setTimeout(() => loadJiraIssue(issueKey), index * 250);
        }
      });
    }
    // Note: Intentionally not including loadJiraIssue in deps to prevent re-triggering
    // when Jira issues are loaded. The Jira hook has its own guards against duplicate loads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [builds, autoLoadJira]);

  return {
    // State
    organization,
    selectedProject,
    setSelectedProject,
    selectedPipeline,
    setSelectedPipeline,
    projects,
    pipelines,
    builds,
    buildTimelines,
    timelineLoading,
    loading,
    error,
    branchFilter,
    setBranchFilter,
    reasonFilter,
    setReasonFilter,
    
    // Jira state
    jiraIssues,
    jiraLoading,
    
    // Functions
    loadBuildTimeline,
    getApiBranch
  };
};
