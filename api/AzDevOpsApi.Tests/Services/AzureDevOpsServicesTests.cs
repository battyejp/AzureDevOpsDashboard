using AzDevOpsApi.Models;
using AzDevOpsApi.Services;
using Microsoft.Extensions.Logging;
using NSubstitute;
using System.Text.Json;
using WireMock.RequestBuilders;
using WireMock.ResponseBuilders;
using WireMock.Server;
using Xunit;

namespace AzDevOpsApi.Tests.Services;

/// <summary>
/// Integration tests for AzureDevOpsService using WireMock to simulate Azure DevOps REST API endpoints
/// </summary>
public class AzureDevOpsServicesTests : IDisposable
{
    private readonly WireMockServer _wireMockServer;
    private const string TestOrganization = "testorg";
    private const string TestProject = "testproject";
    private const string TestPat = "testpat";

    private readonly AzureDevOpsService _azureDevOpsService;

    public AzureDevOpsServicesTests()
    {
        // Start WireMock server with comprehensive logging
        _wireMockServer = WireMockServer.Start();

        // Log the WireMock server URL for debugging
        Console.WriteLine($"WireMock server started at: {_wireMockServer.Url}");
        
        SetupMockAzureDevOpsEndpoints();

        // Create the service with the HttpClient pointing to WireMock
        _azureDevOpsService = new AzureDevOpsService(Substitute.For<ILogger<AzureDevOpsService>>(), null, _wireMockServer.Url);
    }

    [Fact]
    public async Task GetPipelinesAsync_ShouldReturnExpectedResponse()
    {
        // Arrange
        SetupMockPipelinesEndpoint();
        
        // Act
        var response = await _azureDevOpsService.GetPipelinesAsync(TestProject, TestOrganization, TestPat);

        // Assert
        Assert.NotNull(response);
        Assert.NotEmpty(response);
        
        var pipelines = response.ToList();
        Assert.Equal(2, pipelines.Count);
        Assert.Equal("Pipeline 1", pipelines[0].Name);
        Assert.Equal("Pipeline 2", pipelines[1].Name);
        Assert.Equal(1, pipelines[0].Id);
        Assert.Equal(2, pipelines[1].Id);
        Assert.Equal("enabled", pipelines[0].QueueStatus);
        Assert.Equal("disabled", pipelines[1].QueueStatus);
    }

    [Fact]
    public async Task GetBuildsAsync_ShouldReturnExpectedResponse()
    {
        // Arrange
        const int pipelineId = 1;
        const int count = 5;
        SetupMockBuildsEndpoint(pipelineId, count);
        
        // Act
        var response = await _azureDevOpsService.GetBuildsAsync(TestProject, TestOrganization, TestPat, pipelineId, count);

        // Assert
        Assert.NotNull(response);
        Assert.NotEmpty(response);
        
        var builds = response.ToList();
        Assert.Equal(2, builds.Count);
        Assert.Equal("Build 1", builds[0].BuildNumber);
        Assert.Equal("Build 2", builds[1].BuildNumber);
        Assert.Equal("Completed", builds[0].Status);
        Assert.Equal("InProgress", builds[1].Status);
        Assert.Equal("Succeeded", builds[0].Result);
        Assert.Null(builds[1].Result);
    }

    [Fact]
    public async Task GetBuildTimelineAsync_ShouldReturnExpectedResponse()
    {
        // Arrange
        const int buildId = 123;
        SetupMockBuildTimelineEndpoint(buildId);
        
        // Act
        var response = await _azureDevOpsService.GetBuildTimelineAsync(TestProject, TestOrganization, TestPat, buildId);

        // Assert
        Assert.NotNull(response);
        Assert.Equal("timeline-123", response.Id);
        Assert.NotNull(response.Records);
        Assert.Equal(3, response.Records.Length);
        
        var firstRecord = response.Records[0];
        Assert.Equal("Build", firstRecord.Type);
        Assert.Equal("succeeded", firstRecord.Result);
        Assert.Equal("Build Job", firstRecord.Name);
    }

    [Fact]
    public async Task FindLatestDeployedBuildAsync_WithSuccessfulDeployment_ShouldReturnBuild()
    {
        // Arrange
        const int pipelineId = 1;
        SetupMockBuildsForDeploymentEndpoint(pipelineId);
        SetupMockBuildTimelineForDeploymentEndpoint(100, "Dev", "succeeded");
        
        // Act
        var result = await _azureDevOpsService.FindLatestDeployedBuildAsync(
            TestProject, TestOrganization, TestPat, pipelineId, DeploymentEnvironment.Dev);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(100, result.Id);
        Assert.Equal("Build-100", result.BuildNumber);
    }

    [Fact]
    public async Task FindLatestDeployedBuildAsync_WithNoSuccessfulDeployment_ShouldReturnNull()
    {
        // Arrange
        const int pipelineId = 1;
        SetupMockBuildsForDeploymentEndpoint(pipelineId);
        SetupMockBuildTimelineForDeploymentEndpoint(100, "Dev", "failed");
        
        // Act
        var result = await _azureDevOpsService.FindLatestDeployedBuildAsync(
            TestProject, TestOrganization, TestPat, pipelineId, DeploymentEnvironment.Dev);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task FindLatestDeployedBuildAsync_WithNoMatchingEnvironment_ShouldReturnNull()
    {
        // Arrange
        const int pipelineId = 1;
        SetupMockBuildsForDeploymentEndpoint(pipelineId);
        SetupMockBuildTimelineForDeploymentEndpoint(100, "Production", "succeeded");
        
        // Act
        var result = await _azureDevOpsService.FindLatestDeployedBuildAsync(
            TestProject, TestOrganization, TestPat, pipelineId, DeploymentEnvironment.Dev);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task GetPipelinesAsync_WithHttpError_ShouldThrowException()
    {
        // Arrange
        SetupMockPipelinesEndpointWithError();
        
        // Act & Assert
        await Assert.ThrowsAsync<HttpRequestException>(async () =>
            await _azureDevOpsService.GetPipelinesAsync(TestProject, TestOrganization, TestPat));
    }

    [Fact]
    public async Task GetBuildsAsync_WithHttpError_ShouldThrowException()
    {
        // Arrange
        const int pipelineId = 1;
        const int count = 5;
        SetupMockBuildsEndpointWithError(pipelineId, count);
        
        // Act & Assert
        await Assert.ThrowsAsync<HttpRequestException>(async () =>
            await _azureDevOpsService.GetBuildsAsync(TestProject, TestOrganization, TestPat, pipelineId, count));
    }

    [Fact]
    public async Task GetBuildTimelineAsync_WithHttpError_ShouldThrowException()
    {
        // Arrange
        const int buildId = 123;
        SetupMockBuildTimelineEndpointWithError(buildId);
        
        // Act & Assert
        await Assert.ThrowsAsync<HttpRequestException>(async () =>
            await _azureDevOpsService.GetBuildTimelineAsync(TestProject, TestOrganization, TestPat, buildId));
    }

    [Fact]
    public async Task FindLatestDeployedBuildAsync_WithEmptyTimelineRecords_ShouldReturnNull()
    {
        // Arrange
        const int pipelineId = 1;
        SetupMockBuildsForDeploymentEndpoint(pipelineId);
        SetupMockEmptyTimelineEndpoint(100);
        
        // Act
        var result = await _azureDevOpsService.FindLatestDeployedBuildAsync(
            TestProject, TestOrganization, TestPat, pipelineId, DeploymentEnvironment.Dev);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task FindLatestDeployedBuildAsync_WithNonStageRecords_ShouldReturnNull()
    {
        // Arrange
        const int pipelineId = 1;
        SetupMockBuildsForDeploymentEndpoint(pipelineId);
        SetupMockNonStageTimelineEndpoint(100);
        
        // Act
        var result = await _azureDevOpsService.FindLatestDeployedBuildAsync(
            TestProject, TestOrganization, TestPat, pipelineId, DeploymentEnvironment.Dev);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task FindLatestDeployedBuildAsync_WithTimelineError_ShouldContinueToNextBuild()
    {
        // Arrange
        const int pipelineId = 1;
        
        // Setup two builds, one with error, one with success
        SetupMockMultipleBuildsForDeploymentEndpoint(pipelineId);
        
        // First build will throw error
        SetupMockBuildTimelineEndpointWithError(100);
        
        // Second build has successful deployment
        SetupMockBuildTimelineForDeploymentEndpoint(101, "Dev", "succeeded");
        
        // Act
        var result = await _azureDevOpsService.FindLatestDeployedBuildAsync(
            TestProject, TestOrganization, TestPat, pipelineId, DeploymentEnvironment.Dev);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(101, result.Id);
    }

    [Fact]
    public async Task FindLatestDeployedBuildAsync_WithNoBuilds_ShouldReturnNull()
    {
        // Arrange
        const int pipelineId = 1;
        SetupMockEmptyBuildsForDeploymentEndpoint(pipelineId);
        
        // Act
        var result = await _azureDevOpsService.FindLatestDeployedBuildAsync(
            TestProject, TestOrganization, TestPat, pipelineId, DeploymentEnvironment.Dev);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task GetBuildsAsync_WithEmptyResponse_ShouldReturnEmptyCollection()
    {
        // Arrange
        const int pipelineId = 1;
        const int count = 5;
        SetupMockEmptyBuildsEndpoint(pipelineId, count);
        
        // Act
        var response = await _azureDevOpsService.GetBuildsAsync(TestProject, TestOrganization, TestPat, pipelineId, count);

        // Assert
        Assert.NotNull(response);
        Assert.Empty(response);
    }

    [Fact]
    public async Task GetBuildTimelineAsync_WithNullResponse_ShouldReturnNewTimelineObject()
    {
        // Arrange
        const int buildId = 999;
        SetupMockNullTimelineEndpoint(buildId);
        
        // Act
        var response = await _azureDevOpsService.GetBuildTimelineAsync(TestProject, TestOrganization, TestPat, buildId);

        // Assert
        Assert.NotNull(response);
        Assert.Equal(buildId.ToString(), response.Id);
        Assert.Empty(response.Records);
    }

    [Fact]
    public async Task GetPipelinesAsync_WithMalformedJsonResponse_ShouldThrowException()
    {
        // Arrange
        SetupMockMalformedJsonEndpoint("pipelines");
        
        // Act & Assert
        await Assert.ThrowsAsync<JsonException>(async () =>
            await _azureDevOpsService.GetPipelinesAsync(TestProject, TestOrganization, TestPat));
    }

    [Fact]
    public async Task GetBuildsAsync_WithUnauthorizedResponse_ShouldThrowHttpRequestException()
    {
        // Arrange
        const int pipelineId = 1;
        const int count = 5;
        SetupMockUnauthorizedEndpoint("builds", pipelineId);
        
        // Act & Assert
        var exception = await Assert.ThrowsAsync<HttpRequestException>(async () =>
            await _azureDevOpsService.GetBuildsAsync(TestProject, TestOrganization, TestPat, pipelineId, count));
        
        Assert.Contains("401", exception.Message);
    }

    [Fact]
    public async Task GetBuildTimelineAsync_WithRateLimitedResponse_ShouldThrowHttpRequestException()
    {
        // Arrange
        const int buildId = 123;
        SetupMockRateLimitedEndpoint("timeline", buildId);
        
        // Act & Assert
        var exception = await Assert.ThrowsAsync<HttpRequestException>(async () =>
            await _azureDevOpsService.GetBuildTimelineAsync(TestProject, TestOrganization, TestPat, buildId));
        
        Assert.Contains("429", exception.Message);
    }

    [Fact]
    public async Task FindLatestDeployedBuildAsync_WithBuildNotFoundException_ShouldHandleException()
    {
        // Arrange
        const int pipelineId = 1;
        
        // Setup builds with normal response
        SetupMockBuildsForDeploymentEndpoint(pipelineId);
        
        // Setup timeline with 404
        SetupMockBuildNotFoundEndpoint(100);
        
        // Act & Assert - this should not throw since the service catches exceptions in the loop
        var result = await _azureDevOpsService.FindLatestDeployedBuildAsync(
            TestProject, TestOrganization, TestPat, pipelineId, DeploymentEnvironment.Dev);
        
        Assert.Null(result);
    }

    [Fact]
    public async Task GetProjectsAsync_ShouldReturnExpectedResponse()
    {
        // Arrange
        SetupMockProjectsEndpoint();
        
        // Act
        var response = await _azureDevOpsService.GetProjectsAsync(TestOrganization, TestPat);

        // Assert
        Assert.NotNull(response);
        Assert.NotEmpty(response);
        
        var projects = response.ToList();
        Assert.Equal(2, projects.Count);
        Assert.Equal("Project One", projects[0].Name);
        Assert.Equal("project1", projects[0].Id);
        Assert.Equal("First test project", projects[0].Description);
        Assert.Equal("wellFormed", projects[0].State);

        Assert.Equal("Project Two", projects[1].Name);
        Assert.Equal("project2", projects[1].Id);
        Assert.Equal("Second test project", projects[1].Description);
        Assert.Equal("wellFormed", projects[1].State);
    }

    [Fact]
    public async Task GetProjectsAsync_WithEmptyResponse_ShouldReturnEmptyCollection()
    {
        // Arrange
        SetupMockEmptyProjectsEndpoint();
        
        // Act
        var response = await _azureDevOpsService.GetProjectsAsync(TestOrganization, TestPat);

        // Assert
        Assert.NotNull(response);
        Assert.Empty(response);
    }

    [Fact]
    public async Task GetProjectsAsync_WithUnauthorized_ShouldThrowHttpRequestException()
    {
        // Arrange
        SetupMockProjectsUnauthorizedEndpoint();
        
        // Act & Assert
        var exception = await Assert.ThrowsAsync<HttpRequestException>(
            () => _azureDevOpsService.GetProjectsAsync(TestOrganization, TestPat));
        
        Assert.Equal(System.Net.HttpStatusCode.Unauthorized, exception.StatusCode);
    }

    [Fact]
    public async Task GetProjectsAsync_WithServerError_ShouldThrowHttpRequestException()
    {
        // Arrange
        SetupMockProjectsEndpointWithError();
        
        // Act & Assert
        var exception = await Assert.ThrowsAsync<HttpRequestException>(
            () => _azureDevOpsService.GetProjectsAsync(TestOrganization, TestPat));
        
        Assert.Equal(System.Net.HttpStatusCode.InternalServerError, exception.StatusCode);
    }

    /// <summary>
    /// Sets up mock endpoint for Azure DevOps Build Definitions (Pipelines)
    /// </summary>
    private void SetupMockPipelinesEndpoint()
    {
        var pipelinesResponse = @"
        {
            ""value"": [
                {
                    ""id"": 1,
                    ""name"": ""Pipeline 1"",
                    ""url"": ""https://dev.azure.com/testorg/testproject/_apis/build/Definitions/1"",
                    ""path"": ""\\Folder1"",
                    ""revision"": 5,
                    ""queueStatus"": ""enabled"",
                    ""type"": ""build""
                },
                {
                    ""id"": 2,
                    ""name"": ""Pipeline 2"",
                    ""url"": ""https://dev.azure.com/testorg/testproject/_apis/build/Definitions/2"",
                    ""path"": ""\\Folder2"",
                    ""revision"": 3,
                    ""queueStatus"": ""disabled"",
                    ""type"": ""build""
                }
            ]
        }";

        _wireMockServer
            .Given(Request.Create()
                .WithPath($"/{TestOrganization}/{TestProject}/_apis/build/definitions")
                .WithParam("api-version", "7.0")
                .UsingGet())
            .RespondWith(Response.Create()
                .WithStatusCode(200)
                .WithHeader("Content-Type", "application/json")
                .WithBody(pipelinesResponse));

        Console.WriteLine($"Registered pipeline endpoint: /{TestOrganization}/{TestProject}/_apis/build/definitions");
    }

    /// <summary>
    /// Sets up mock endpoint for Azure DevOps Builds
    /// </summary>
    private void SetupMockBuildsEndpoint(int pipelineId, int count)
    {
        var buildsResponse = @"
        {
            ""value"": [
                {
                    ""id"": 100,
                    ""buildNumber"": ""Build 1"",
                    ""status"": ""Completed"",
                    ""result"": ""Succeeded"",
                    ""startTime"": ""2024-01-01T10:00:00Z"",
                    ""finishTime"": ""2024-01-01T10:30:00Z"",
                    ""url"": ""https://dev.azure.com/testorg/testproject/_build/results?buildId=100"",
                    ""sourceBranch"": ""refs/heads/main"",
                    ""sourceVersion"": ""abc123""
                },
                {
                    ""id"": 101,
                    ""buildNumber"": ""Build 2"",
                    ""status"": ""InProgress"",
                    ""result"": null,
                    ""startTime"": ""2024-01-01T11:00:00Z"",
                    ""finishTime"": null,
                    ""url"": ""https://dev.azure.com/testorg/testproject/_build/results?buildId=101"",
                    ""sourceBranch"": ""refs/heads/feature"",
                    ""sourceVersion"": ""def456""
                }
            ]
        }";

        _wireMockServer
            .Given(Request.Create()
                .WithPath($"/{TestOrganization}/{TestProject}/_apis/build/builds")
                .WithParam("definitions", pipelineId.ToString())
                .WithParam("$top", count.ToString())
                .WithParam("api-version", "7.0")
                .UsingGet())
            .RespondWith(Response.Create()
                .WithStatusCode(200)
                .WithHeader("Content-Type", "application/json")
                .WithBody(buildsResponse));

        Console.WriteLine($"Registered builds endpoint for pipeline {pipelineId}");
    }

    /// <summary>
    /// Sets up mock endpoint that returns malformed JSON
    /// </summary>
    private void SetupMockMalformedJsonEndpoint(string endpointType)
    {
        string path = endpointType switch
        {
            "pipelines" => $"/{TestOrganization}/{TestProject}/_apis/build/definitions",
            "builds" => $"/{TestOrganization}/{TestProject}/_apis/build/builds",
            _ => $"/{TestOrganization}/{TestProject}/_apis/{endpointType}"
        };

        _wireMockServer
            .Given(Request.Create()
                .WithPath(path)
                .WithParam("api-version", "7.0")
                .UsingGet())
            .RespondWith(Response.Create()
                .WithStatusCode(200)
                .WithHeader("Content-Type", "application/json")
                .WithBody(@"{""value"": [{ this is malformed JSON }]}"));

        Console.WriteLine($"Registered malformed JSON endpoint for {endpointType}");
    }

    /// <summary>
    /// Sets up mock endpoint that returns unauthorized response
    /// </summary>
    private void SetupMockUnauthorizedEndpoint(string endpointType, int? id = null)
    {
        string path;
        if (endpointType == "builds" && id.HasValue)
        {
            path = $"/{TestOrganization}/{TestProject}/_apis/build/builds";
        }
        else if (endpointType == "timeline" && id.HasValue)
        {
            path = $"/{TestOrganization}/{TestProject}/_apis/build/builds/{id}/Timeline";
        }
        else
        {
            path = $"/{TestOrganization}/{TestProject}/_apis/{endpointType}";
        }

        _wireMockServer
            .Given(Request.Create()
                .WithPath(path)
                .WithParam("api-version", "7.0")
                .UsingGet())
            .RespondWith(Response.Create()
                .WithStatusCode(401)
                .WithHeader("Content-Type", "application/json")
                .WithBody(@"{""message"": ""Unauthorized. Authentication required.""}"));

        Console.WriteLine($"Registered unauthorized endpoint for {endpointType}");
    }

    /// <summary>
    /// Sets up mock endpoint that returns rate limited response
    /// </summary>
    private void SetupMockRateLimitedEndpoint(string endpointType, int? id = null)
    {
        string path;
        if (endpointType == "timeline" && id.HasValue)
        {
            path = $"/{TestOrganization}/{TestProject}/_apis/build/builds/{id}/Timeline";
        }
        else
        {
            path = $"/{TestOrganization}/{TestProject}/_apis/{endpointType}";
        }

        _wireMockServer
            .Given(Request.Create()
                .WithPath(path)
                .WithParam("api-version", "7.0")
                .UsingGet())
            .RespondWith(Response.Create()
                .WithStatusCode(429)
                .WithHeader("Content-Type", "application/json")
                .WithHeader("Retry-After", "30")
                .WithBody(@"{""message"": ""Too many requests. Please try again after 30 seconds.""}"));

        Console.WriteLine($"Registered rate limited endpoint for {endpointType}");
    }

    /// <summary>
    /// Sets up mock endpoint that returns build not found
    /// </summary>
    private void SetupMockBuildNotFoundEndpoint(int buildId)
    {
        _wireMockServer
            .Given(Request.Create()
                .WithPath($"/{TestOrganization}/{TestProject}/_apis/build/builds/{buildId}/Timeline")
                .WithParam("api-version", "7.0")
                .UsingGet())
            .RespondWith(Response.Create()
                .WithStatusCode(404)
                .WithHeader("Content-Type", "application/json")
                .WithBody($@"{{""message"": ""Build {buildId} not found.""}}"));

        Console.WriteLine($"Registered build not found endpoint for build {buildId}");
    }

    /// <summary>
    /// Sets up all the mock Azure DevOps API endpoints
    /// </summary>
    private void SetupMockAzureDevOpsEndpoints()
    {
        SetupMockPipelinesEndpoint();
        SetupMockProjectsEndpoint();
    }

    /// <summary>
    /// Sets up mock endpoint for Azure DevOps Build Timeline
    /// </summary>
    private void SetupMockBuildTimelineEndpoint(int buildId)
    {
        var timelineResponse = @"
        {
            ""id"": ""timeline-123"",
            ""records"": [
                {
                    ""id"": ""record-1"",
                    ""parentId"": null,
                    ""name"": ""Build Job"",
                    ""type"": ""Build"",
                    ""state"": ""completed"",
                    ""result"": ""succeeded"",
                    ""startTime"": ""2024-01-01T10:00:00Z"",
                    ""finishTime"": ""2024-01-01T10:30:00Z"",
                    ""percentComplete"": 100,
                    ""log"": {
                        ""url"": ""https://dev.azure.com/testorg/logs/1""
                    }
                },
                {
                    ""id"": ""record-2"",
                    ""parentId"": ""record-1"",
                    ""name"": ""Build Task"",
                    ""type"": ""Task"",
                    ""state"": ""completed"",
                    ""result"": ""succeeded"",
                    ""startTime"": ""2024-01-01T10:05:00Z"",
                    ""finishTime"": ""2024-01-01T10:25:00Z"",
                    ""percentComplete"": 100,
                    ""log"": {
                        ""url"": ""https://dev.azure.com/testorg/logs/2""
                    }
                },
                {
                    ""id"": ""record-3"",
                    ""parentId"": null,
                    ""name"": ""Deploy Stage"",
                    ""type"": ""Stage"",
                    ""state"": ""completed"",
                    ""result"": ""succeeded"",
                    ""startTime"": ""2024-01-01T10:30:00Z"",
                    ""finishTime"": ""2024-01-01T10:45:00Z"",
                    ""percentComplete"": 100,
                    ""log"": {
                        ""url"": ""https://dev.azure.com/testorg/logs/3""
                    }
                }
            ]
        }";

        _wireMockServer
            .Given(Request.Create()
                .WithPath($"/{TestOrganization}/{TestProject}/_apis/build/builds/{buildId}/Timeline")
                .WithParam("api-version", "7.0")
                .UsingGet())
            .RespondWith(Response.Create()
                .WithStatusCode(200)
                .WithHeader("Content-Type", "application/json")
                .WithBody(timelineResponse));

        Console.WriteLine($"Registered timeline endpoint for build {buildId}");
    }

    /// <summary>
    /// Sets up mock endpoint for builds used in deployment testing
    /// </summary>
    private void SetupMockBuildsForDeploymentEndpoint(int pipelineId)
    {
        var buildsResponse = @"
        {
            ""value"": [
                {
                    ""id"": 100,
                    ""buildNumber"": ""Build-100"",
                    ""status"": ""Completed"",
                    ""result"": ""Succeeded"",
                    ""startTime"": ""2024-01-01T10:00:00Z"",
                    ""finishTime"": ""2024-01-01T10:30:00Z"",
                    ""url"": ""https://dev.azure.com/testorg/testproject/_build/results?buildId=100"",
                    ""sourceBranch"": ""refs/heads/main"",
                    ""sourceVersion"": ""abc123""
                }
            ]
        }";

        _wireMockServer
            .Given(Request.Create()
                .WithPath($"/{TestOrganization}/{TestProject}/_apis/build/builds")
                .WithParam("definitions", pipelineId.ToString())
                .WithParam("branchName", "refs/heads/main")
                .WithParam("$top", "10")
                .WithParam("api-version", "7.0")
                .UsingGet())
            .RespondWith(Response.Create()
                .WithStatusCode(200)
                .WithHeader("Content-Type", "application/json")
                .WithBody(buildsResponse));

        Console.WriteLine($"Registered deployment builds endpoint for pipeline {pipelineId}");
    }

    /// <summary>
    /// Sets up mock endpoint for build timeline used in deployment testing
    /// </summary>
    private void SetupMockBuildTimelineForDeploymentEndpoint(int buildId, string environment, string result)
    {
        var timelineResponse = $@"
        {{
            ""id"": ""timeline-{buildId}"",
            ""records"": [
                {{
                    ""id"": ""record-1"",
                    ""parentId"": null,
                    ""name"": ""Deploy to {environment}"",
                    ""type"": ""Stage"",
                    ""state"": ""completed"",
                    ""result"": ""{result}"",
                    ""startTime"": ""2024-01-01T10:30:00Z"",
                    ""finishTime"": ""2024-01-01T10:45:00Z"",
                    ""percentComplete"": 100,
                    ""log"": {{
                        ""url"": ""https://dev.azure.com/testorg/logs/{buildId}""
                    }}
                }}
            ]
        }}";

        _wireMockServer
            .Given(Request.Create()
                .WithPath($"/{TestOrganization}/{TestProject}/_apis/build/builds/{buildId}/Timeline")
                .WithParam("api-version", "7.0")
                .UsingGet())
            .RespondWith(Response.Create()
                .WithStatusCode(200)
                .WithHeader("Content-Type", "application/json")
                .WithBody(timelineResponse));

        Console.WriteLine($"Registered deployment timeline endpoint for build {buildId} with {environment} {result}");
    }

    /// <summary>
    /// Sets up mock endpoint that returns an error for pipelines
    /// </summary>
    private void SetupMockPipelinesEndpointWithError()
    {
        _wireMockServer
            .Given(Request.Create()
                .WithPath($"/{TestOrganization}/{TestProject}/_apis/build/definitions")
                .WithParam("api-version", "7.0")
                .UsingGet())
            .RespondWith(Response.Create()
                .WithStatusCode(500)
                .WithHeader("Content-Type", "application/json")
                .WithBody(@"{""error"": ""Internal Server Error""}"));

        Console.WriteLine("Registered pipeline endpoint with error response");
    }

    /// <summary>
    /// Sets up mock endpoint that returns an error for builds
    /// </summary>
    private void SetupMockBuildsEndpointWithError(int pipelineId, int count)
    {
        _wireMockServer
            .Given(Request.Create()
                .WithPath($"/{TestOrganization}/{TestProject}/_apis/build/builds")
                .WithParam("definitions", pipelineId.ToString())
                .WithParam("$top", count.ToString())
                .WithParam("api-version", "7.0")
                .UsingGet())
            .RespondWith(Response.Create()
                .WithStatusCode(404)
                .WithHeader("Content-Type", "application/json")
                .WithBody(@"{""error"": ""Not Found""}"));

        Console.WriteLine($"Registered builds endpoint with error response for pipeline {pipelineId}");
    }

    /// <summary>
    /// Sets up mock endpoint that returns an error for build timeline
    /// </summary>
    private void SetupMockBuildTimelineEndpointWithError(int buildId)
    {
        _wireMockServer
            .Given(Request.Create()
                .WithPath($"/{TestOrganization}/{TestProject}/_apis/build/builds/{buildId}/Timeline")
                .WithParam("api-version", "7.0")
                .UsingGet())
            .RespondWith(Response.Create()
                .WithStatusCode(403)
                .WithHeader("Content-Type", "application/json")
                .WithBody(@"{""error"": ""Forbidden""}"));

        Console.WriteLine($"Registered timeline endpoint with error response for build {buildId}");
    }

    /// <summary>
    /// Sets up mock endpoint for empty timeline
    /// </summary>
    private void SetupMockEmptyTimelineEndpoint(int buildId)
    {
        var timelineResponse = @"
        {
            ""id"": ""empty-timeline"",
            ""records"": []
        }";

        _wireMockServer
            .Given(Request.Create()
                .WithPath($"/{TestOrganization}/{TestProject}/_apis/build/builds/{buildId}/Timeline")
                .WithParam("api-version", "7.0")
                .UsingGet())
            .RespondWith(Response.Create()
                .WithStatusCode(200)
                .WithHeader("Content-Type", "application/json")
                .WithBody(timelineResponse));

        Console.WriteLine($"Registered empty timeline endpoint for build {buildId}");
    }

    /// <summary>
    /// Sets up mock endpoint for timeline with non-stage records
    /// </summary>
    private void SetupMockNonStageTimelineEndpoint(int buildId)
    {
        var timelineResponse = @"
        {
            ""id"": ""non-stage-timeline"",
            ""records"": [
                {
                    ""id"": ""record-1"",
                    ""parentId"": null,
                    ""name"": ""Build Job"",
                    ""type"": ""Build"",
                    ""state"": ""completed"",
                    ""result"": ""succeeded"",
                    ""startTime"": ""2024-01-01T10:00:00Z"",
                    ""finishTime"": ""2024-01-01T10:30:00Z"",
                    ""percentComplete"": 100,
                    ""log"": {
                        ""url"": ""https://dev.azure.com/testorg/logs/1""
                    }
                },
                {
                    ""id"": ""record-2"",
                    ""parentId"": ""record-1"",
                    ""name"": ""Task with Dev in name"",
                    ""type"": ""Task"",
                    ""state"": ""completed"",
                    ""result"": ""succeeded"",
                    ""startTime"": ""2024-01-01T10:05:00Z"",
                    ""finishTime"": ""2024-01-01T10:25:00Z"",
                    ""percentComplete"": 100,
                    ""log"": {
                        ""url"": ""https://dev.azure.com/testorg/logs/2""
                    }
                }
            ]
        }";

        _wireMockServer
            .Given(Request.Create()
                .WithPath($"/{TestOrganization}/{TestProject}/_apis/build/builds/{buildId}/Timeline")
                .WithParam("api-version", "7.0")
                .UsingGet())
            .RespondWith(Response.Create()
                .WithStatusCode(200)
                .WithHeader("Content-Type", "application/json")
                .WithBody(timelineResponse));

        Console.WriteLine($"Registered non-stage timeline endpoint for build {buildId}");
    }

    /// <summary>
    /// Sets up mock endpoint for multiple builds for deployment testing
    /// </summary>
    private void SetupMockMultipleBuildsForDeploymentEndpoint(int pipelineId)
    {
        var buildsResponse = @"
        {
            ""value"": [
                {
                    ""id"": 100,
                    ""buildNumber"": ""Build-100"",
                    ""status"": ""Completed"",
                    ""result"": ""Succeeded"",
                    ""startTime"": ""2024-01-01T10:00:00Z"",
                    ""finishTime"": ""2024-01-01T10:30:00Z"",
                    ""url"": ""https://dev.azure.com/testorg/testproject/_build/results?buildId=100"",
                    ""sourceBranch"": ""refs/heads/main"",
                    ""sourceVersion"": ""abc123""
                },
                {
                    ""id"": 101,
                    ""buildNumber"": ""Build-101"",
                    ""status"": ""Completed"",
                    ""result"": ""Succeeded"",
                    ""startTime"": ""2024-01-01T09:00:00Z"",
                    ""finishTime"": ""2024-01-01T09:30:00Z"",
                    ""url"": ""https://dev.azure.com/testorg/testproject/_build/results?buildId=101"",
                    ""sourceBranch"": ""refs/heads/main"",
                    ""sourceVersion"": ""def456""
                }
            ]
        }";

        _wireMockServer
            .Given(Request.Create()
                .WithPath($"/{TestOrganization}/{TestProject}/_apis/build/builds")
                .WithParam("definitions", pipelineId.ToString())
                .WithParam("branchName", "refs/heads/main")
                .WithParam("$top", "10")
                .WithParam("api-version", "7.0")
                .UsingGet())
            .RespondWith(Response.Create()
                .WithStatusCode(200)
                .WithHeader("Content-Type", "application/json")
                .WithBody(buildsResponse));

        Console.WriteLine($"Registered multiple builds endpoint for pipeline {pipelineId}");
    }

    /// <summary>
    /// Sets up mock endpoint for empty builds response for deployment testing
    /// </summary>
    private void SetupMockEmptyBuildsForDeploymentEndpoint(int pipelineId)
    {
        var buildsResponse = @"
        {
            ""value"": []
        }";

        _wireMockServer
            .Given(Request.Create()
                .WithPath($"/{TestOrganization}/{TestProject}/_apis/build/builds")
                .WithParam("definitions", pipelineId.ToString())
                .WithParam("branchName", "refs/heads/main")
                .WithParam("$top", "10")
                .WithParam("api-version", "7.0")
                .UsingGet())
            .RespondWith(Response.Create()
                .WithStatusCode(200)
                .WithHeader("Content-Type", "application/json")
                .WithBody(buildsResponse));

        Console.WriteLine($"Registered empty builds endpoint for pipeline {pipelineId}");
    }

    /// <summary>
    /// Sets up mock endpoint for empty builds response
    /// </summary>
    private void SetupMockEmptyBuildsEndpoint(int pipelineId, int count)
    {
        var buildsResponse = @"
        {
            ""value"": []
        }";

        _wireMockServer
            .Given(Request.Create()
                .WithPath($"/{TestOrganization}/{TestProject}/_apis/build/builds")
                .WithParam("definitions", pipelineId.ToString())
                .WithParam("$top", count.ToString())
                .WithParam("api-version", "7.0")
                .UsingGet())
            .RespondWith(Response.Create()
                .WithStatusCode(200)
                .WithHeader("Content-Type", "application/json")
                .WithBody(buildsResponse));

        Console.WriteLine($"Registered empty builds endpoint for pipeline {pipelineId}");
    }

    /// <summary>
    /// Sets up mock endpoint for null timeline response
    /// </summary>
    private void SetupMockNullTimelineEndpoint(int buildId)
    {
        _wireMockServer
            .Given(Request.Create()
                .WithPath($"/{TestOrganization}/{TestProject}/_apis/build/builds/{buildId}/Timeline")
                .WithParam("api-version", "7.0")
                .UsingGet())
            .RespondWith(Response.Create()
                .WithStatusCode(204)
                .WithHeader("Content-Type", "application/json"));

        Console.WriteLine($"Registered null timeline endpoint for build {buildId}");
    }

    /// <summary>
    /// Sets up mock endpoint for Azure DevOps Projects
    /// </summary>
    private void SetupMockProjectsEndpoint()
    {
        // Read the sample projects response from the test data file
        var jsonFilePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "TestData", "sample_projects_response.json");
        var projectsResponse = File.ReadAllText(jsonFilePath);

        _wireMockServer
            .Given(Request.Create()
                .WithPath($"/{TestOrganization}/_apis/projects")
                .WithParam("api-version", "7.0")
                .UsingGet())
            .RespondWith(Response.Create()
                .WithStatusCode(200)
                .WithHeader("Content-Type", "application/json")
                .WithBody(projectsResponse));

        Console.WriteLine($"Registered projects endpoint: /{TestOrganization}/_apis/projects");
    }

    /// <summary>
    /// Sets up mock endpoint for Azure DevOps Projects with empty response
    /// </summary>
    private void SetupMockEmptyProjectsEndpoint()
    {
        var emptyResponse = @"
        {
            ""count"": 0,
            ""value"": []
        }";

        _wireMockServer
            .Given(Request.Create()
                .WithPath($"/{TestOrganization}/_apis/projects")
                .WithParam("api-version", "7.0")
                .UsingGet())
            .RespondWith(Response.Create()
                .WithStatusCode(200)
                .WithHeader("Content-Type", "application/json")
                .WithBody(emptyResponse));

        Console.WriteLine($"Registered empty projects endpoint: /{TestOrganization}/_apis/projects");
    }

    /// <summary>
    /// Sets up mock endpoint for Azure DevOps Projects with error
    /// </summary>
    private void SetupMockProjectsEndpointWithError()
    {
        _wireMockServer
            .Given(Request.Create()
                .WithPath($"/{TestOrganization}/_apis/projects")
                .WithParam("api-version", "7.0")
                .UsingGet())
            .RespondWith(Response.Create()
                .WithStatusCode(500)
                .WithHeader("Content-Type", "application/json")
                .WithBody(@"{""message"":""Internal Server Error""}"));

        Console.WriteLine($"Registered projects endpoint with error: /{TestOrganization}/_apis/projects");
    }

    /// <summary>
    /// Sets up mock endpoint for Azure DevOps Projects with unauthorized response
    /// </summary>
    private void SetupMockProjectsUnauthorizedEndpoint()
    {
        _wireMockServer
            .Given(Request.Create()
                .WithPath($"/{TestOrganization}/_apis/projects")
                .WithParam("api-version", "7.0")
                .UsingGet())
            .RespondWith(Response.Create()
                .WithStatusCode(401)
                .WithHeader("Content-Type", "application/json")
                .WithBody(@"{""message"":""Unauthorized""}"));

        Console.WriteLine($"Registered projects endpoint with unauthorized: /{TestOrganization}/_apis/projects");
    }

    public void Dispose()
    {
        _wireMockServer?.Stop();
        _wireMockServer?.Dispose();
    }
}