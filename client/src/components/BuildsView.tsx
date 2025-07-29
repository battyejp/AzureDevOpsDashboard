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
import { XenTagChip } from './XenTagChip';
import { ApiService } from '../services/apiService';
import { ConfigService } from '../services/configService';
import { Project, Pipeline, Build, BuildTimeline, TimelineRecord } from '../models/types';
import { appConfig } from '../config/appConfig';

const BuildsView: React.FC = () => {
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
  // New: branch and reason filter state
  const [branchFilter, setBranchFilter] = useState<string>(''); // Default to 'All'
  const [reasonFilter, setReasonFilter] = useState<string>(''); // Default to 'All'

  // Reason options (can be extended as needed)
  // Azure DevOps BuildReason enum values
  // https://learn.microsoft.com/en-us/dotnet/api/microsoft.teamfoundation.build.webapi.buildreason
  const reasonOptions = [
    { value: 2, label: 'CI' }, // IndividualCI
    { value: 1, label: 'Manual' },
    { value: 8, label: 'Scheduled' },
    { value: 256, label: 'Pull Request' },
    { value: 4, label: 'Batched CI' },
    { value: '', label: 'All' },
  ];

  // Helper to get correct branch value for API
  const getApiBranch = (branch: string) => {
    if (!branch) return '';
    if (branch.startsWith('refs/')) return branch;
    return `refs/heads/${branch}`;
  };

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

        // Call API with branch and reason filter
        const buildData = await ApiService.getBuilds(
          organization,
          selectedProject,
          Number(selectedPipeline),
          20, // Get more builds for the table view
          'all', // Include in-progress builds
          getApiBranch(branchFilter),
          reasonFilter === '' ? undefined : reasonFilter
        );

        console.log(`Loaded ${buildData ? buildData.length : 0} builds:`, buildData);

        if (!buildData || buildData.length === 0) {
          console.warn('No builds returned from API');
        }

        setBuilds(buildData || []);
        // Clear previous timelines when builds change
        setBuildTimelines(new Map());
        setTimelineLoading(new Set());
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
  }, [organization, selectedProject, selectedPipeline, branchFilter, reasonFilter]);

  // Auto-load timelines for all builds when builds change
  useEffect(() => {
    if (builds.length > 0) {
      // Auto-load timelines for all builds
      builds.forEach((build: Build, index: number) => {
        // Stagger the requests to avoid overwhelming the API
        setTimeout(() => loadBuildTimeline(build), index * 200);
      });
    }
  }, [builds, loadBuildTimeline]);

  const handleProjectChange = (event: SelectChangeEvent<string>) => {
    setSelectedProject(event.target.value);
  };

  const handlePipelineChange = (event: SelectChangeEvent<number | string>) => {
    setSelectedPipeline(Number(event.target.value) || '');
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
        Builds
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
            md: 'repeat(4, 1fr)'
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
          <FormControl fullWidth disabled={loading || pipelines.length === 0}>
            <InputLabel>Pipeline</InputLabel>
            <Select
              value={selectedPipeline.toString()}
              label="Pipeline"
              onChange={handlePipelineChange}
            >
              {pipelines.map((pipeline) => (
                <MenuItem key={pipeline.id} value={pipeline.id}>
                  {pipeline.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {/* Branch Filter */}
          <FormControl fullWidth disabled={loading}>
            <InputLabel>Branch</InputLabel>
            <Select
              value={branchFilter}
              label="Branch"
              onChange={(e) => setBranchFilter(e.target.value)}
            >
              <MenuItem value="main">main</MenuItem>
              <MenuItem value="develop">develop</MenuItem>
              <MenuItem value="release">release</MenuItem>
              <MenuItem value="">All</MenuItem>
            </Select>
          </FormControl>
          {/* Reason Filter */}
          <FormControl fullWidth disabled={loading}>
            <InputLabel>Reason</InputLabel>
            <Select
              value={reasonFilter}
              label="Reason"
              onChange={(e) => setReasonFilter(e.target.value)}
            >
              {reasonOptions.map((option) => (
                <MenuItem key={option.value} value={option.value.toString()}>{option.label}</MenuItem>
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

      {/* Builds Table */}
      {builds.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Recent Builds ({builds.length})
          </Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Build Number</TableCell>
                  <TableCell>Branch</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Start Time</TableCell>
                  <TableCell>Last Stage</TableCell>
                  <TableCell>Build Time</TableCell>
                  <TableCell>Tags</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[...builds]
                  .sort((a, b) => b.buildNumber.localeCompare(a.buildNumber, undefined, { numeric: true, sensitivity: 'base' }))
                  .map((build) => {
                  const projectName = build.project?.name || selectedProject;
                  const orgName = organization;
                  const buildUrl = `https://dev.azure.com/${encodeURIComponent(orgName)}/${encodeURIComponent(projectName)}/_build/results?buildId=${build.id}&view=results`;
                  return (
                    <TableRow
                      key={build.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => window.open(buildUrl, '_blank', 'noopener')}
                    >
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
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {build.tags && build.tags.length > 0 ? (
                            build.tags.map((tag, index) => (
                              <XenTagChip tag={tag} index={index} key={index} />
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

      {/* No builds message */}
      {!loading && builds.length === 0 && selectedProject && selectedPipeline && (
        <Paper sx={{ p: 3 }}>
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No builds found for the selected pipeline.
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default BuildsView;
