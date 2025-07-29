import React from 'react';
import { TimelineRecord } from '../models/types';

/**
 * Shared utility functions for build and release views
 */

export const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString();
};

export const formatDuration = (startTime?: string, finishTime?: string): string => {
  if (!startTime) return 'N/A';
  
  const start = new Date(startTime);
  const finish = finishTime ? new Date(finishTime) : new Date();
  const durationMs = finish.getTime() - start.getTime();
  
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);
  
  return `${minutes}m ${seconds}s`;
};

// Get the last (most recent) stage from the timeline, ignoring skipped stages
export const getLastStage = (records?: TimelineRecord[]): TimelineRecord | null => {
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
export const getStageStatusIcon = (stage: TimelineRecord | null): React.ReactElement | null => {
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
    return React.createElement('img', { src: '/icons/inprogress.svg', alt: 'In Progress', width: '20', height: '20' });
  }
  
  // Then check result for completed stages
  if (stage.result === 'succeeded') {
    return React.createElement('img', { src: '/icons/success.svg', alt: 'Success', width: '20', height: '20' });
  }
  
  if (stage.result === 'failed' || stage.result === 'partiallySucceeded') {
    return React.createElement('img', { src: '/icons/failure.svg', alt: 'Failed', width: '20', height: '20' });
  }
  
  // For other states, show a neutral indicator or nothing
  return null;
};

// Reason options for filtering
export const reasonOptions = [
  { value: 2, label: 'CI' }, // IndividualCI
  { value: 1, label: 'Manual' },
  { value: 8, label: 'Scheduled' },
  { value: 256, label: 'Pull Request' },
  { value: 4, label: 'Batched CI' },
  { value: '', label: 'All' },
];

// Branch options for filtering
export const branchOptions = [
  { value: 'main', label: 'main' },
  { value: 'develop', label: 'develop' },
  { value: 'release', label: 'release' },
  { value: '', label: 'All' },
];
