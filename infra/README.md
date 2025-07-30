# Infrastructure as Code (IaC) - Azure Deployment

This directory contains all the Infrastructure as Code (IaC) files and scripts needed to deploy your Azure DevOps Dashboard to Microsoft Azure using Azure Static Web Apps.

## 📁 Directory Structure

```
infra/
├── main.bicep                     # Main Bicep template for Azure resources
├── main.parameters.json           # Parameters for the Bicep template
├── DEPLOYMENT_GUIDE.md           # Comprehensive setup guide
├── README.md                     # This file
└── scripts/
    ├── deploy.ps1                # PowerShell deployment script
    ├── cleanup.ps1               # PowerShell cleanup script
    ├── get-secrets.ps1            # Script to retrieve secrets
    └── README.md                 # Scripts documentation
```

## 🚀 Quick Start

### Prerequisites
- Azure subscription
- GitHub repository
- Azure CLI installed locally

### 1. Set up Azure Service Principal
```bash
az ad sp create-for-rbac \
  --name "sp-azdevops-dashboard-github" \
  --role "Contributor" \
  --scopes "/subscriptions/your-subscription-id" \
  --sdk-auth
```

### 2. Configure GitHub Secrets
Add these secrets to your GitHub repository:
- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID` 
- `AZURE_SUBSCRIPTION_ID`
- `REACT_APP_AZDEVOPS_ORGANIZATION`
- `REACT_APP_API_URL`

### 3. Deploy
Push to the `main` branch or manually trigger the deployment workflow.

## 🏗️ Architecture

### Azure Resources Created
- **Azure Static Web Apps**: Hosts your React application
- **Resource Group**: Contains all related resources
- **GitHub Integration**: Automatic deployments from your repository

### Deployment Pipeline
1. **Build**: Compile and test React application
2. **Infrastructure**: Deploy Azure resources using Bicep
3. **Application**: Deploy built application to Static Web Apps
4. **Validation**: Run smoke tests against deployed application

## 🔧 Configuration

### Environment Variables
The application uses these environment variables:
- `REACT_APP_AZDEVOPS_ORGANIZATION`: Your Azure DevOps organization
- `REACT_APP_API_URL`: URL of your backend API

### Bicep Parameters
Customize deployment by editing `main.parameters.json`:
- `environment`: Target environment (prod, staging)
- `appName`: Application name (used in resource naming)
- `repositoryUrl`: Your GitHub repository URL
- `branch`: Git branch to deploy from

## 🛠️ Local Development Scripts

### Deploy Infrastructure
```powershell
.\scripts\deploy.ps1 -GitHubToken "your-github-token"
```

### Get Deployment Secrets
```powershell
.\scripts\get-secrets.ps1
```

### Cleanup Resources
```powershell
.\scripts\cleanup.ps1
```

## 🌐 Static Web App Configuration

The application includes `staticwebapp.config.json` which configures:
- Routing rules for SPA behavior
- Security headers
- API proxying (when API is added)
- Fallback routes

## 📋 Features

### ✅ Automated Deployment
- Deploys on every push to main branch
- Manual deployment option with environment selection
- Automatic infrastructure provisioning

### ✅ Zero Downtime
- Blue-green deployment model
- Staging slots for testing
- Rollback capabilities

### ✅ Security
- Managed identity authentication
- HTTPS by default
- Content Security Policy headers

### ✅ Monitoring
- Application Insights integration ready
- Deployment status tracking
- Error logging and monitoring

## 🔍 Troubleshooting

### Common Issues

1. **Service Principal Permissions**
   - Ensure Contributor role on subscription
   - Check Azure AD permissions

2. **Resource Naming Conflicts**
   - Static Web App names must be globally unique
   - Modify `appName` parameter if needed

3. **GitHub Integration**
   - Verify repository URL is correct
   - Check GitHub token permissions

### Useful Commands

```bash
# Check deployment status
az deployment group show \
  --resource-group rg-azdevops-dashboard \
  --name main

# View Static Web App details
az staticwebapp show \
  --name azdevops-dashboard-prod \
  --resource-group rg-azdevops-dashboard

# List all resources
az resource list \
  --resource-group rg-azdevops-dashboard \
  --output table
```

## 💰 Cost Optimization

- **Static Web Apps**: Free tier (100GB bandwidth/month)
- **Resource tagging**: Automatic cost tracking by environment
- **Auto-scaling**: Scales to zero when not in use

## 🔒 Security Best Practices

1. **Secrets Management**: Use GitHub secrets for sensitive data
2. **Least Privilege**: Service principal with minimal required permissions  
3. **Network Security**: HTTPS enforcement, security headers
4. **Monitoring**: Set up alerts for security events

## 📚 Additional Resources

- [Azure Static Web Apps Documentation](https://docs.microsoft.com/en-us/azure/static-web-apps/)
- [Azure Bicep Documentation](https://docs.microsoft.com/en-us/azure/azure-resource-manager/bicep/)
- [GitHub Actions for Azure](https://docs.microsoft.com/en-us/azure/developer/github/github-actions)

## 🆘 Support

For detailed setup instructions, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

For issues:
1. Check GitHub Actions logs
2. Review Azure Portal deployment status
3. Run local diagnostic scripts
4. Check Azure Monitor for runtime issues
