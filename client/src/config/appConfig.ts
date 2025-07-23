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
};
