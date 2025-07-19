# Azure DevOps Dashboard

A full-stack dashboard application for visualizing and monitoring Azure DevOps pipelines and builds across different environments. The application includes a React TypeScript frontend with Material-UI and an ASP.NET Core 8 backend API.

## Features

- **Real-time Pipeline Monitoring**: View build and deployment status across projects
- **Environment Filtering**: Filter by Development, Test, and Production environments
- **Responsive Design**: Modern Material-UI interface that works on all devices
- **Live Updates**: Pipeline status updates as builds complete
- **Docker Deployment**: Fully containerized for easy deployment and scaling

## Architecture

### Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React UI      │    │   ASP.NET API   │    │   Azure DevOps  │
│   (Frontend)    │◄──►│   (Backend)     │◄──►│   (Data Source) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack

- **Frontend**: 
  - React 18 with TypeScript
  - Material-UI for responsive components
  - Modern React hooks and context API
  - Axios for API communication

- **Backend**:
  - ASP.NET Core 8 Web API
  - Azure DevOps REST API integration
  - Swagger/OpenAPI documentation
  - Clean architecture principles

- **DevOps**:
  - Docker and Docker Compose
  - Multi-stage builds
  - Nginx for frontend serving and API proxying
  - PowerShell automation scripts

## Project Structure

```
AzDevOpsDashboard/
├── api/                          # ASP.NET Core API
│   ├── AzDevOpsApi/
│   │   ├── Controllers/          # API Controllers
│   │   ├── Models/               # Data Models
│   │   ├── Services/             # Business Logic
│   │   └── appsettings.json      # Configuration
│   ├── AzDevOpsApi.Tests/        # Unit Tests
│   ├── README.md                 # API Documentation
│   └── Dockerfile                # API Docker config
├── client/                       # React Frontend
│   ├── src/
│   │   ├── components/           # React Components
│   │   ├── models/               # TypeScript Models
│   │   ├── services/             # API Services
│   │   └── App.tsx               # Main App Component
│   ├── README.md                 # Client Documentation
│   ├── Dockerfile                # Client Docker config
│   └── package.json              # NPM Dependencies
├── docker-compose.yml              # Docker Compose config
├── docker-compose.override.yml.template # Development overrides template
├── start-dev.ps1                 # Development startup script
├── stop-dev.ps1                  # Development cleanup script
└── status-check.ps1              # Health monitoring script
```

### Configuration Templates

🔒 **Security Feature**: This project uses template files to protect sensitive configuration from being committed to git:

- `api/AzDevOpsApi/appsettings.Development.json.template` → Copy to `appsettings.Development.json`
- `docker-compose.override.yml.template` → Copy to `docker-compose.override.yml` 
- `client/.env.template` → Copy to `client/.env`

The actual configuration files (without `.template`) are automatically ignored by git and contain your sensitive Azure DevOps credentials.
```

### Component Documentation

- [**API Documentation**](./api/README.md) - Details about the ASP.NET Core backend
- [**Client Documentation**](./client/README.md) - Information about the React frontend

## Local Development Setup

### Backend Configuration

1. **Create or update `appsettings.Development.json`**

   In the `api/AzDevOpsApi` directory, create or update the `appsettings.Development.json` file with your Azure DevOps credentials:
   
   ```json
   {
     "Logging": {
       "LogLevel": {
         "Default": "Information",
         "Microsoft.AspNetCore": "Warning"
       }
     },
     "AllowedHosts": "*",
     "AzureDevOps": {
       "Organization": "your-organization-name",
       "PAT": "your-personal-access-token"
     }
   }
   ```

   > **Note**: This file is excluded from Git tracking for security reasons. Never commit your PAT to source control.

2. **Obtain an Azure DevOps Personal Access Token (PAT)**

   - Log in to your Azure DevOps organization (https://dev.azure.com/{your-organization})
   - Click on your profile picture in the top right corner
   - Select "Personal access tokens"
   - Click "New Token"
   - Name your token (e.g., "AzDevOpsDashboard")
   - Set the appropriate scope (recommended minimum):
     - Build (Read)
     - Code (Read)
     - Project and Team (Read)
   - Set the expiration as needed
   - Copy the generated token and paste it in your `appsettings.Development.json` file

### Frontend Configuration

1. **Configure the organization name in the frontend**

   The frontend uses a configuration file to store the Azure DevOps organization name. Update the value in `client/src/config/appConfig.ts`:

   ```typescript
   export const appConfig = {
     /**
      * Azure DevOps organization name
      */
     azureDevOpsOrganization: 'your-organization-name',

     /**
      * Base API URL for the backend
      */
     apiBaseUrl: 'http://localhost:5001/api',
   };
   ```

### Getting Started

1. **Clone the repository**
   ```powershell
   git clone <repository-url>
   cd AzureDevOpsDashboard
   ```

2. **Configure your development environment**
   
   **🔒 Important**: This project uses template files to keep sensitive configuration out of git.
   
   a. **Copy and configure API settings:**
   ```powershell
   # Copy the template file
   Copy-Item "api\AzDevOpsApi\appsettings.Development.json.template" "api\AzDevOpsApi\appsettings.Development.json"
   ```
   
   Then edit `api/AzDevOpsApi/appsettings.Development.json` and replace:
   - `YOUR_ORGANIZATION_HERE` with your Azure DevOps organization name
   - `YOUR_PERSONAL_ACCESS_TOKEN_HERE` with your Azure DevOps Personal Access Token
   
   b. **Copy and configure Docker settings:**
   ```powershell
   # Copy the template file  
   Copy-Item "docker-compose.override.yml.template" "docker-compose.override.yml"
   ```
   
   Then edit `docker-compose.override.yml` and replace the placeholder values with your actual credentials.
   
   c. **Copy and configure client environment:**
   ```powershell
   # Copy the template file
   Copy-Item "client\.env.template" "client\.env"
   ```
   
   Then edit `client/.env` and replace `YOUR_ORGANIZATION_HERE` with your actual organization name.

3. **Start the development environment**
   ```powershell
   .\start-dev.ps1
   ```
   
   This script automatically starts both the API and React client.

4. **Access the application**
   - Frontend: http://localhost:3000
   - API: http://localhost:5031
   - API Documentation: http://localhost:5031/swagger

### Security Notes

⚠️ **Important**: The following files contain sensitive data and are excluded from git:
- `api/AzDevOpsApi/appsettings.Development.json`
- `docker-compose.override.yml`
- `client/.env`

These files will never be committed to the repository, protecting your Azure DevOps credentials.

### Docker Deployment

1. **Set up configuration files**
   
   Follow step 2 from "Getting Started" above to create your configuration files from templates.

2. **Build and run the containers**
   ```powershell
   docker-compose up --build
   ```
   
   For background execution:
   ```powershell
   docker-compose up -d --build
   ```

3. **Access the application**
   - Application: http://localhost:3000
   - API: http://localhost:5031

## API Endpoints

The API provides the following endpoints to retrieve information from Azure DevOps:

- `GET /api/projects` - Get all projects in the organization
- `GET /api/pipelines?project={project}` - Get pipelines for a specific project
- `GET /api/builds/{pipelineId}?project={project}` - Get builds for a specific pipeline
- `GET /api/buildtimeline/{buildId}?project={project}` - Get the timeline for a specific build
- `GET /api/deployedbuilds/{pipelineId}/{environment}?project={project}` - Get the latest build deployed to a specific environment

## Azure DevOps Setup

### Required Permissions

To use this dashboard, you'll need:

1. **Create a Personal Access Token (PAT)**
   - Go to Azure DevOps → User Settings → Personal Access Tokens
   - Create a new token with the following permissions:
     - Build (read)
     - Project and Team (read)
     - Code (read)
   - Set an appropriate expiration date

2. **Organization and Project Access**
   - You must have access to the Azure DevOps organization and projects you want to monitor
   - The dashboard will only display projects you have permission to access

### Configuring Your Credentials

For development:
- Backend: Update `api/AzDevOpsApi/appsettings.Development.json` with your organization name and PAT
- Frontend: Update `client/src/config/appConfig.ts` with your organization name

For production:
- Set environment variables in `docker-compose.yml` or your hosting environment
- Never commit your PAT to source control
- Consider using Azure Key Vault or similar secret management solutions for production

## Development Utilities

### PowerShell Scripts

- **Start Development**: `.\start-dev.ps1`
  - Launches both the API and React client
  - Opens browser with frontend URL

- **Check Status**: `.\status-check.ps1`
  - Verifies if services are running
  - Tests API connectivity
  - Shows port status

- **Stop Development**: `.\stop-dev.ps1`
  - Gracefully shuts down API and client
  - Terminates all related processes

## Troubleshooting

### Common Issues

1. **API Connection Errors**
   - Ensure the API is running on http://localhost:5031
   - Check CORS settings in `Program.cs`
   - Verify Azure DevOps PAT permissions and expiration

2. **Build Failures**
   - Check Azure DevOps organization and project names
   - Verify network connectivity to Azure DevOps
   - Ensure the PAT has the correct permissions

3. **Common Issues**
   - Ensure your PAT has not expired
   - Check that your organization name is correct in both frontend and backend configurations
   - Verify the organization has the project(s) you're trying to access
   - Make sure your Azure DevOps account has permission to view the projects and pipelines
   - Check browser console for frontend errors
   - Check API logs for backend errors

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request
