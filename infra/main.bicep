@description('The name of the environment (e.g., dev, staging, prod)')
param environment string = 'prod'

@description('The location where resources will be deployed')
param location string = resourceGroup().location

@description('The name of the application')
param appName string = 'azdevops-dashboard'

@description('The GitHub repository URL')
param repositoryUrl string

@description('The GitHub branch to deploy from')
param branch string = 'main'

@description('GitHub repository token for deployment')
@secure()
param repositoryToken string

// Variables
var staticWebAppName = '${appName}-${environment}'
var tags = {
  Environment: environment
  Application: appName
  'Deployed-By': 'GitHub-Actions'
}

// Static Web App
resource staticWebApp 'Microsoft.Web/staticSites@2023-01-01' = {
  name: staticWebAppName
  location: location
  tags: tags
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    repositoryUrl: repositoryUrl
    branch: branch
    repositoryToken: repositoryToken
    buildProperties: {
      appLocation: '/client'
      apiLocation: ''
      outputLocation: 'build'
      appBuildCommand: 'npm run build'
      apiBuildCommand: ''
      skipGithubActionWorkflowGeneration: true
    }
  }
}

// Custom domain (optional - uncomment if you have a custom domain)
// resource customDomain 'Microsoft.Web/staticSites/customDomains@2023-01-01' = {
//   parent: staticWebApp
//   name: 'your-custom-domain.com'
//   properties: {}
// }

// Outputs
output staticWebAppUrl string = staticWebApp.properties.defaultHostname
output staticWebAppName string = staticWebApp.name
output resourceGroupName string = resourceGroup().name
