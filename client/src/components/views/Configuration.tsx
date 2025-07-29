import React, { useState, useEffect } from 'react';
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
  Button,
  SelectChangeEvent,
  Chip,
  OutlinedInput,
  Divider
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import SaveIcon from '@mui/icons-material/Save';
import ClearIcon from '@mui/icons-material/Clear';
import { ApiService } from '../../services/apiService';
import { ConfigService } from '../../services/configService';
import { Project, Pipeline } from '../../models/types';
import { appConfig } from '../../config/appConfig';

const Configuration: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [defaultProject, setDefaultProject] = useState<string>('');
  const [selectedProjectForFilters, setSelectedProjectForFilters] = useState<string>('');
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [selectedPipelines, setSelectedPipelines] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [pipelinesLoading, setPipelinesLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Load projects and current configuration on component mount
  useEffect(() => {
    const loadData = async () => {
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

        // Load projects from API
        const projectData = await ApiService.getProjects(appConfig.azureDevOpsOrganization);
        setProjects(projectData);

        // Load current default project from configuration
        const currentDefault = ConfigService.getDefaultProject();
        if (currentDefault) {
          setDefaultProject(currentDefault);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load projects');
        console.error('Error loading configuration data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Load pipelines when a project is selected for filtering
  useEffect(() => {
    const loadPipelines = async () => {
      if (!selectedProjectForFilters) {
        setPipelines([]);
        setSelectedPipelines([]);
        return;
      }

      try {
        setPipelinesLoading(true);
        setError('');

        // Load pipelines for the selected project
        const pipelineData = await ApiService.getPipelines(appConfig.azureDevOpsOrganization, selectedProjectForFilters);
        setPipelines(pipelineData);

        // Load existing pipeline filters for this project
        const existingFilters = ConfigService.getPipelineFilters(selectedProjectForFilters);
        if (existingFilters) {
          setSelectedPipelines(existingFilters);
        } else {
          setSelectedPipelines([]); // No filters means show all pipelines
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load pipelines');
        console.error('Error loading pipelines:', err);
      } finally {
        setPipelinesLoading(false);
      }
    };

    loadPipelines();
  }, [selectedProjectForFilters]);

  const handleProjectChange = (event: SelectChangeEvent<string>) => {
    setDefaultProject(event.target.value);
    // Clear any previous messages
    setSuccess('');
    setError('');
  };

  const handleFilterProjectChange = (event: SelectChangeEvent<string>) => {
    setSelectedProjectForFilters(event.target.value);
    // Clear any previous messages
    setSuccess('');
    setError('');
  };

  const handlePipelineSelectionChange = (event: SelectChangeEvent<typeof selectedPipelines>) => {
    const value = event.target.value;
    setSelectedPipelines(typeof value === 'string' ? value.split(',').map(Number) : value);
    // Clear any previous messages
    setSuccess('');
    setError('');
  };

  const handleSave = () => {
    try {
      let hasChanges = false;

      // Save default project if specified
      if (defaultProject) {
        ConfigService.setDefaultProject(defaultProject);
        hasChanges = true;
      }

      // Save pipeline filters if a project is selected for filtering
      if (selectedProjectForFilters) {
        ConfigService.setPipelineFilters(selectedProjectForFilters, selectedPipelines);
        hasChanges = true;
      }

      if (hasChanges) {
        setSuccess('Configuration saved successfully!');
        setError('');
      } else {
        setError('No configuration changes to save.');
      }
    } catch (err) {
      setError('Failed to save configuration');
      console.error('Error saving configuration:', err);
    }
  };

  const handleClear = () => {
    try {
      ConfigService.clearConfig();
      setDefaultProject('');
      setSelectedProjectForFilters('');
      setSelectedPipelines([]);
      setPipelines([]);
      setSuccess('Configuration cleared successfully!');
      setError('');
    } catch (err) {
      setError('Failed to clear configuration');
      console.error('Error clearing configuration:', err);
    }
  };

  const handleClearPipelineFilters = () => {
    if (selectedProjectForFilters) {
      try {
        ConfigService.clearPipelineFilters(selectedProjectForFilters);
        setSelectedPipelines([]);
        setSuccess(`Pipeline filters cleared for ${selectedProjectForFilters}!`);
        setError('');
      } catch (err) {
        setError('Failed to clear pipeline filters');
        console.error('Error clearing pipeline filters:', err);
      }
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <SettingsIcon sx={{ mr: 2, fontSize: 32 }} color="primary" />
          <Typography variant="h4" component="h1">
            Configuration
          </Typography>
        </Box>

        <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
          Configure your default settings for the Azure DevOps Dashboard.
          The default project will be automatically selected across all views.
        </Typography>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        {!loading && (
          <Box sx={{ mb: 4 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel id="default-project-label">Default Project</InputLabel>
              <Select
                labelId="default-project-label"
                id="default-project-select"
                value={defaultProject}
                label="Default Project"
                onChange={handleProjectChange}
                disabled={projects.length === 0}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {projects.map((project) => (
                  <MenuItem key={project.id} value={project.name}>
                    {project.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Divider sx={{ my: 3 }} />

            {/* Pipeline Filtering Section */}
            <Typography variant="h6" sx={{ mb: 2 }}>
              Pipeline Filtering
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
              Configure which pipelines should be visible for each project.
              If no pipelines are selected, all pipelines will be shown.
            </Typography>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel id="filter-project-label">Project to Configure</InputLabel>
              <Select
                labelId="filter-project-label"
                id="filter-project-select"
                value={selectedProjectForFilters}
                label="Project to Configure"
                onChange={handleFilterProjectChange}
                disabled={projects.length === 0}
              >
                <MenuItem value="">
                  <em>Select a project</em>
                </MenuItem>
                {projects.map((project) => (
                  <MenuItem key={project.id} value={project.name}>
                    {project.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedProjectForFilters && (
              <>
                {pipelinesLoading && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                    <CircularProgress size={24} />
                  </Box>
                )}

                {!pipelinesLoading && pipelines.length > 0 && (
                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel id="pipelines-label">
                      Visible Pipelines (leave empty to show all)
                    </InputLabel>
                    <Select
                      labelId="pipelines-label"
                      id="pipelines-select"
                      multiple
                      value={selectedPipelines}
                      onChange={handlePipelineSelectionChange}
                      input={<OutlinedInput label="Visible Pipelines (leave empty to show all)" />}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((pipelineId) => {
                            const pipeline = pipelines.find(p => p.id === pipelineId);
                            return (
                              <Chip
                                key={pipelineId}
                                label={pipeline?.name || `Pipeline ${pipelineId}`}
                                size="small"
                              />
                            );
                          })}
                        </Box>
                      )}
                    >
                      {pipelines.map((pipeline) => (
                        <MenuItem key={pipeline.id} value={pipeline.id}>
                          {pipeline.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

                {!pipelinesLoading && pipelines.length === 0 && (
                  <Alert severity="info" sx={{ mb: 3 }}>
                    No pipelines found for the selected project.
                  </Alert>
                )}

                {selectedProjectForFilters && selectedPipelines.length > 0 && (
                  <Button
                    variant="outlined"
                    color="warning"
                    startIcon={<ClearIcon />}
                    onClick={handleClearPipelineFilters}
                    disabled={loading || pipelinesLoading}
                    sx={{ mb: 2 }}
                  >
                    Clear Pipeline Filters for {selectedProjectForFilters}
                  </Button>
                )}
              </>
            )}

            {projects.length === 0 && !loading && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                No projects found. Please check your Azure DevOps connection.
              </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-start' }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={loading || pipelinesLoading}
              >
                Save Configuration
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<ClearIcon />}
                onClick={handleClear}
                disabled={loading || pipelinesLoading}
              >
                Clear All Configuration
              </Button>
            </Box>
          </Box>
        )}

        <Box sx={{ mt: 4, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            How it works:
          </Typography>
          <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
            <li>Select a default project from the dropdown above</li>
            <li>Configure pipeline filtering by selecting a project and choosing which pipelines to show</li>
            <li>Leave pipeline selection empty to show all pipelines for a project</li>
            <li>Click "Save Configuration" to persist your choices</li>
            <li>The selected project will be automatically chosen in all views</li>
            <li>Only configured pipelines will be visible in the dashboard</li>
            <li>You can still manually change the project in individual views if needed</li>
            <li>Your configuration is saved locally in your browser</li>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Configuration;
