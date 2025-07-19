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
import { Project, Pipeline, Build } from '../models/types';
import { appConfig } from '../config/appConfig';

const BuildsView: React.FC = () => {
  const [organization] = useState<string>(appConfig.azureDevOpsOrganization);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedPipeline, setSelectedPipeline] = useState<number | ''>('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [builds, setBuilds] = useState<Build[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Load projects on component mount
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        const projectData = await ApiService.getProjects(organization);
        setProjects(projectData);
        
        // Auto-select first project if available
        if (projectData.length > 0) {
          setSelectedProject(projectData[0].name);
        }
      } catch (err) {
        setError('Failed to load projects');
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
        const pipelineData = await ApiService.getPipelines(organization, selectedProject);
        setPipelines(pipelineData);
        
        // Reset selected pipeline and builds
        setSelectedPipeline('');
        setBuilds([]);
        
        // Auto-select first pipeline if available
        if (pipelineData.length > 0) {
          setSelectedPipeline(pipelineData[0].id);
        }
      } catch (err) {
        setError('Failed to load pipelines');
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
      if (!selectedProject || !selectedPipeline) return;

      try {
        setLoading(true);
        const buildData = await ApiService.getBuilds(
          organization, 
          selectedProject, 
          Number(selectedPipeline), 
          20 // Get more builds for the table view
        );
        setBuilds(buildData);
      } catch (err) {
        setError('Failed to load builds');
        console.error('Error loading builds:', err);
      } finally {
        setLoading(false);
      }
    };

    loadBuilds();
  }, [organization, selectedProject, selectedPipeline]);

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
    if (!startTime || !finishTime) return 'N/A';
    
    const start = new Date(startTime);
    const finish = new Date(finishTime);
    const durationMs = finish.getTime() - start.getTime();
    
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    
    return `${minutes}m ${seconds}s`;
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
            md: 'repeat(3, 1fr)' 
          }, 
          gap: 3 
        }}>
          <FormControl fullWidth>
            <InputLabel>Organization</InputLabel>
            <Select
              value={organization}
              label="Organization"
              disabled
            >
              <MenuItem value={organization}>{organization}</MenuItem>
            </Select>
          </FormControl>
          
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
            Recent Builds
          </Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Build Number</TableCell>
                  <TableCell>Branch</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Start Time</TableCell>
                  <TableCell>Build Time</TableCell>
                  <TableCell>Tags</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {builds.map((build) => (
                  <TableRow key={build.id} hover>
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
                      <Typography variant="body2">
                        {formatDuration(build.startTime, build.finishTime)}
                      </Typography>
                    </TableCell>
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
                ))}
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
