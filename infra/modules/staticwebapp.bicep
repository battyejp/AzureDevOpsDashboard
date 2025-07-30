@description('Name of the Static Web App')
param staticWebAppName string

@description('Location for the Static Web App')
param location string

@description('Tags for the Static Web App')
param tags object

@description('GitHub repository URL')
param repositoryUrl string

@description('GitHub branch')
param branch string

@description('GitHub repository token')
@secure()
param repositoryToken string

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

// Outputs
output name string = staticWebApp.name
output defaultHostname string = staticWebApp.properties.defaultHostname
output resourceId string = staticWebApp.id
