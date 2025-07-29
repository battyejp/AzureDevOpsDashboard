import React from 'react';
import {
  Container,
  Alert,
  CircularProgress,
  Box,
  SelectChangeEvent,
  Typography
} from '@mui/material';
import { useBuilds } from '../../hooks/useBuilds';
import { BuildFilters } from '../BuildFilters';
import { BuildsTable } from '../BuildsTable';

const BuildsView: React.FC = () => {
  const {
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
    jiraLoading
  } = useBuilds();

  const handleProjectChange = (event: SelectChangeEvent<string>) => {
    setSelectedProject(event.target.value);
  };

  const handlePipelineChange = (event: SelectChangeEvent<number | string>) => {
    setSelectedPipeline(Number(event.target.value) || '');
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Builds
      </Typography>

      <BuildFilters
        selectedProject={selectedProject}
        onProjectChange={handleProjectChange}
        selectedPipeline={selectedPipeline}
        onPipelineChange={handlePipelineChange}
        branchFilter={branchFilter}
        onBranchFilterChange={setBranchFilter}
        reasonFilter={reasonFilter}
        onReasonFilterChange={setReasonFilter}
        projects={projects}
        pipelines={pipelines}
        loading={loading}
      />

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

      <BuildsTable
        builds={builds}
        buildTimelines={buildTimelines}
        timelineLoading={timelineLoading}
        jiraIssues={jiraIssues}
        jiraLoading={jiraLoading}
        organization={organization}
        selectedProject={selectedProject}
      />
    </Container>
  );
};

export default BuildsView;
