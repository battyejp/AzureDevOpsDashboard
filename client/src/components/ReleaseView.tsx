import React, { useState, useEffect, useCallback } from 'react';
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
  SelectChangeEvent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import { ApiService } from '../services/apiService';
import { ConfigService } from '../services/configService';
import { Project, Pipeline, Build, BuildTimeline, TimelineRecord } from '../models/types';
import { appConfig } from '../config/appConfig';
import { extractJiraIssueKey } from '../utils/jiraUtils';
import { useJira } from '../hooks/useJira';
import { JiraStatus } from './JiraStatus';

const ReleaseView: React.FC = () => {
  const [organization] = useState<string>(appConfig.azureDevOpsOrganization);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [pipelineBuilds, setPipelineBuilds] = useState<{ pipeline: Pipeline; build: Build | null }[]>([]);
  const [buildTimelines, setBuildTimelines] = useState<Map<number, BuildTimeline>>(new Map());
  const [timelineLoading, setTimelineLoading] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Use shared Jira hook
  const { jiraIssues, jiraLoading, loadJiraIssue } = useJira();

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

  // Load timeline for a specific build (memoized to avoid changing on every render)
  const loadBuildTimeline = useCallback(async (build: Build) => {
    if (buildTimelines.has(build.id) || timelineLoading.has(build.id)) {
      return; // Already loaded or loading
    }
    try {
      // Add to loading set
      setTimelineLoading(prev => new Set(prev).add(build.id));
      console.log(`Loading timeline for build ${build.id}`);
      const timeline = await ApiService.getBuildTimeline(
        organization,
        selectedProject,
        build.id,
        'Stage' // Only fetch Stage records, we'll filter out skipped ones in the frontend
      );
      if (timeline) {
        console.log(`Got timeline for build ${build.id}:`, timeline);
        setBuildTimelines(prev => new Map(prev).set(build.id, timeline));
      } else {
        console.log(`No timeline data for build ${build.id}`);
      }
    } catch (err) {
      console.error(`Error loading timeline for build ${build.id}:`, err);
    } finally {
      // Remove from loading set
      setTimelineLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(build.id);
        return newSet;
      });
    }
  }, [buildTimelines, timelineLoading, organization, selectedProject]);

  // Auto-load timelines for all builds when builds change
  useEffect(() => {
    const buildsWithData = pipelineBuilds.filter(pb => pb.build !== null).map(pb => pb.build!);
    if (buildsWithData.length > 0) {
      // Auto-load timelines for all builds
      buildsWithData.forEach((build: Build, index: number) => {
        // Stagger the requests to avoid overwhelming the API
        setTimeout(() => loadBuildTimeline(build), index * 200);
      });
    }
  }, [pipelineBuilds, loadBuildTimeline]);

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
  }, [pipelineBuilds, loadJiraIssue]);

  const handleProjectChange = (event: SelectChangeEvent<string>) => {
    setSelectedProject(event.target.value);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (startTime?: string, finishTime?: string) => {
    if (!startTime) return 'N/A';
    
    const start = new Date(startTime);
    const finish = finishTime ? new Date(finishTime) : new Date();
    const durationMs = finish.getTime() - start.getTime();
    
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    
    return `${minutes}m ${seconds}s`;
  };
  
  // Get the last (most recent) stage from the timeline, ignoring skipped stages
  const getLastStage = (records?: TimelineRecord[]) => {
    if (!records || records.length === 0) return null;
    
    // Filter out skipped stages
    const nonSkippedStages = records.filter(record => 
      record.result !== 'skipped' && record.result !== 'canceled'
    );
    
    if (nonSkippedStages.length === 0) return null;
    
    // Sort by start time to get the chronologically last stage that actually started
    const sortedStages = [...nonSkippedStages].sort((a, b) => {
      // If both have start times, sort by start time (descending to get latest first)
      if (a.startTime && b.startTime) {
        return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
      }
      
      // If only one has a start time, prioritize the one that started
      if (a.startTime && !b.startTime) return -1;
      if (!a.startTime && b.startTime) return 1;
      
      // If neither has start time, maintain original order
      return 0;
    });
    
    return sortedStages[0];
  };
  
  // Get the appropriate icon for the stage status
  const getStageStatusIcon = (stage: TimelineRecord | null) => {
    if (!stage) {
      return null;
    }
    
    console.log(`Stage status for ${stage.name}:`, {
      state: stage.state,
      result: stage.result,
      startTime: stage.startTime,
      finishTime: stage.finishTime
    });
    
    // Check state first for in-progress stages
    if (stage.state === 'inProgress') {
      return <img src="/icons/inprogress.svg" alt="In Progress" width="20" height="20" />;
    }
    
    // Then check result for completed stages
    if (stage.result === 'succeeded') {
      return <img src="/icons/success.svg" alt="Success" width="20" height="20" />;
    }
    
    if (stage.result === 'failed' || stage.result === 'partiallySucceeded') {
      return <img src="/icons/failure.svg" alt="Failed" width="20" height="20" />;
    }
    
    // For other states, show a neutral indicator or nothing
    return null;
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Release
      </Typography>

      {/* Filters */}
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

      {/* Pipeline Builds Table */}
      {pipelineBuilds.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Latest Builds from Main Branch ({pipelineBuilds.filter(pb => pb.build !== null).length} pipelines)
          </Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Pipeline</TableCell>
                  <TableCell>Build Number</TableCell>
                  <TableCell>Branch</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Start Time</TableCell>
                  <TableCell>Last Stage</TableCell>
                  <TableCell>Build Time</TableCell>
                  {appConfig.jiraEnabled && <TableCell>Jira Status</TableCell>}
                  <TableCell>Tags</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pipelineBuilds.map(({ pipeline, build }) => {
                  if (!build) {
                    return (
                      <TableRow key={pipeline.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {pipeline.name}
                          </Typography>
                        </TableCell>
                        <TableCell colSpan={appConfig.jiraEnabled ? 8 : 7}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            No builds found on main branch
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  }

                  const projectName = build.project?.name || selectedProject;
                  const orgName = organization;
                  const buildUrl = `https://dev.azure.com/${encodeURIComponent(orgName)}/${encodeURIComponent(projectName)}/_build/results?buildId=${build.id}&view=results`;


                  return (
                    <TableRow
                      key={`${pipeline.id}-${build.id}`}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => window.open(buildUrl, '_blank', 'noopener')}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {pipeline.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {build.buildNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {build.sourceBranch ? build.sourceBranch.replace('refs/heads/', '') : 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {build.reason || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(build.startTime)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {timelineLoading.has(build.id) ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CircularProgress size={16} />
                              <Typography variant="body2" color="text.secondary">
                                Loading...
                              </Typography>
                            </Box>
                          ) : buildTimelines.has(build.id) ? (
                            <>
                              <Box>
                                {getStageStatusIcon(getLastStage(buildTimelines.get(build.id)?.records))}
                              </Box>
                              <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'text.primary' }}>
                                {getLastStage(buildTimelines.get(build.id)?.records)?.name || 'No stages found'}
                              </Typography>
                            </>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No stage information
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDuration(build.startTime, build.finishTime)}
                        </Typography>
                      </TableCell>
                      {appConfig.jiraEnabled && (
                        <TableCell>
                          <JiraStatus build={build} jiraIssues={jiraIssues} jiraLoading={jiraLoading} />
                        </TableCell>
                      )}
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {build.tags && build.tags.length > 0 ? (
                            build.tags.map((tag, index) => (
                              <Chip
                                key={index}
                                label={tag}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.75rem' }}
                              />
                            ))
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No tags
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* No pipeline builds message */}
      {!loading && pipelineBuilds.length === 0 && selectedProject && (
        <Paper sx={{ p: 3 }}>
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No pipelines found for the selected project.
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default ReleaseView;