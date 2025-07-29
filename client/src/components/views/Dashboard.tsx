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
  SelectChangeEvent
} from '@mui/material';
import { ApiService } from '../../services/apiService';
import { ConfigService } from '../../services/configService';
import { Project, DeploymentEnvironment, DashboardFilters, PipelineStatus } from '../../models/types';
import PipelineStatusGrid from '../PipelineStatusGrid';
import { appConfig } from '../../config/appConfig';

const Dashboard: React.FC = () => {
  const [filters, setFilters] = useState<DashboardFilters>({
    organization: appConfig.azureDevOpsOrganization,
    project: '',
    environment: DeploymentEnvironment.Dev
  });

  const [projects, setProjects] = useState<Project[]>([]);
  const [pipelineStatuses, setPipelineStatuses] = useState<PipelineStatus[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

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

        const projectData = await ApiService.getProjects(filters.organization);
        setProjects(projectData);
        
        // Auto-select default project from configuration, or first project if available
        if (projectData.length > 0 && !filters.project) {
          const defaultProject = ConfigService.getDefaultProject();
          const projectToSelect = defaultProject && projectData.find(p => p.name === defaultProject)
            ? defaultProject
            : projectData[0].name;
          setFilters(prev => ({ ...prev, project: projectToSelect }));
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load projects');
        console.error('Error loading projects:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.organization]);

  // Load pipelines and their statuses when project or environment changes
  // Note: Pipelines without a deployed build for the selected environment will be filtered out in the render
  const loadPipelineStatuses = useCallback(async () => {
    if (!filters.project || !filters.organization) return;

    try {
      setLoading(true);
      setError('');
      
      // Get all pipelines for the project
      const allPipelines = await ApiService.getPipelines(filters.organization, filters.project);
      
      // Apply pipeline filtering based on user configuration
      const filteredPipelines = allPipelines.filter(pipeline => 
        ConfigService.isPipelineVisible(filters.project, pipeline.id)
      );
      
      // Initialize pipeline statuses with loading state
      const initialStatuses: PipelineStatus[] = filteredPipelines.map(pipeline => ({
        pipelineId: pipeline.id,
        pipelineName: pipeline.name,
        isLoading: true,
        error: undefined,
        latestBuild: undefined,
        deployedBuild: undefined
      }));
      
      setPipelineStatuses(initialStatuses);

      // Track the loading state of all pipelines
      let pendingPipelines = filteredPipelines.length;
      const updateLoadingState = () => {
        pendingPipelines--;
        if (pendingPipelines <= 0) {
          setLoading(false);
        }
      };

      // Load data for each pipeline asynchronously
      filteredPipelines.forEach(async (pipeline, index) => {
        try {
          // Only fetch deployed builds for the selected environment
          const deployedBuild = await ApiService.getLatestDeployedBuild(
            filters.organization, 
            filters.project, 
            pipeline.id, 
            filters.environment
          );

          console.log(`Pipeline ${pipeline.name} (${pipeline.id}):`, { 
            deployedBuild: deployedBuild ? `#${deployedBuild.buildNumber}` : 'none'
          });

          setPipelineStatuses(prev => {
            const updated = [...prev];
            updated[index] = {
              ...updated[index],
              deployedBuild: deployedBuild || undefined,
              isLoading: false
            };
            return updated;
          });
        } catch (err: any) {
          console.error(`Error loading data for pipeline ${pipeline.name}:`, err);
          setPipelineStatuses(prev => {
            const updated = [...prev];
            updated[index] = {
              ...updated[index],
              isLoading: false,
              error: err.message || 'Failed to load pipeline data'
            };
            return updated;
          });
        } finally {
          updateLoadingState();
        }
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load pipelines');
      console.error('Error loading pipelines:', err);
      setLoading(false);
    }
  }, [filters.organization, filters.project, filters.environment]);

  // Load pipeline statuses when filters change
  useEffect(() => {
    if (filters.project) {
      loadPipelineStatuses();
    }
  }, [loadPipelineStatuses, filters.project]);

  const handleProjectChange = (event: SelectChangeEvent<string>) => {
    setFilters(prev => ({
      ...prev,
      project: event.target.value
    }));
  };

  const handleEnvironmentChange = (event: SelectChangeEvent<DeploymentEnvironment>) => {
    setFilters(prev => ({
      ...prev,
      environment: event.target.value as DeploymentEnvironment
    }));
  };

  const getEnvironmentName = (env: DeploymentEnvironment): string => {
    switch (env) {
      case DeploymentEnvironment.Dev:
        return 'Development';
      case DeploymentEnvironment.SIT:
        return 'System Integration Testing';
      case DeploymentEnvironment.UAT:
        return 'User Acceptance Testing';
      case DeploymentEnvironment.PPD:
        return 'Pre-Production';
      case DeploymentEnvironment.Prod:
        return 'Production';
      default:
        return 'Unknown';
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Deployments
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
            md: 'repeat(2, 1fr)'
          },
          gap: 3
        }}>
          
          <FormControl fullWidth disabled={loading || projects.length === 0}>
            <InputLabel>Project</InputLabel>
            <Select
              value={filters.project}
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
          
          <FormControl fullWidth>
            <InputLabel>Environment</InputLabel>
            <Select
              value={filters.environment}
              label="Environment"
              onChange={handleEnvironmentChange}
            >
              <MenuItem value={DeploymentEnvironment.Dev}>Development</MenuItem>
              <MenuItem value={DeploymentEnvironment.SIT}>System Integration Testing (SIT)</MenuItem>
              <MenuItem value={DeploymentEnvironment.UAT}>User Acceptance Testing (UAT)</MenuItem>
              <MenuItem value={DeploymentEnvironment.PPD}>Pre-Production (PPD)</MenuItem>
              <MenuItem value={DeploymentEnvironment.Prod}>Production</MenuItem>
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
      {loading && pipelineStatuses.length === 0 && (
        <Box display="flex" justifyContent="center" sx={{ my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Results */}
      {filters.project && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Pipeline Status for {filters.project} - {getEnvironmentName(filters.environment)}
          </Typography>
          
          {pipelineStatuses.length > 0 ? (
            (() => {
              const filteredStatuses = pipelineStatuses.filter(status => {
                // Include pipelines that are still loading
                if (status.isLoading) return true;
                
                // Include pipelines that have a deployedBuild for the selected environment
                if (status.deployedBuild !== undefined) {
                  console.log('Found deployed build:', status.pipelineName, status.deployedBuild);
                  return true;
                }
                
                // Log pipelines that don't have a deployedBuild
                console.log('No deployed build for pipeline:', status.pipelineName);
                return false;
              });
              
              console.log('Filtered statuses:', filteredStatuses.length, 'out of', pipelineStatuses.length);
              
              return filteredStatuses.length > 0 ? (
                <PipelineStatusGrid 
                  pipelineStatuses={filteredStatuses}
                  loading={loading}
                  project={filters.project}
                />
              ) : (
                <Typography color="text.secondary" sx={{ mt: 2 }}>
                  No pipelines have been deployed to the selected environment.
                </Typography>
              );
            })()
          ) : (
            !loading && (
              <Typography color="text.secondary" sx={{ mt: 2 }}>
                No pipelines found for the selected project.
              </Typography>
            )
          )}
        </Paper>
      )}
    </Container>
  );
};

export default Dashboard;
