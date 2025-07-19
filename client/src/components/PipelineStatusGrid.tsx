import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  CircularProgress
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Cancel,
  Schedule,
  Build as BuildIcon
} from '@mui/icons-material';
import { PipelineStatus, BuildResult, BuildStatus } from '../models/types';
import { appConfig } from '../config/appConfig';

interface PipelineStatusGridProps {
  pipelineStatuses: PipelineStatus[];
  loading: boolean;
  project?: string; // Added project prop
}

const PipelineStatusGrid: React.FC<PipelineStatusGridProps> = ({
  pipelineStatuses,
  loading,
  project
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const handleCardClick = (buildId?: number) => {
    if (!buildId || !project) return;
    
    // Use the project from props
    const projectPath = encodeURIComponent(project);
    
    // Open the Azure DevOps build page in a new tab
    const url = `https://dev.azure.com/${appConfig.azureDevOpsOrganization}/${projectPath}/_build/results?buildId=${buildId}&view=results`;
    window.open(url, '_blank');
  };

  if (loading && pipelineStatuses.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
        <CircularProgress size={40} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading pipelines...
        </Typography>
      </Box>
    );
  }

  if (pipelineStatuses.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
        <Typography variant="h6" color="text.secondary">
          No pipelines found for the selected filters
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
          lg: 'repeat(4, 1fr)'
        },
        gap: 3
      }}
    >
      {pipelineStatuses.map((pipelineStatus) => (
        <Card 
          key={pipelineStatus.pipelineId}
          sx={{ 
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: 4,
              cursor: 'pointer'
            }
          }}
          onClick={() => handleCardClick(pipelineStatus.deployedBuild?.id)}
        >
          <CardContent sx={{ flexGrow: 1 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Box display="flex" alignItems="center">
                <BuildIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="h3" noWrap>
                  {pipelineStatus.pipelineName}
                </Typography>
              </Box>
              {pipelineStatus.isLoading && (
                <CircularProgress size={20} />
              )}
            </Box>

            {/* Build Status */}
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Build Status
              </Typography>
              {pipelineStatus.deployedBuild ? (
                <Box>
                  <Box display="flex" alignItems="center" mb={1}>
                    {pipelineStatus.deployedBuild.finishTime ? (
                      <CheckCircle color="success" />
                    ) : (
                      <CircularProgress size={20} color="info" />
                    )}
                    <Chip
                      label={pipelineStatus.deployedBuild.finishTime ? "Completed" : "In Progress"}
                      color={pipelineStatus.deployedBuild.finishTime ? "success" : "info"}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Build #{pipelineStatus.deployedBuild.buildNumber}
                  </Typography>
                  <Typography variant="caption" display="block">
                    {formatDate(pipelineStatus.deployedBuild.finishTime)}
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No builds found
                </Typography>
              )}
            </Box>

            {/* Deployment Status */}
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Deployment Status
              </Typography>
              {pipelineStatus.deployedBuild ? (
                <Box>
                  <Box display="flex" alignItems="center" mb={1}>
                    {pipelineStatus.deployedBuild.finishTime ? (
                      <CheckCircle color="success" />
                    ) : (
                      <CircularProgress size={20} color="info" />
                    )}
                    <Chip
                      label={pipelineStatus.deployedBuild.finishTime ? "Deployed" : "Deploying"}
                      color={pipelineStatus.deployedBuild.finishTime ? "success" : "info"}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Build #{pipelineStatus.deployedBuild.buildNumber}
                  </Typography>
                  <Typography variant="caption" display="block">
                    {formatDate(pipelineStatus.deployedBuild.finishTime)}
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Not deployed to this environment
                </Typography>
              )}
            </Box>

            {pipelineStatus.error && (
              <Box mt={2}>
                <Chip
                  label="Error loading data"
                  color="error"
                  size="small"
                  variant="outlined"
                />
              </Box>
            )}
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default PipelineStatusGrid;
