import { renderHook, act } from '@testing-library/react';
import { useJira } from './useJira';
import { ApiService } from '../services/apiService';
import { appConfig } from '../config/appConfig';
import { JiraIssue } from '../models/types';

// Mock dependencies
jest.mock('../services/apiService');
jest.mock('../config/appConfig', () => ({
  appConfig: {
    jiraEnabled: true
  }
}));

const mockApiService = ApiService as jest.Mocked<typeof ApiService>;

describe('useJira Hook', () => {
  const mockJiraIssue: JiraIssue = {
    id: 'PROJ-123',
    key: 'PROJ-123',
    fields: {
      summary: 'Test Issue',
      status: {
        name: 'Open',
      },
      assignee: 'John Doe'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset appConfig to enabled state
    (appConfig as any).jiraEnabled = true;
  });

  test('should initialize with empty state', () => {
    const { result } = renderHook(() => useJira());

    expect(result.current.jiraIssues.size).toBe(0);
    expect(result.current.jiraLoading.size).toBe(0);
    expect(typeof result.current.loadJiraIssue).toBe('function');
  });

  test('should load Jira issue successfully', async () => {
    mockApiService.getJiraIssue.mockResolvedValue(mockJiraIssue);
    
    const { result } = renderHook(() => useJira());

    await act(async () => {
      await result.current.loadJiraIssue('PROJ-123');
    });

    expect(mockApiService.getJiraIssue).toHaveBeenCalledWith('PROJ-123');
    expect(result.current.jiraIssues.get('PROJ-123')).toEqual(mockJiraIssue);
    expect(result.current.jiraLoading.has('PROJ-123')).toBe(false);
  });

  test('should handle loading state correctly', async () => {
    // Mock a delayed response
    let resolvePromise: (value: JiraIssue) => void;
    const delayedPromise = new Promise<JiraIssue>((resolve) => {
      resolvePromise = resolve;
    });
    mockApiService.getJiraIssue.mockReturnValue(delayedPromise);

    const { result } = renderHook(() => useJira());

    // Start loading
    act(() => {
      result.current.loadJiraIssue('PROJ-123');
    });

    // Should be in loading state
    expect(result.current.jiraLoading.has('PROJ-123')).toBe(true);
    expect(result.current.jiraIssues.has('PROJ-123')).toBe(false);

    // Resolve the promise
    await act(async () => {
      resolvePromise!(mockJiraIssue);
      await delayedPromise;
    });

    // Should no longer be loading and should have the issue
    expect(result.current.jiraLoading.has('PROJ-123')).toBe(false);
    expect(result.current.jiraIssues.get('PROJ-123')).toEqual(mockJiraIssue);
  });

  test('should not load issue if already loaded', async () => {
    mockApiService.getJiraIssue.mockResolvedValue(mockJiraIssue);
    
    const { result } = renderHook(() => useJira());

    // Load issue first time
    await act(async () => {
      await result.current.loadJiraIssue('PROJ-123');
    });

    expect(mockApiService.getJiraIssue).toHaveBeenCalledTimes(1);

    // Try to load again
    await act(async () => {
      await result.current.loadJiraIssue('PROJ-123');
    });

    // Should not have called API again
    expect(mockApiService.getJiraIssue).toHaveBeenCalledTimes(1);
  });

  test('should not load issue if currently loading', async () => {
    // Mock a promise that never resolves for this test
    const neverResolvePromise = new Promise<JiraIssue>(() => {});
    mockApiService.getJiraIssue.mockReturnValue(neverResolvePromise);

    const { result } = renderHook(() => useJira());

    // Start loading
    act(() => {
      result.current.loadJiraIssue('PROJ-123');
    });

    // Try to load again while still loading
    act(() => {
      result.current.loadJiraIssue('PROJ-123');
    });

    // Should only have called API once
    expect(mockApiService.getJiraIssue).toHaveBeenCalledTimes(1);
  });

  test('should not load issue if Jira is disabled', async () => {
    (appConfig as any).jiraEnabled = false;
    
    const { result } = renderHook(() => useJira());

    await act(async () => {
      await result.current.loadJiraIssue('PROJ-123');
    });

    expect(mockApiService.getJiraIssue).not.toHaveBeenCalled();
    expect(result.current.jiraIssues.has('PROJ-123')).toBe(false);
    expect(result.current.jiraLoading.has('PROJ-123')).toBe(false);
  });

  test('should handle API errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    mockApiService.getJiraIssue.mockRejectedValue(new Error('API Error'));
    
    const { result } = renderHook(() => useJira());

    await act(async () => {
      await result.current.loadJiraIssue('PROJ-123');
    });

    expect(consoleSpy).toHaveBeenCalledWith('Failed to load Jira issue PROJ-123:', expect.any(Error));
    expect(result.current.jiraIssues.has('PROJ-123')).toBe(false);
    expect(result.current.jiraLoading.has('PROJ-123')).toBe(false);

    consoleSpy.mockRestore();
  });

  test('should handle null response from API', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    mockApiService.getJiraIssue.mockResolvedValue(null);
    
    const { result } = renderHook(() => useJira());

    await act(async () => {
      await result.current.loadJiraIssue('PROJ-123');
    });

    expect(consoleSpy).toHaveBeenCalledWith('No Jira issue data for PROJ-123');
    expect(result.current.jiraIssues.has('PROJ-123')).toBe(false);
    expect(result.current.jiraLoading.has('PROJ-123')).toBe(false);

    consoleSpy.mockRestore();
  });

  test('should load multiple different issues', async () => {
    const issue1: JiraIssue = { ...mockJiraIssue, id: 'PROJ-123', key: 'PROJ-123' };
    const issue2: JiraIssue = { ...mockJiraIssue, id: 'PROJ-456', key: 'PROJ-456' };
    
    mockApiService.getJiraIssue
      .mockResolvedValueOnce(issue1)
      .mockResolvedValueOnce(issue2);
    
    const { result } = renderHook(() => useJira());

    await act(async () => {
      await result.current.loadJiraIssue('PROJ-123');
      await result.current.loadJiraIssue('PROJ-456');
    });

    expect(result.current.jiraIssues.get('PROJ-123')).toEqual(issue1);
    expect(result.current.jiraIssues.get('PROJ-456')).toEqual(issue2);
    expect(result.current.jiraIssues.size).toBe(2);
  });
});