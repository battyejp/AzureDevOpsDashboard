import React from 'react';
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Box,
  CircularProgress
} from '@mui/material';
import { Build, BuildTimeline, JiraIssue } from '../models/types';
import { appConfig } from '../config/appConfig';
import { formatDate, formatDuration, getLastStage, getStageStatusIcon } from '../utils/buildUtils';
import { JiraStatus } from './JiraStatus';

interface BuildsTableProps {
  builds: Build[];
  buildTimelines: Map<number, BuildTimeline>;
  timelineLoading: Set<number>;
  jiraIssues: Map<string, JiraIssue>;
  jiraLoading: Set<string>;
  organization: string;
  selectedProject: string;
  title?: string;
  showEnvironment?: boolean;
  showPipeline?: boolean; // For showing pipeline names in release view
}

export const BuildsTable: React.FC<BuildsTableProps> = ({
  builds,
  buildTimelines,
  timelineLoading,
  jiraIssues,
  jiraLoading,
  organization,
  selectedProject,
  title = 'Recent Builds',
  showEnvironment = false,
  showPipeline = false
}) => {
  if (builds.length === 0) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          No builds found for the selected pipeline.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {title} ({builds.length})
      </Typography>
      
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {showPipeline && <TableCell>Pipeline</TableCell>}
              <TableCell>Build Number</TableCell>
              {showEnvironment && <TableCell>Environment</TableCell>}
              <TableCell>Branch</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell>Start Time</TableCell>
              <TableCell>Last Stage</TableCell>
              <TableCell>Build Time</TableCell>
              <TableCell>Tags</TableCell>
              {appConfig.jiraEnabled && <TableCell>Jira Status</TableCell>}
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
                  {showPipeline && (
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {(build as any).pipelineName || (build as any).definition?.name || 'Unknown Pipeline'}
                      </Typography>
                    </TableCell>
                  )}
                  
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {build.buildNumber}
                    </Typography>
                  </TableCell>
                  
                  {showEnvironment && (
                    <TableCell>
                      <Typography variant="body2">
                        {(build as any).environment !== undefined 
                          ? ['Dev', 'SIT', 'UAT', 'PPD', 'Prod'][(build as any).environment] || 'Unknown'
                          : 'N/A'
                        }
                      </Typography>
                    </TableCell>
                  )}
                  
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
                            {(() => {
                              const iconInfo = getStageStatusIcon(getLastStage(buildTimelines.get(build.id)?.records));
                              return iconInfo ? (
                                <img 
                                  src={iconInfo.src} 
                                  alt={iconInfo.alt} 
                                  width="20" 
                                  height="20" 
                                />
                              ) : null;
                            })()}
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
                  
                  {appConfig.jiraEnabled && (
                    <TableCell>
                      <JiraStatus build={build} jiraIssues={jiraIssues} jiraLoading={jiraLoading} />
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};
