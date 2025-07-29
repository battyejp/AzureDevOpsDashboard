import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom';
import { Build, JiraIssue } from '../models/types';
import { extractJiraIssueKey, isJiraStatusDone } from '../utils/jiraUtils';
import { appConfig } from '../config/appConfig';

interface JiraStatusProps {
  build: Build;
  jiraIssues: Map<string, JiraIssue>;
  jiraLoading: Set<string>;
}

/**
 * Component for displaying Jira status with appropriate icon and text
 */
export const JiraStatus: React.FC<JiraStatusProps> = ({ build, jiraIssues, jiraLoading }) => {
  if (!appConfig.jiraEnabled) {
    return null;
  }

  const issueKey = extractJiraIssueKey(build.tags);
  if (!issueKey) {
    return <Typography variant="body2" color="text.secondary">-</Typography>;
  }

  if (jiraLoading.has(issueKey)) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CircularProgress size={16} />
        <Typography variant="body2" color="text.secondary">Loading...</Typography>
      </Box>
    );
  }

  const jiraIssue = jiraIssues.get(issueKey);
  if (!jiraIssue) {
    return <Typography variant="body2" color="text.secondary">Not found</Typography>;
  }

  const isDone = isJiraStatusDone(jiraIssue.fields.status);
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {isDone ? (
        <CheckCircleIcon sx={{ color: 'green', fontSize: 20 }} />
      ) : (
        <HourglassBottomIcon sx={{ color: 'orange', fontSize: 20 }} />
      )}
      <Typography variant="body2" color="text.secondary">
        {jiraIssue.fields.status.name}
      </Typography>
    </Box>
  );
};