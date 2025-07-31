@description('The prefix for all resources created by this template')
param resourcePrefix string = 'azdevops-dashboard'

@description('The location for all resources')
param location string = 'UK South'

@description('The API URL endpoint (external API)')
param apiUrl string

@description('Environment name (dev, staging, prod)')
@allowed(['dev', 'staging', 'prod'])
param environment string = 'dev'

@description('SKU for the App Service Plan')
@allowed(['F1', 'B1', 'B2', 'B3', 'S1', 'S2', 'S3', 'P1V2', 'P2V2', 'P3V2'])
param appServicePlanSku string = 'B1'

// Variables
var uniqueSuffix = uniqueString(resourceGroup().id)
var webAppName = '${resourcePrefix}-web-${environment}-${uniqueSuffix}'
var appServicePlanName = '${resourcePrefix}-asp-${environment}-${uniqueSuffix}'
var logAnalyticsWorkspaceName = '${resourcePrefix}-logs-${environment}-${uniqueSuffix}'
var applicationInsightsName = '${resourcePrefix}-ai-${environment}-${uniqueSuffix}'

// Create Log Analytics Workspace
resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: logAnalyticsWorkspaceName
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// Create Application Insights
resource applicationInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: applicationInsightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalyticsWorkspace.id
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

// Create App Service Plan
resource appServicePlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: appServicePlanName
  location: location
  properties: {
    reserved: true // Required for Linux
  }
  sku: {
    name: appServicePlanSku
  }
  kind: 'linux'
}

// Create Web App Service for React Frontend
resource webApp 'Microsoft.Web/sites@2022-09-01' = {
  name: webAppName
  location: location
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'NODE|18-lts'
      alwaysOn: appServicePlanSku != 'F1' // F1 doesn't support always on
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      http20Enabled: true
      defaultDocuments: [
        'index.html'
      ]
      appSettings: [
        {
          name: 'NODE_ENV'
          value: environment == 'prod' ? 'production' : 'development'
        }
        {
          name: 'WEBSITE_RUN_FROM_PACKAGE'
          value: '1'
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: applicationInsights.properties.ConnectionString
        }
      ]
    }
    httpsOnly: true
  }
}

// Output values
output resourceGroupName string = resourceGroup().name
output webAppName string = webApp.name
output webAppUrl string = 'https://${webApp.properties.defaultHostName}'
output applicationInsightsName string = applicationInsights.name
output appServicePlanName string = appServicePlan.name
