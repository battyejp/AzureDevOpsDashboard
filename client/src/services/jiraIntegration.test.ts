import { ApiService } from './apiService';
import { MockApiService } from './mockApiService';
import { extractJiraIssueKey, isJiraStatusDone } from '../utils/jiraUtils';

// Test Jira integration functionality
describe('Jira Integration', () => {
  beforeEach(() => {
    // Ensure we're using mock API for tests
    process.env.REACT_APP_API_URL = '';
  });

  describe('MockApiService Jira endpoint', () => {
    it('should return Done status for specific issue keys', async () => {
      const issue = await MockApiService.getJiraIssue('Xen-100');
      expect(issue).not.toBeNull();
      expect(issue?.fields.status.name).toBe('Done');
      expect(issue?.key).toBe('Xen-100');
      expect(issue?.id).toBe('100');
    });

    it('should return non-Done status for other issue keys', async () => {
      const issue = await MockApiService.getJiraIssue('Xen-101');
      expect(issue).not.toBeNull();
      expect(issue?.fields.status.name).not.toBe('Done');
      expect(['In Progress', 'In Review', 'Ready for Test', 'To Do']).toContain(issue?.fields.status.name);
    });

    it('should return null for non-existent issues', async () => {
      const issue = await MockApiService.getJiraIssue('Xen-115'); // 115 % 23 = 0
      expect(issue).toBeNull();
    });

    it('should provide variety in mock responses', async () => {
      const issues = await Promise.all([
        MockApiService.getJiraIssue('Xen-100'), // Should be Done
        MockApiService.getJiraIssue('Xen-101'), // Should be To Do
        MockApiService.getJiraIssue('Xen-102'), // Should be In Progress
        MockApiService.getJiraIssue('Xen-104'), // Should be In Review
      ]);

      const statuses = issues.filter(Boolean).map(issue => issue!.fields.status.name);
      expect(statuses).toContain('Done');
      expect(statuses.length).toBeGreaterThan(2); // Should have variety
    });
  });

  describe('ApiService Jira integration', () => {
    it('should handle Jira API calls through main service', async () => {
      const issue = await ApiService.getJiraIssue('Xen-100');
      expect(issue).not.toBeNull();
      expect(issue?.key).toBe('Xen-100');
    });
  });

  describe('Jira utilities integration', () => {
    it('should extract Jira keys from build tags and check status', () => {
      const tags = ['hotfix', 'Xen-123', 'release'];
      const issueKey = extractJiraIssueKey(tags);
      expect(issueKey).toBe('Xen-123');
      
      // Test both string and object formats
      expect(isJiraStatusDone('Done')).toBe(true);
      expect(isJiraStatusDone('In Progress')).toBe(false);
      expect(isJiraStatusDone({ name: 'Done' })).toBe(true);
      expect(isJiraStatusDone({ name: 'In Progress' })).toBe(false);
    });

    it('should handle case-insensitive Jira key extraction', () => {
      expect(extractJiraIssueKey(['XEN-123'])).toBe('XEN-123');
      expect(extractJiraIssueKey(['xen-456'])).toBe('xen-456');
    });
  });
});