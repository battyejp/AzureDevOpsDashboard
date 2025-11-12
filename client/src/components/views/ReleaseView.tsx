import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Container,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
  CircularProgress,
  SelectChangeEvent
} from '@mui/material';
import { ApiService } from '../../services/apiService';
import { ConfigService } from '../../services/configService';
import { Project, Pipeline, Build, BuildTimeline } from '../../models/types';
import { appConfig } from '../../config/appConfig';
import { extractJiraIssueKey } from '../../utils/jiraUtils';
import { useJira } from '../../hooks/useJira';
import { BuildsTable } from '../BuildsTable';

const ReleaseView: React.FC = () => {
  const [organization] = useState<string>(appConfig.azureDevOpsOrganization);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [pipelineBuilds, setPipelineBuilds] = useState<{ pipeline: Pipeline; build: Build | null }[]>([]);
  const [buildTimelines, setBuildTimelines] = useState<Map<number, BuildTimeline>>(new Map());
  const [timelineLoading, setTimelineLoading] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Use refs to track loading/loaded state to prevent race conditions
  const loadedTimelinesRef = useRef<Set<number>>(new Set());
  const loadingTimelinesRef = useRef<Set<number>>(new Set());

  // Use shared Jira hook
  const { jiraIssues, jiraLoading, loadJiraIssue } = useJira();

  // Load timeline for a specific build (memoized to avoid changing on every render)
  const loadBuildTimeline = useCallback(async (build: Build) => {
    console.log(`[ReleaseView loadBuildTimeline] Called for build ${build.id}, loaded=${loadedTimelinesRef.current.has(build.id)}, loading=${loadingTimelinesRef.current.has(build.id)}`);

    // Use refs to prevent race conditions - check and set atomically
    if (loadedTimelinesRef.current.has(build.id) || loadingTimelinesRef.current.has(build.id)) {
      console.log(`[ReleaseView loadBuildTimeline] SKIP - Build ${build.id} already loaded/loading`);
      return; // Already loaded or loading
    }

    // Mark as loading immediately in ref (before async operation)
    loadingTimelinesRef.current.add(build.id);
    console.log(`[ReleaseView loadBuildTimeline] START - Loading timeline for build ${build.id}`);

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
        console.log(`[ReleaseView loadBuildTimeline] SUCCESS - Got timeline for build ${build.id}`);
        setBuildTimelines(prev => new Map(prev).set(build.id, timeline));
        loadedTimelinesRef.current.add(build.id);
      } else {
        console.log(`[ReleaseView loadBuildTimeline] NO DATA - No timeline data for build ${build.id}`);
      }
    } catch (err) {
      console.error(`[ReleaseView loadBuildTimeline] ERROR - Error loading timeline for build ${build.id}:`, err);
    } finally {
      // Remove from loading sets
      loadingTimelinesRef.current.delete(build.id);
      setTimelineLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(build.id);
        return newSet;
      });
      console.log(`[ReleaseView loadBuildTimeline] DONE - Build ${build.id} complete, in loaded set=${loadedTimelinesRef.current.has(build.id)}`);
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

  // Load pipeline builds when project changes
  useEffect(() => {
    const loadPipelineBuilds = async () => {
      if (!selectedProject) return;

      try {
        setLoading(true);
        setError('');
        console.log(`Loading pipeline builds for project ${selectedProject}`);

        // Get all pipelines for the project
        const allPipelines = await ApiService.getPipelines(organization, selectedProject);
        
        // Apply pipeline filtering based on user configuration
        // If no pipelines are configured, show all pipelines
        const configuredPipelines = ConfigService.getPipelineFilters(selectedProject);
        const filteredPipelines = configuredPipelines && configuredPipelines.length > 0
          ? allPipelines.filter(pipeline => ConfigService.isPipelineVisible(selectedProject, pipeline.id))
          : allPipelines;
        
        console.log(`Found ${filteredPipelines.length} pipelines to process`);

        // For each pipeline, get the latest build from main branch
        const pipelineBuildPromises = filteredPipelines.map(async (pipeline) => {
          try {
            const builds = await ApiService.getBuilds(
              organization,
              selectedProject,
              pipeline.id,
              1, // Get only the latest build
              'all', // Include all statuses
              'refs/heads/main', // Only main branch
              'individualCI' // Only individual CI builds    
            );
            
            const latestBuild = builds && builds.length > 0 ? builds[0] : null;
            console.log(`Pipeline ${pipeline.name}: ${latestBuild ? `Build ${latestBuild.buildNumber}` : 'No builds found'}`);
            
            return { pipeline, build: latestBuild };
          } catch (err: any) {
            console.warn(`Failed to get builds for pipeline ${pipeline.name}:`, err);
            return { pipeline, build: null };
          }
        });

        const pipelineBuildsData = await Promise.all(pipelineBuildPromises);
        setPipelineBuilds(pipelineBuildsData);

        // Clear previous timelines when data changes
        setBuildTimelines(new Map());
        setTimelineLoading(new Set());
        // Clear refs to allow reloading for new builds
        loadedTimelinesRef.current.clear();
        loadingTimelinesRef.current.clear();

      } catch (err: any) {
        const errorMessage = err?.message || 'Unknown error';
        setError(errorMessage);
        console.error('Error loading pipeline builds:', err);
        setPipelineBuilds([]); // Reset on error
      } finally {
        setLoading(false);
      }
    };

    loadPipelineBuilds();
  }, [organization, selectedProject]);

  // Auto-load timelines for all builds when builds change
  useEffect(() => {
    const buildsWithData = pipelineBuilds.filter(pb => pb.build !== null).map(pb => pb.build!);
    if (buildsWithData.length > 0) {
      console.log(`[ReleaseView] Timeline auto-load effect triggered for ${buildsWithData.length} builds`);
      // Auto-load timelines for all builds
      buildsWithData.forEach((build: Build, index: number) => {
        // Stagger the requests to avoid overwhelming the API
        setTimeout(() => loadBuildTimeline(build), index * 200);
      });
    }
    // Note: Intentionally not including loadBuildTimeline in deps to prevent re-triggering
    // when timelines are loaded. The function has its own guards against duplicate loads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pipelineBuilds]);

  // Auto-load Jira issues for builds with matching tags
  useEffect(() => {
    const buildsWithData = pipelineBuilds.filter(pb => pb.build !== null).map(pb => pb.build!);
    if (buildsWithData.length > 0 && appConfig.jiraEnabled) {
      // Auto-load Jira issues for builds with matching tags
      buildsWithData.forEach((build: Build, index: number) => {
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
  }, [pipelineBuilds]);

  const handleProjectChange = (event: SelectChangeEvent<string>) => {
    setSelectedProject(event.target.value);
  };

  // Convert pipeline builds to Build array for BuildsTable
  const buildsForTable: Build[] = pipelineBuilds
    .filter(pb => pb.build !== null)
    .map(pb => ({
      ...pb.build!,
      // Add pipeline name to build for display purposes
      pipelineName: pb.pipeline.name
    }));

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Release
      </Typography>

      {/* Project Filter */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filters
        </Typography>
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: '1fr'
          },
          gap: 3
        }}>
          <FormControl fullWidth disabled={loading || projects.length === 0}>
            <InputLabel>Project</InputLabel>
            <Select
              value={selectedProject}
              label="Project"
              onChange={handleProjectChange}
            >
              {projects.map((project) => (
                <MenuItem key={project.id} value={project.name}>
                  {project.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Loading Indicator */}
      {loading && (
        <Box display="flex" justifyContent="center" sx={{ my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Use BuildsTable component for consistency */}
      {buildsForTable.length > 0 ? (
        <BuildsTable
          builds={buildsForTable}
          buildTimelines={buildTimelines}
          timelineLoading={timelineLoading}
          jiraIssues={jiraIssues}
          jiraLoading={jiraLoading}
          organization={organization}
          selectedProject={selectedProject}
          showEnvironment={false}
          showPipeline={true}
          title={`Latest Builds from Main Branch`}
        />
      ) : !loading && selectedProject ? (
        <Paper sx={{ p: 3 }}>
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No pipelines found for the selected project.
          </Typography>
        </Paper>
      ) : null}
    </Container>
  );
};

export default ReleaseView;
