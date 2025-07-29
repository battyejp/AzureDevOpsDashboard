import { useState, useCallback } from 'react';
import { ApiService } from '../services/apiService';
import { JiraIssue } from '../models/types';
import { appConfig } from '../config/appConfig';

/**
 * Custom hook for managing Jira issue loading and caching
 */
export function useJira() {
  const [jiraIssues, setJiraIssues] = useState<Map<string, JiraIssue>>(new Map());
  const [jiraLoading, setJiraLoading] = useState<Set<string>>(new Set());

  // Load Jira issue for a specific issue key (memoized to avoid changing on every render)
  const loadJiraIssue = useCallback(async (issueKey: string) => {
    if (jiraIssues.has(issueKey) || jiraLoading.has(issueKey) || !appConfig.jiraEnabled) {
      return; // Already loaded or loading, or Jira is disabled
    }
    try {
      // Add to loading set
      setJiraLoading(prev => new Set(prev).add(issueKey));
      console.log(`Loading Jira issue ${issueKey}`);
      const issue = await ApiService.getJiraIssue(issueKey);
      if (issue) {
        console.log(`Got Jira issue ${issueKey}:`, issue);
        setJiraIssues(prev => new Map(prev).set(issueKey, issue));
      } else {
        console.log(`No Jira issue data for ${issueKey}`);
      }
    } catch (err) {
      console.error(`Failed to load Jira issue ${issueKey}:`, err);
    } finally {
      // Remove from loading set
      setJiraLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(issueKey);
        return newSet;
      });
    }
  }, [jiraIssues, jiraLoading]);

  return {
    jiraIssues,
    jiraLoading,
    loadJiraIssue
  };
}