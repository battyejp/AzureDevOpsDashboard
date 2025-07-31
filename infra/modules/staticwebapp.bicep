@description('The name of the Static Web App')
param staticWebAppName string

@description('The location where the Static Web App will be deployed')
param location string

@description('Tags to apply to the Static Web App')
param tags object = {}

@description('The GitHub repository URL')
param repositoryUrl string

@description('The GitHub branch to deploy from')
param branch string = 'main'

@description('GitHub repository token for deployment')
@secure()
param repositoryToken string

@description('SKU for the Static Web App')
param sku object = {
  name: 'Free'
  tier: 'Free'
}

// Static Web App resource
resource staticWebApp 'Microsoft.Web/staticSites@2023-01-01' = {
  name: staticWebAppName
  location: location
  tags: tags
  sku: sku
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

// Custom domain (optional - can be uncommented when needed)
// resource customDomain 'Microsoft.Web/staticSites/customDomains@2023-01-01' = {
//   parent: staticWebApp
//   name: 'example.com'
//   properties: {}
// }

// Outputs
output name string = staticWebApp.name
output id string = staticWebApp.id
output defaultHostname string = staticWebApp.properties.defaultHostname
output repositoryUrl string = staticWebApp.properties.repositoryUrl
output branch string = staticWebApp.properties.branch
output customDomains array = staticWebApp.properties.customDomains