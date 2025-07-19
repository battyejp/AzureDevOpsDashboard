# Azure DevOps Dashboard API

This is the backend API component of the Azure DevOps Dashboard application. It's built with ASP.NET Core 8 and provides endpoints to retrieve pipeline, build, and deployment information from Azure DevOps.

## Architecture

The API follows clean architecture principles with:
- **Controllers**: Handle HTTP requests and responses
- **Services**: Implement business logic and external API integration
- **Models**: Represent data structures

## Project Structure

```
api/
├── AzDevOpsApi/                    # Main API project
│   ├── Controllers/                # API endpoint controllers
│   │   ├── BuildsController.cs     # Retrieve builds for pipelines
│   │   ├── BuildTimelineController.cs # Get build timeline details
│   │   ├── DeployedBuildsController.cs # Find deployed builds in environments
│   │   ├── PipelinesController.cs  # Get pipeline definitions
│   │   └── ProjectsController.cs   # List Azure DevOps projects
│   ├── Models/                     # Data models
│   │   └── AzureDevOps/           # Azure DevOps API models
│   ├── Services/                   # Business logic
│   │   ├── AzureDevOpsService.cs  # Azure DevOps API client
│   │   └── IAzureDevOpsService.cs # Service interface
│   ├── appsettings.json           # Application configuration
│   ├── appsettings.Development.json # Development configuration
│   └── Program.cs                 # Application entry point
├── AzDevOpsApi.Tests/             # Test project
│   ├── Controllers/               # Controller tests
│   ├── TestData/                  # Mock response data
│   │   ├── sample_builds_response.json
│   │   ├── sample_projects_response.json
│   │   ├── sample_response.json
│   │   └── sample_timeline_response.json
│   └── AzDevOpsApi.Tests.csproj
├── AzDevOpsDashboard.sln          # Solution file
└── Dockerfile                     # Docker configuration
```

## API Endpoints

The API provides the following endpoints:

- **Projects**
  - `GET /api/projects` - Get all projects in the organization
  
- **Pipelines**
  - `GET /api/pipelines?project={project}` - Get pipelines for a specific project
  
- **Builds**
  - `GET /api/builds/{pipelineId}?project={project}` - Get builds for a specific pipeline
  - `GET /api/buildtimeline/{buildId}?project={project}` - Get the timeline for a specific build
  
- **Deployments**
  - `GET /api/deployedbuilds/{pipelineId}/{environment}?project={project}` - Get the latest build deployed to a specific environment

## Configuration

### Development Setup

1. **Copy the template configuration file:**
   ```bash
   cp appsettings.Development.json.template appsettings.Development.json
   ```

2. **Update the development configuration** with your Azure DevOps details:
   ```json
   {
     "AzureDevOps": {
       "Organization": "your-organization-name",
       "PAT": "your-personal-access-token"
     }
   }
   ```

   ⚠️ **Security Note**: The `appsettings.Development.json` file is ignored by git to prevent accidental commit of sensitive information.

### Production Configuration

For production deployments, use environment variables instead of configuration files:

- `AZDEVOPS_ORGANIZATION`: Your Azure DevOps organization name
- `AZDEVOPS_PAT`: Your Azure DevOps Personal Access Token

### appsettings.json

The base configuration in `appsettings.json` uses placeholders that get replaced by environment variables:

```json
{
  "AzureDevOps": {
    "Organization": "#{AZDEVOPS_ORGANIZATION}#",
    "PAT": "#{AZDEVOPS_PAT}#"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}
```

### CORS Configuration

The API is configured to allow cross-origin requests from the React frontend:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", 
        builder => 
        {
            builder
                .WithOrigins(
                    "http://localhost:3000", // React development server
                    "http://localhost:5173"  // Vite development server (if used)
                )
                .AllowAnyMethod()
                .AllowAnyHeader();
        });
});
```

## Dependencies

The API has the following key dependencies:

- **ASP.NET Core 8**: Web framework
- **Microsoft.TeamFoundationServer.Client**: Azure DevOps API client
- **Swashbuckle.AspNetCore**: Swagger/OpenAPI documentation

## Testing

The test project uses:

- **xUnit**: Testing framework
- **NSubstitute**: Mocking library
- **WireMock.Net**: HTTP request/response mocking
- **Microsoft.AspNetCore.Mvc.Testing**: Integration testing utilities

### Running Tests

```bash
cd api
dotnet test
```

## Development

### Prerequisites

- .NET 8 SDK
- Azure DevOps Personal Access Token

### Running Locally

1. Navigate to the API project directory:
```bash
cd api/AzDevOpsApi
```

2. Run the API:
```bash
dotnet run
```

The API will be available at:
- HTTP: http://localhost:5031
- HTTPS: https://localhost:7246 (development only)
- Swagger UI: http://localhost:5031/swagger

### Docker

To build and run the API in Docker:

```bash
# From the root directory
docker build -t azdevops-dashboard-api -f api/Dockerfile ./api
docker run -p 5031:80 azdevops-dashboard-api
```

## Security

- The API uses Azure DevOps Personal Access Tokens for authentication
- Sensitive configuration is stored in environment variables for production deployments
- CORS is configured to restrict access to known frontend origins
