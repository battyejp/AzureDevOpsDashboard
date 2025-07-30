import React from 'react';
import {
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  SelectChangeEvent
} from '@mui/material';
import { Project, Pipeline } from '../models/types';
import { reasonOptions, branchOptions } from '../utils/buildUtils';

interface BuildFiltersProps {
  selectedProject: string;
  onProjectChange: (event: SelectChangeEvent<string>) => void;
  selectedPipeline: number | '';
  onPipelineChange: (event: SelectChangeEvent<number | string>) => void;
  branchFilter: string;
  onBranchFilterChange: (branch: string) => void;
  reasonFilter: string;
  onReasonFilterChange: (reason: string) => void;
  projects: Project[];
  pipelines: Pipeline[];
  loading: boolean;
  title?: string;
}

export const BuildFilters: React.FC<BuildFiltersProps> = ({
  selectedProject,
  onProjectChange,
  selectedPipeline,
  onPipelineChange,
  branchFilter,
  onBranchFilterChange,
  reasonFilter,
  onReasonFilterChange,
  projects,
  pipelines,
  loading,
  title = 'Filters'
}) => {
  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        {title}
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
            onChange={onProjectChange}
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
            onChange={onPipelineChange}
          >
            {pipelines.map((pipeline) => (
              <MenuItem key={pipeline.id} value={pipeline.id}>
                {pipeline.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl fullWidth disabled={loading}>
          <InputLabel>Branch</InputLabel>
          <Select
            value={branchFilter}
            label="Branch"
            onChange={(e) => onBranchFilterChange(e.target.value)}
          >
            {branchOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl fullWidth disabled={loading}>
          <InputLabel>Reason</InputLabel>
          <Select
            value={reasonFilter}
            label="Reason"
            onChange={(e) => onReasonFilterChange(e.target.value)}
          >
            {reasonOptions.map((option) => (
              <MenuItem key={option.value} value={option.value.toString()}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </Paper>
  );
};
