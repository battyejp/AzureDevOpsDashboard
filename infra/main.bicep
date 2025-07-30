targetScope = 'subscription'

@description('The name of the environment (e.g., dev, staging, prod)')
param environment string = 'prod'

@description('The location where resources will be deployed')
param location string = 'eastus'

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
var resourceGroupName = 'rg-${appName}-${environment}'
var staticWebAppName = '${appName}-${environment}'
var tags = {
  Environment: environment
  Application: appName
  'Deployed-By': 'GitHub-Actions'
}

// Resource Group
resource resourceGroup 'Microsoft.Resources/resourceGroups@2023-07-01' = {
  name: resourceGroupName
  location: location
  tags: tags
}

// Static Web App
module staticWebApp 'modules/staticwebapp.bicep' = {
  name: 'staticWebApp'
  scope: resourceGroup
  params: {
    staticWebAppName: staticWebAppName
    location: location
    tags: tags
    repositoryUrl: repositoryUrl
    branch: branch
    repositoryToken: repositoryToken
  }
}

// Outputs
output staticWebAppUrl string = staticWebApp.outputs.defaultHostname
output staticWebAppName string = staticWebApp.outputs.name
output resourceGroupName string = resourceGroup.name
