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
  SelectChangeEvent
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import SaveIcon from '@mui/icons-material/Save';
import ClearIcon from '@mui/icons-material/Clear';
import { ApiService } from '../services/apiService';
import { ConfigService } from '../services/configService';
import { Project } from '../models/types';
import { appConfig } from '../config/appConfig';

const Configuration: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [defaultProject, setDefaultProject] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
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

  const handleProjectChange = (event: SelectChangeEvent<string>) => {
    setDefaultProject(event.target.value);
    // Clear any previous messages
    setSuccess('');
    setError('');
  };

  const handleSave = () => {
    try {
      if (defaultProject) {
        ConfigService.setDefaultProject(defaultProject);
        setSuccess('Default project saved successfully!');
        setError('');
      } else {
        setError('Please select a project before saving.');
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
      setSuccess('Configuration cleared successfully!');
      setError('');
    } catch (err) {
      setError('Failed to clear configuration');
      console.error('Error clearing configuration:', err);
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
                disabled={!defaultProject || loading}
              >
                Save Configuration
              </Button>
              
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<ClearIcon />}
                onClick={handleClear}
                disabled={loading}
              >
                Clear Configuration
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
            <li>Click "Save Configuration" to persist your choice</li>
            <li>The selected project will be automatically chosen in all views</li>
            <li>You can still manually change the project in individual views if needed</li>
            <li>Your configuration is saved locally in your browser</li>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Configuration;