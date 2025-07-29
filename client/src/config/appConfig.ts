/**
 * Application configuration settings
 */
export const appConfig = {
  /**
   * Azure DevOps organization name
   * Set via REACT_APP_AZDEVOPS_ORGANIZATION environment variable
   */
  azureDevOpsOrganization: process.env.REACT_APP_AZDEVOPS_ORGANIZATION || 'YOUR_ORGANIZATION_HERE',

  /**
   * Base API URL for the backend
   */
  apiBaseUrl: process.env.REACT_APP_API_URL || 'http://localhost:5031/api',

  /**
   * Indicates if the API is mocked
   * Set via REACT_APP_API_IS_MOCKED environment variable
   */
  apiIsMocked: !process.env.REACT_APP_API_URL,

  /**
   * Jira Host (without protocol)
   * Set via REACT_APP_JIRA_HOST environment variable
   */
  jiraHost: process.env.REACT_APP_JIRA_HOST || 'localhost:9999',
};
