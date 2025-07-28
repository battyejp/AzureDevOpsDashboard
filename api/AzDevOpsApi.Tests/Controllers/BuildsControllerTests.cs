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
    public class BuildsControllerTests
    {
        private readonly IAzureDevOpsService _azureDevOpsService;
        private readonly ILogger<BuildsController> _logger;
        private readonly IConfiguration _configuration;
        private readonly BuildsController _controller;

        public BuildsControllerTests()
        {
            _azureDevOpsService = Substitute.For<IAzureDevOpsService>();
            _logger = Substitute.For<ILogger<BuildsController>>();
            _configuration = Substitute.For<IConfiguration>();
            
            // Setup default configuration values
            _configuration["AzureDevOps:Organization"].Returns("test-org");
            _configuration["AzureDevOps:PAT"].Returns("test-pat");
            
            _controller = new BuildsController(_azureDevOpsService, _logger, _configuration);
        }

        [Fact]
        public async Task GetBuilds_WithValidParameters_ReturnsOkWithBuilds()
        {
            // Arrange
            const int pipelineId = 123;
            const string project = "TestProject";
            const int count = 5;
            
            var expectedBuilds = new List<AzureDevOpsBuild>
            {
                new AzureDevOpsBuild
                {
                    Id = 1,
                    BuildNumber = "1.0.1",
                    Status = "Completed",
                    Result = "Succeeded",
                    StartTime = DateTime.UtcNow.AddHours(-2),
                    FinishTime = DateTime.UtcNow.AddHours(-1),
                    SourceBranch = "refs/heads/main",
                    SourceVersion = "abc123",
                    Url = "https://dev.azure.com/test-org/TestProject/_build/results?buildId=1",
                    Tags = new[] { "production", "release" }
                },
                new AzureDevOpsBuild
                {
                    Id = 2,
                    BuildNumber = "1.0.2",
                    Status = "InProgress",
                    Result = null,
                    StartTime = DateTime.UtcNow.AddMinutes(-30),
                    FinishTime = null,
                    SourceBranch = "refs/heads/feature/test",
                    SourceVersion = "def456",
                    Url = "https://dev.azure.com/test-org/TestProject/_build/results?buildId=2",
                    Tags = new[] { "development" }
                }
            };

            _azureDevOpsService
                .GetBuildsAsync(project, "test-org", "test-pat", pipelineId, count)
                .Returns(Task.FromResult<IEnumerable<AzureDevOpsBuild>>(expectedBuilds));

            // Act
            var result = await _controller.GetBuilds(pipelineId, project, count);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var actualBuilds = Assert.IsAssignableFrom<IEnumerable<BuildDto>>(okResult.Value);
            var buildsList = actualBuilds.ToList();
            
            Assert.Equal(expectedBuilds.Count(), buildsList.Count());
            Assert.Equal(expectedBuilds.First().Id, buildsList.First().Id);
            Assert.Equal(expectedBuilds.First().BuildNumber, buildsList.First().BuildNumber);
            
            // Verify tags are properly returned
            Assert.Equal(expectedBuilds.First().Tags, buildsList.First().Tags);
            Assert.Equal(2, buildsList.First().Tags.Length);
            Assert.Contains("production", buildsList.First().Tags);
            Assert.Contains("release", buildsList.First().Tags);
            
            Assert.Equal(expectedBuilds.Last().Tags, buildsList.Last().Tags);
            Assert.Single(buildsList.Last().Tags);
            Assert.Contains("development", buildsList.Last().Tags);
        }

        [Fact]
        public async Task GetBuilds_WithDefaultCount_ReturnsOkWithBuilds()
        {
            // Arrange
            const int pipelineId = 123;
            const string project = "TestProject";
            const int defaultCount = 10; // Default value from controller
            
            var expectedBuilds = new List<AzureDevOpsBuild>
            {
                new AzureDevOpsBuild { Id = 1, BuildNumber = "1.0.1", Status = "Completed" }
            };

            _azureDevOpsService
                .GetBuildsAsync(project, "test-org", "test-pat", pipelineId, defaultCount)
                .Returns(Task.FromResult<IEnumerable<AzureDevOpsBuild>>(expectedBuilds));

            // Act
            var result = await _controller.GetBuilds(pipelineId, project);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var actualBuilds = Assert.IsAssignableFrom<IEnumerable<BuildDto>>(okResult.Value);
            Assert.Single(actualBuilds);
            
            await _azureDevOpsService.Received(1)
                .GetBuildsAsync(project, "test-org", "test-pat", pipelineId, defaultCount);
        }

        [Theory]
        [InlineData("")]
        public async Task GetBuilds_WithEmptyProject_ReturnsBadRequest(string project)
        {
            // Arrange
            const int pipelineId = 123;

            // Act
            var result = await _controller.GetBuilds(pipelineId, project);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal("Project name is required", badRequestResult.Value);
            
            await _azureDevOpsService.DidNotReceive()
                .GetBuildsAsync(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>(), Arg.Any<int>(), Arg.Any<int>());
        }

        [Fact]
        public async Task GetBuilds_WithWhitespaceProject_ReturnsOkBecauseNotCheckedByController()
        {
            // Arrange
            const int pipelineId = 123;
            const string project = "   ";
            
            var expectedBuilds = new List<AzureDevOpsBuild>();
            _azureDevOpsService
                .GetBuildsAsync(project, "test-org", "test-pat", pipelineId, 10)
                .Returns(Task.FromResult<IEnumerable<AzureDevOpsBuild>>(expectedBuilds));

            // Act
            var result = await _controller.GetBuilds(pipelineId, project);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            await _azureDevOpsService.Received(1)
                .GetBuildsAsync(project, "test-org", "test-pat", pipelineId, 10);
        }

        [Fact]
        public async Task GetBuilds_WithNullProject_ReturnsBadRequest()
        {
            // Arrange
            const int pipelineId = 123;
            string? project = null;

            // Act
            var result = await _controller.GetBuilds(pipelineId, project!);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal("Project name is required", badRequestResult.Value);
            
            await _azureDevOpsService.DidNotReceive()
                .GetBuildsAsync(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>(), Arg.Any<int>(), Arg.Any<int>());
        }

        [Theory]
        [InlineData(0)]
        [InlineData(-1)]
        [InlineData(-100)]
        public async Task GetBuilds_WithInvalidPipelineId_ReturnsBadRequest(int pipelineId)
        {
            // Arrange
            const string project = "TestProject";

            // Act
            var result = await _controller.GetBuilds(pipelineId, project);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal("Pipeline ID must be greater than zero", badRequestResult.Value);
            
            await _azureDevOpsService.DidNotReceive()
                .GetBuildsAsync(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>(), Arg.Any<int>(), Arg.Any<int>());
        }

        [Fact]
        public async Task GetBuilds_WithMissingOrganizationConfig_ReturnsInternalServerError()
        {
            // Arrange
            const int pipelineId = 123;
            const string project = "TestProject";
            
            _configuration["AzureDevOps:Organization"].Returns((string?)null);

            // Act
            var result = await _controller.GetBuilds(pipelineId, project);

            // Assert
            var statusCodeResult = Assert.IsType<ObjectResult>(result.Result);
            Assert.Equal(500, statusCodeResult.StatusCode);
            Assert.Equal("Azure DevOps configuration is missing", statusCodeResult.Value);
            
            await _azureDevOpsService.DidNotReceive()
                .GetBuildsAsync(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>(), Arg.Any<int>(), Arg.Any<int>());
        }

        [Fact]
        public async Task GetBuilds_WithMissingPATConfig_ReturnsInternalServerError()
        {
            // Arrange
            const int pipelineId = 123;
            const string project = "TestProject";
            
            _configuration["AzureDevOps:PAT"].Returns((string?)null);

            // Act
            var result = await _controller.GetBuilds(pipelineId, project);

            // Assert
            var statusCodeResult = Assert.IsType<ObjectResult>(result.Result);
            Assert.Equal(500, statusCodeResult.StatusCode);
            Assert.Equal("Azure DevOps configuration is missing", statusCodeResult.Value);
            
            await _azureDevOpsService.DidNotReceive()
                .GetBuildsAsync(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>(), Arg.Any<int>(), Arg.Any<int>());
        }

        [Fact]
        public async Task GetBuilds_WithEmptyOrganizationConfig_ReturnsInternalServerError()
        {
            // Arrange
            const int pipelineId = 123;
            const string project = "TestProject";
            
            _configuration["AzureDevOps:Organization"].Returns("");

            // Act
            var result = await _controller.GetBuilds(pipelineId, project);

            // Assert
            var statusCodeResult = Assert.IsType<ObjectResult>(result.Result);
            Assert.Equal(500, statusCodeResult.StatusCode);
            Assert.Equal("Azure DevOps configuration is missing", statusCodeResult.Value);
        }

        [Fact]
        public async Task GetBuilds_WithEmptyPATConfig_ReturnsInternalServerError()
        {
            // Arrange
            const int pipelineId = 123;
            const string project = "TestProject";
            
            _configuration["AzureDevOps:PAT"].Returns("");

            // Act
            var result = await _controller.GetBuilds(pipelineId, project);

            // Assert
            var statusCodeResult = Assert.IsType<ObjectResult>(result.Result);
            Assert.Equal(500, statusCodeResult.StatusCode);
            Assert.Equal("Azure DevOps configuration is missing", statusCodeResult.Value);
        }

        [Fact]
        public async Task GetBuilds_WhenServiceThrowsException_ReturnsInternalServerError()
        {
            // Arrange
            const int pipelineId = 123;
            const string project = "TestProject";
            const int count = 10;
            
            var expectedException = new InvalidOperationException("Service error occurred");
            
            _azureDevOpsService
                .GetBuildsAsync(project, "test-org", "test-pat", pipelineId, count)
                .Throws(expectedException);

            // Act
            var result = await _controller.GetBuilds(pipelineId, project, count);

            // Assert
            var statusCodeResult = Assert.IsType<ObjectResult>(result.Result);
            Assert.Equal(500, statusCodeResult.StatusCode);
            Assert.Equal("An error occurred while retrieving builds", statusCodeResult.Value);
        }

        [Fact]
        public async Task GetBuilds_WhenServiceThrowsException_LogsError()
        {
            // Arrange
            const int pipelineId = 123;
            const string project = "TestProject";
            const int count = 10;
            
            var expectedException = new InvalidOperationException("Service error occurred");
            
            _azureDevOpsService
                .GetBuildsAsync(project, "test-org", "test-pat", pipelineId, count)
                .Throws(expectedException);

            // Act
            await _controller.GetBuilds(pipelineId, project, count);

            // Assert
            // Verify that Log method was called with LogLevel.Error
            _logger.Received(1).Log(
                LogLevel.Error,
                Arg.Any<EventId>(),
                Arg.Is<object>(o => o.ToString()!.Contains("Error retrieving builds for pipeline 123 in project TestProject")),
                expectedException,
                Arg.Any<Func<object, Exception?, string>>());
        }

        [Fact]
        public async Task GetBuilds_WithHttpRequestException_ReturnsInternalServerError()
        {
            // Arrange
            const int pipelineId = 123;
            const string project = "TestProject";
            
            var httpException = new HttpRequestException("Network error");
            
            _azureDevOpsService
                .GetBuildsAsync(project, "test-org", "test-pat", pipelineId, 10)
                .Throws(httpException);

            // Act
            var result = await _controller.GetBuilds(pipelineId, project);

            // Assert
            var statusCodeResult = Assert.IsType<ObjectResult>(result.Result);
            Assert.Equal(500, statusCodeResult.StatusCode);
            Assert.Equal("An error occurred while retrieving builds", statusCodeResult.Value);
        }

        [Fact]
        public async Task GetBuilds_WithEmptyBuildsResult_ReturnsOkWithEmptyList()
        {
            // Arrange
            const int pipelineId = 123;
            const string project = "TestProject";
            
            var emptyBuilds = new List<AzureDevOpsBuild>();
            
            _azureDevOpsService
                .GetBuildsAsync(project, "test-org", "test-pat", pipelineId, 10)
                .Returns(Task.FromResult<IEnumerable<AzureDevOpsBuild>>(emptyBuilds));

            // Act
            var result = await _controller.GetBuilds(pipelineId, project);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var actualBuilds = Assert.IsAssignableFrom<IEnumerable<BuildDto>>(okResult.Value);
            Assert.Empty(actualBuilds);
        }

        [Fact]
        public async Task GetBuilds_WithLargeCount_PassesCorrectParametersToService()
        {
            // Arrange
            const int pipelineId = 999;
            const string project = "LargeProject";
            const int largeCount = 100;
            
            var builds = new List<AzureDevOpsBuild> { new AzureDevOpsBuild { Id = 1 } };
            
            _azureDevOpsService
                .GetBuildsAsync(project, "test-org", "test-pat", pipelineId, largeCount)
                .Returns(Task.FromResult<IEnumerable<AzureDevOpsBuild>>(builds));

            // Act
            await _controller.GetBuilds(pipelineId, project, largeCount);

            // Assert
            await _azureDevOpsService.Received(1)
                .GetBuildsAsync(project, "test-org", "test-pat", pipelineId, largeCount);
        }
    }
}
