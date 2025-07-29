import { extractJiraIssueKey, shouldShowJiraStatus, isJiraStatusDone } from './jiraUtils';

describe('jiraUtils', () => {
  describe('extractJiraIssueKey', () => {
    it('should extract valid Jira issue key from tags', () => {
      expect(extractJiraIssueKey(['Xen123', 'hotfix'])).toBe('Xen123');
      expect(extractJiraIssueKey(['hotfix', 'Xen456'])).toBe('Xen456');
      expect(extractJiraIssueKey(['XEN789'])).toBe('XEN789');
    });

    it('should return null for invalid tags', () => {
      expect(extractJiraIssueKey(['hotfix', 'feature'])).toBeNull();
      expect(extractJiraIssueKey(['Xenomorphs', 'Xen'])).toBeNull();
      expect(extractJiraIssueKey(['Xen'])).toBeNull();
      expect(extractJiraIssueKey([])).toBeNull();
    });

    it('should handle empty or undefined tags', () => {
      expect(extractJiraIssueKey([])).toBeNull();
    });
  });

  describe('shouldShowJiraStatus', () => {
    it('should return true when Jira issue key exists', () => {
      expect(shouldShowJiraStatus(['Xen123', 'hotfix'])).toBe(true);
      expect(shouldShowJiraStatus(['hotfix', 'Xen456'])).toBe(true);
    });

    it('should return false when no Jira issue key exists', () => {
      expect(shouldShowJiraStatus(['hotfix', 'feature'])).toBe(false);
      expect(shouldShowJiraStatus([])).toBe(false);
    });
  });

  describe('isJiraStatusDone', () => {
    it('should return true for Done status', () => {
      expect(isJiraStatusDone('Done')).toBe(true);
      expect(isJiraStatusDone('done')).toBe(true);
      expect(isJiraStatusDone('DONE')).toBe(true);
    });

    it('should return false for non-Done statuses', () => {
      expect(isJiraStatusDone('In Progress')).toBe(false);
      expect(isJiraStatusDone('To Do')).toBe(false);
      expect(isJiraStatusDone('In Review')).toBe(false);
      expect(isJiraStatusDone('')).toBe(false);
    });
  });
});