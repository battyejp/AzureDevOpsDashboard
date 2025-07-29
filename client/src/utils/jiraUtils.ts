/**
 * Utility functions for Jira integration
 */

/**
 * Extracts Jira issue key from build/release tags
 * Looks for tags matching the pattern 'Xen<number>' (e.g., 'Xen123', 'Xen456')
 * @param tags Array of tag strings
 * @returns Jira issue key if found, null otherwise
 */
export function extractJiraIssueKey(tags: string[]): string | null {
  if (!tags || tags.length === 0) {
    return null;
  }

  // Look for tags matching the pattern Xen<number>
  const jiraPattern = /^Xen\d+$/i;
  
  for (const tag of tags) {
    if (jiraPattern.test(tag)) {
      return tag;
    }
  }
  
  return null;
}

/**
 * Checks if Jira status should be displayed based on the presence of Jira issue key in tags
 * @param tags Array of tag strings
 * @returns true if Jira status should be shown, false otherwise
 */
export function shouldShowJiraStatus(tags: string[]): boolean {
  return extractJiraIssueKey(tags) !== null;
}

/**
 * Determines if a Jira status represents a completed state
 * @param status Jira issue status object or string
 * @returns true if status indicates completion, false otherwise
 */
export function isJiraStatusDone(status: { name: string } | string): boolean {
  const statusName = typeof status === 'string' ? status : status.name;
  return statusName.toLowerCase() === 'done';
}