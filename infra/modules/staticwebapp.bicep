@description('The name of the Static Web App')
param staticWebAppName string

@description('The location where the Static Web App will be deployed')
param location string

@description('Tags to apply to the Static Web App')
param tags object = {}

// Static Web App resource
resource staticWebApp 'Microsoft.Web/staticSites@2023-01-01' = {
  name: staticWebAppName
  location: location
  tags: tags
  properties: {
    // Configure for manual deployment (not linked to GitHub repo)
    buildProperties: {
      appLocation: '/client'
      outputLocation: 'build'
      skipGithubActionWorkflowGeneration: true
    }
    // Enable staging environments
    allowConfigFileUpdates: true
    stagingEnvironmentPolicy: 'Enabled'
  }
  sku: {
    name: 'Free'
    tier: 'Free'
  }
}

// Outputs
output name string = staticWebApp.name
output defaultHostname string = staticWebApp.properties.defaultHostname
output resourceId string = staticWebApp.id