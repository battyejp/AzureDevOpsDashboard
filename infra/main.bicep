targetScope = 'subscription'

@description('The name of the environment (e.g., dev, staging, prod)')
param environment string = 'prod'

@description('The location where resources will be deployed')
param location string = 'eastus2'

@description('The name of the application')
param appName string = 'azdevops-dashboard'

@description('The GitHub repository URL (reserved for future use)')
param repositoryUrl string

@description('The GitHub repository token for deployment (reserved for future use)')
@secure()
param repositoryToken string

// Variables
var resourceGroupName = 'rg-${appName}-${environment}-v2'
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
  }
}

// Outputs
output staticWebAppUrl string = staticWebApp.outputs.defaultHostname
output staticWebAppName string = staticWebApp.outputs.name
output staticWebAppResourceId string = staticWebApp.outputs.resourceId
output resourceGroupName string = resourceGroup.name
