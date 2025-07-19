using AzDevOpsApi.Controllers;
using AzDevOpsApi.Models;
using AzDevOpsApi.Models.AzureDevOps;
using AzDevOpsApi.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Xunit;

namespace AzDevOpsApi.Tests.Controllers
{
    public class PipelinesControllerTests
    {
        private readonly IAzureDevOpsService _azureDevOpsService;
        private readonly ILogger<PipelinesController> _logger;
        private readonly IConfiguration _configuration;
        private readonly PipelinesController _controller;

        public PipelinesControllerTests()
        {
            _azureDevOpsService = Substitute.For<IAzureDevOpsService>();
            _logger = Substitute.For<ILogger<PipelinesController>>();
            _configuration = Substitute.For<IConfiguration>();
            
            // Setup default configuration values
            _configuration["AzureDevOps:Organization"].Returns("test-org");
            _configuration["AzureDevOps:PAT"].Returns("test-pat");
            
            _controller = new PipelinesController(_azureDevOpsService, _logger, _configuration);
        }

        [Fact]
        public async Task GetPipelines_WithValidProject_ReturnsOkWithPipelines()
        {
            // Arrange
            const string project = "TestProject";
            
            var expectedPipelines = new List<AzureDevOpsPipeline>
            {
                new AzureDevOpsPipeline 
                { 
                    Id = 1, 
                    Name = "Build Pipeline", 
                    Url = "https://dev.azure.com/test-org/TestProject/_build?definitionId=1",
                    Path = "\\",
                    Revision = 1,
                    QueueStatus = "enabled",
                    Type = "build"
                },
                new AzureDevOpsPipeline 
                { 
                    Id = 2, 
                    Name = "Release Pipeline", 
                    Url = "https://dev.azure.com/test-org/TestProject/_build?definitionId=2",
                    Path = "\\Release",
                    Revision = 2,
                    QueueStatus = "enabled",
                    Type = "build"
                }
            };

            _azureDevOpsService
                .GetPipelinesAsync(project, "test-org", "test-pat")
                .Returns(expectedPipelines);

            // Act
            var result = await _controller.GetPipelines(project);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var actualPipelines = Assert.IsAssignableFrom<IEnumerable<AzureDevOpsPipeline>>(okResult.Value);
            Assert.Equal(expectedPipelines.Count(), actualPipelines.Count());
            Assert.Equal(expectedPipelines.First().Id, actualPipelines.First().Id);
            Assert.Equal(expectedPipelines.First().Name, actualPipelines.First().Name);
        }

        [Theory]
        [InlineData("")]
        public async Task GetPipelines_WithEmptyProject_ReturnsBadRequest(string project)
        {
            // Act
            var result = await _controller.GetPipelines(project);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal("Project name is required", badRequestResult.Value);
            
            await _azureDevOpsService.DidNotReceive()
                .GetPipelinesAsync(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>());
        }

        [Fact]
        public async Task GetPipelines_WithNullProject_ReturnsBadRequest()
        {
            // Arrange
            string? project = null;

            // Act
            var result = await _controller.GetPipelines(project!);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal("Project name is required", badRequestResult.Value);
            
            await _azureDevOpsService.DidNotReceive()
                .GetPipelinesAsync(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>());
        }

        [Fact]
        public async Task GetPipelines_WithWhitespaceProject_ReturnsOkBecauseNotCheckedByController()
        {
            // Arrange
            const string project = "   ";
            
            var expectedPipelines = new List<AzureDevOpsPipeline>();
            _azureDevOpsService
                .GetPipelinesAsync(project, "test-org", "test-pat")
                .Returns(expectedPipelines);

            // Act
            var result = await _controller.GetPipelines(project);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            await _azureDevOpsService.Received(1)
                .GetPipelinesAsync(project, "test-org", "test-pat");
        }

        [Fact]
        public async Task GetPipelines_WithMissingOrganizationConfig_ReturnsInternalServerError()
        {
            // Arrange
            const string project = "TestProject";
            
            _configuration["AzureDevOps:Organization"].Returns((string?)null);

            // Act
            var result = await _controller.GetPipelines(project);

            // Assert
            var statusCodeResult = Assert.IsType<ObjectResult>(result.Result);
            Assert.Equal(500, statusCodeResult.StatusCode);
            Assert.Equal("Azure DevOps configuration is missing", statusCodeResult.Value);
            
            await _azureDevOpsService.DidNotReceive()
                .GetPipelinesAsync(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>());
        }

        [Fact]
        public async Task GetPipelines_WithMissingPATConfig_ReturnsInternalServerError()
        {
            // Arrange
            const string project = "TestProject";
            
            _configuration["AzureDevOps:PAT"].Returns((string?)null);

            // Act
            var result = await _controller.GetPipelines(project);

            // Assert
            var statusCodeResult = Assert.IsType<ObjectResult>(result.Result);
            Assert.Equal(500, statusCodeResult.StatusCode);
            Assert.Equal("Azure DevOps configuration is missing", statusCodeResult.Value);
            
            await _azureDevOpsService.DidNotReceive()
                .GetPipelinesAsync(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>());
        }

        [Fact]
        public async Task GetPipelines_WithEmptyOrganizationConfig_ReturnsInternalServerError()
        {
            // Arrange
            const string project = "TestProject";
            
            _configuration["AzureDevOps:Organization"].Returns("");

            // Act
            var result = await _controller.GetPipelines(project);

            // Assert
            var statusCodeResult = Assert.IsType<ObjectResult>(result.Result);
            Assert.Equal(500, statusCodeResult.StatusCode);
            Assert.Equal("Azure DevOps configuration is missing", statusCodeResult.Value);
        }

        [Fact]
        public async Task GetPipelines_WithEmptyPATConfig_ReturnsInternalServerError()
        {
            // Arrange
            const string project = "TestProject";
            
            _configuration["AzureDevOps:PAT"].Returns("");

            // Act
            var result = await _controller.GetPipelines(project);

            // Assert
            var statusCodeResult = Assert.IsType<ObjectResult>(result.Result);
            Assert.Equal(500, statusCodeResult.StatusCode);
            Assert.Equal("Azure DevOps configuration is missing", statusCodeResult.Value);
        }

        [Fact]
        public async Task GetPipelines_WhenServiceThrowsException_ReturnsInternalServerError()
        {
            // Arrange
            const string project = "TestProject";
            
            var expectedException = new InvalidOperationException("Service error occurred");
            
            _azureDevOpsService
                .GetPipelinesAsync(project, "test-org", "test-pat")
                .Throws(expectedException);

            // Act
            var result = await _controller.GetPipelines(project);

            // Assert
            var statusCodeResult = Assert.IsType<ObjectResult>(result.Result);
            Assert.Equal(500, statusCodeResult.StatusCode);
            Assert.Equal("An error occurred while retrieving pipelines", statusCodeResult.Value);
        }

        [Fact]
        public async Task GetPipelines_WhenServiceThrowsException_LogsError()
        {
            // Arrange
            const string project = "TestProject";
            
            var expectedException = new InvalidOperationException("Service error occurred");
            
            _azureDevOpsService
                .GetPipelinesAsync(project, "test-org", "test-pat")
                .Throws(expectedException);

            // Act
            await _controller.GetPipelines(project);

            // Assert
            // Verify that Log method was called with LogLevel.Error
            _logger.Received(1).Log(
                LogLevel.Error,
                Arg.Any<EventId>(),
                Arg.Is<object>(o => o.ToString()!.Contains("Error retrieving pipelines for project TestProject")),
                expectedException,
                Arg.Any<Func<object, Exception?, string>>());
        }

        [Fact]
        public async Task GetPipelines_WithHttpRequestException_ReturnsInternalServerError()
        {
            // Arrange
            const string project = "TestProject";
            
            var httpException = new HttpRequestException("Network error");
            
            _azureDevOpsService
                .GetPipelinesAsync(project, "test-org", "test-pat")
                .Throws(httpException);

            // Act
            var result = await _controller.GetPipelines(project);

            // Assert
            var statusCodeResult = Assert.IsType<ObjectResult>(result.Result);
            Assert.Equal(500, statusCodeResult.StatusCode);
            Assert.Equal("An error occurred while retrieving pipelines", statusCodeResult.Value);
        }

        [Fact]
        public async Task GetPipelines_WithEmptyPipelinesResult_ReturnsOkWithEmptyList()
        {
            // Arrange
            const string project = "TestProject";
            
            var emptyPipelines = new List<AzureDevOpsPipeline>();
            
            _azureDevOpsService
                .GetPipelinesAsync(project, "test-org", "test-pat")
                .Returns(emptyPipelines);

            // Act
            var result = await _controller.GetPipelines(project);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var actualPipelines = Assert.IsAssignableFrom<IEnumerable<AzureDevOpsPipeline>>(okResult.Value);
            Assert.Empty(actualPipelines);
        }

        [Fact]
        public async Task GetPipelines_PassesCorrectParametersToService()
        {
            // Arrange
            const string project = "CustomProject";
            
            var pipelines = new List<AzureDevOpsPipeline> { new AzureDevOpsPipeline { Id = 1, Name = "Test Pipeline" } };
            
            _azureDevOpsService
                .GetPipelinesAsync(project, "test-org", "test-pat")
                .Returns(pipelines);

            // Act
            await _controller.GetPipelines(project);

            // Assert
            await _azureDevOpsService.Received(1)
                .GetPipelinesAsync(project, "test-org", "test-pat");
        }
    }
}
