# Azure Deployment Setup Guide

This guide will help you set up automated deployment of your Azure DevOps Dashboard to Azure using GitHub Actions and Infrastructure as Code (Bicep).

## Prerequisites

1. **Azure Account**: You need an active Azure subscription
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Azure CLI**: Install Azure CLI locally for setup commands

## Initial Setup

### 1. Create Azure Service Principal

Run these commands in Azure CLI to create a service principal for GitHub Actions:

```bash
# Login to Azure
az login

# Set your subscription (replace with your subscription ID)
az account set --subscription "your-subscription-id"

# Create a service principal
az ad sp create-for-rbac \
  --name "sp-azdevops-dashboard-github" \
  --role "Contributor" \
  --scopes "/subscriptions/your-subscription-id" \
  --sdk-auth
```

**Important**: Save the JSON output - you'll need it for GitHub secrets!

### 2. Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Create these **Repository Secrets**:

#### Required Azure Secrets:
- `AZURE_CLIENT_ID`: From the service principal JSON (clientId)
- `AZURE_TENANT_ID`: From the service principal JSON (tenantId) 
- `AZURE_SUBSCRIPTION_ID`: Your Azure subscription ID

#### Required Application Secrets:
- `REACT_APP_AZDEVOPS_ORGANIZATION`: Your Azure DevOps organization name
- `REACT_APP_API_URL`: The URL where your API will be hosted

#### Static Web Apps Secret (created later):
- `AZURE_STATIC_WEB_APPS_API_TOKEN`: Will be obtained after first deployment

### 3. Update Configuration

Edit `infra/main.parameters.json` and update:
- `repositoryUrl`: Your GitHub repository URL
- `appName`: Your preferred application name (will be used in Azure resource names)

### 4. First Deployment

#### Option A: Deploy via GitHub Actions (Recommended)
1. Push your code to the `main` branch
2. GitHub Actions will automatically run the deployment
3. Check the Actions tab for deployment progress

#### Option B: Deploy manually first
```bash
# Create resource group
az group create \
  --name rg-azdevops-dashboard \
  --location eastus

# Deploy infrastructure
az deployment group create \
  --resource-group rg-azdevops-dashboard \
  --template-file infra/main.bicep \
  --parameters @infra/main.parameters.json \
  --parameters repositoryToken="your-github-token"
```

### 5. Get Static Web Apps API Token

After the first deployment, get the API token:

```bash
# Get the Static Web App deployment token
az staticwebapp secrets list \
  --name "azdevops-dashboard-prod" \
  --resource-group rg-azdevops-dashboard \
  --query "properties.apiKey" \
  --output tsv
```

Add this token as `AZURE_STATIC_WEB_APPS_API_TOKEN` secret in GitHub.

## How It Works

### Infrastructure (Bicep)
- **`infra/main.bicep`**: Defines Azure Static Web Apps resource
- **`infra/main.parameters.json`**: Configuration parameters
- Automatically configures:
  - Build settings for React app
  - GitHub integration
  - Custom domains (when configured)

### Deployment Pipeline
1. **Build Stage**: Compiles and tests the React application
2. **Deploy Stage**: 
   - Deploys infrastructure using Bicep
   - Deploys application to Static Web Apps
3. **Smoke Test Stage**: Runs tests against the deployed application

### Triggers
- **Automatic**: Triggered on push to `main` branch when client or infra files change
- **Manual**: Can be triggered via GitHub Actions UI with environment selection

## Monitoring and Management

### View Deployed Application
After successful deployment, your app will be available at:
`https://[app-name]-[environment].[random-id].azurestaticapps.net`

### Azure Portal
- Navigate to Azure Portal → Static Web Apps
- View deployment logs, configure custom domains, manage environments

### GitHub Actions
- Monitor deployments in the Actions tab
- View deployment summaries and links to live application

## Customization

### Environment Variables
Add any new environment variables to:
- GitHub Secrets (for sensitive values)
- The build step in `.github/workflows/deploy-azure.yml`

### Custom Domains
Uncomment and configure the custom domain section in `infra/main.bicep`

### Multiple Environments
- Use the manual workflow trigger to deploy to staging
- Modify the parameters file for different environment configurations

### API Backend
When you're ready to deploy your .NET API:
1. Add Azure Container Apps or App Service to the Bicep template
2. Update the `REACT_APP_API_URL` to point to your deployed API

## Troubleshooting

### Common Issues:
1. **Service Principal Permissions**: Ensure the service principal has Contributor role
2. **Secret Names**: Double-check secret names match exactly
3. **Resource Names**: Azure resource names must be globally unique
4. **Build Failures**: Check the build logs in GitHub Actions

### Useful Commands:
```bash
# Check Azure resources
az resource list --resource-group rg-azdevops-dashboard

# View Static Web App details
az staticwebapp show \
  --name "azdevops-dashboard-prod" \
  --resource-group rg-azdevops-dashboard

# Delete everything (if needed)
az group delete --name rg-azdevops-dashboard --yes
```

## Security Best Practices

1. **Rotate Secrets**: Regularly rotate service principal credentials
2. **Least Privilege**: Use minimal required permissions
3. **Environment Separation**: Use different resource groups for different environments
4. **Monitoring**: Set up Azure Monitor alerts for your resources

## Cost Management

- **Static Web Apps**: Free tier available (100GB bandwidth/month)
- **Resource Groups**: Tag resources for cost tracking
- **Cleanup**: Regularly review and cleanup unused resources

Need help? Check the GitHub Actions logs or Azure Portal for detailed error messages.
