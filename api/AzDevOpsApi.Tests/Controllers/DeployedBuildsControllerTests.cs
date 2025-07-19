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
    public class DeployedBuildsControllerTests
    {
        private readonly IAzureDevOpsService _azureDevOpsService;
        private readonly ILogger<DeployedBuildsController> _logger;
        private readonly IConfiguration _configuration;
        private readonly DeployedBuildsController _controller;

        public DeployedBuildsControllerTests()
        {
            _azureDevOpsService = Substitute.For<IAzureDevOpsService>();
            _logger = Substitute.For<ILogger<DeployedBuildsController>>();
            _configuration = Substitute.For<IConfiguration>();
            
            // Setup default configuration values
            _configuration["AzureDevOps:Organization"].Returns("test-org");
            _configuration["AzureDevOps:PAT"].Returns("test-pat");
            
            _controller = new DeployedBuildsController(_azureDevOpsService, _logger, _configuration);
        }

        [Fact]
        public async Task GetLatestDeployedBuild_WithValidParameters_ReturnsOkResult()
        {
            // Arrange
            var pipelineId = 123;
            var environment = "Dev";
            var project = "TestProject";
            var expectedBuild = new AzureDevOpsBuild 
            { 
                Id = 1, 
                BuildNumber = "1.0.1", 
                Status = "Completed", 
                Result = "Succeeded",
                StartTime = DateTime.UtcNow.AddHours(-2),
                FinishTime = DateTime.UtcNow.AddHours(-1)
            };
            
            _azureDevOpsService.FindLatestDeployedBuildAsync(
                project, "test-org", "test-pat", pipelineId, DeploymentEnvironment.Dev)
                .Returns(expectedBuild);

            // Act
            var result = await _controller.GetLatestDeployedBuild(pipelineId, environment, project);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var returnedBuild = Assert.IsType<AzureDevOpsBuild>(okResult.Value);
            Assert.Equal(expectedBuild.Id, returnedBuild.Id);
            Assert.Equal(expectedBuild.BuildNumber, returnedBuild.BuildNumber);
        }

        [Fact]
        public async Task GetLatestDeployedBuild_WithNullProject_ReturnsBadRequest()
        {
            // Arrange
            var pipelineId = 123;
            var environment = "Dev";
            string? project = null;

            // Act
            var result = await _controller.GetLatestDeployedBuild(pipelineId, environment, project!);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal("Project name is required", badRequestResult.Value);
        }

        [Fact]
        public async Task GetLatestDeployedBuild_WithEmptyProject_ReturnsBadRequest()
        {
            // Arrange
            var pipelineId = 123;
            var environment = "Dev";
            var project = "";

            // Act
            var result = await _controller.GetLatestDeployedBuild(pipelineId, environment, project);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal("Project name is required", badRequestResult.Value);
        }

        [Fact]
        public async Task GetLatestDeployedBuild_WithWhitespaceProject_ReturnsOkBecauseNotCheckedByController()
        {
            // Arrange
            var pipelineId = 123;
            var environment = "Dev";
            var project = "   ";
            var expectedBuild = new AzureDevOpsBuild { Id = 1, BuildNumber = "1.0.1", Status = "Completed" };
            
            _azureDevOpsService.FindLatestDeployedBuildAsync(
                project, "test-org", "test-pat", pipelineId, DeploymentEnvironment.Dev)
                .Returns(expectedBuild);

            // Act
            var result = await _controller.GetLatestDeployedBuild(pipelineId, environment, project);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            await _azureDevOpsService.Received(1).FindLatestDeployedBuildAsync(
                project, "test-org", "test-pat", pipelineId, DeploymentEnvironment.Dev);
        }

        [Fact]
        public async Task GetLatestDeployedBuild_WithZeroPipelineId_ReturnsBadRequest()
        {
            // Arrange
            var pipelineId = 0;
            var environment = "Dev";
            var project = "TestProject";

            // Act
            var result = await _controller.GetLatestDeployedBuild(pipelineId, environment, project);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal("Pipeline ID must be greater than zero", badRequestResult.Value);
        }

        [Fact]
        public async Task GetLatestDeployedBuild_WithNegativePipelineId_ReturnsBadRequest()
        {
            // Arrange
            var pipelineId = -1;
            var environment = "Dev";
            var project = "TestProject";

            // Act
            var result = await _controller.GetLatestDeployedBuild(pipelineId, environment, project);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal("Pipeline ID must be greater than zero", badRequestResult.Value);
        }

        [Fact]
        public async Task GetLatestDeployedBuild_WithNullEnvironment_ReturnsBadRequest()
        {
            // Arrange
            var pipelineId = 123;
            string? environment = null;
            var project = "TestProject";

            // Act
            var result = await _controller.GetLatestDeployedBuild(pipelineId, environment!, project);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal("Environment is required", badRequestResult.Value);
        }

        [Fact]
        public async Task GetLatestDeployedBuild_WithEmptyEnvironment_ReturnsBadRequest()
        {
            // Arrange
            var pipelineId = 123;
            var environment = "";
            var project = "TestProject";

            // Act
            var result = await _controller.GetLatestDeployedBuild(pipelineId, environment, project);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal("Environment is required", badRequestResult.Value);
        }

        [Fact]
        public async Task GetLatestDeployedBuild_WithInvalidEnvironment_ReturnsBadRequest()
        {
            // Arrange
            var pipelineId = 123;
            var environment = "InvalidEnvironment";
            var project = "TestProject";

            // Act
            var result = await _controller.GetLatestDeployedBuild(pipelineId, environment, project);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            var expectedMessage = "Invalid environment. Valid values are: Dev, SIT, UAT, PPD, Prod";
            Assert.Equal(expectedMessage, badRequestResult.Value);
        }

        [Theory]
        [InlineData("Dev", DeploymentEnvironment.Dev)]
        [InlineData("SIT", DeploymentEnvironment.SIT)]
        [InlineData("UAT", DeploymentEnvironment.UAT)]
        [InlineData("PPD", DeploymentEnvironment.PPD)]
        [InlineData("Prod", DeploymentEnvironment.Prod)]
        [InlineData("dev", DeploymentEnvironment.Dev)] // Case insensitive
        [InlineData("PROD", DeploymentEnvironment.Prod)] // Case insensitive
        public async Task GetLatestDeployedBuild_WithValidEnvironments_CallsServiceWithCorrectEnum(
            string environmentString, DeploymentEnvironment expectedEnum)
        {
            // Arrange
            var pipelineId = 123;
            var project = "TestProject";
            var expectedBuild = new AzureDevOpsBuild { Id = 1, BuildNumber = "1.0.1", Status = "Completed" };
            
            _azureDevOpsService.FindLatestDeployedBuildAsync(
                project, "test-org", "test-pat", pipelineId, expectedEnum)
                .Returns(expectedBuild);

            // Act
            var result = await _controller.GetLatestDeployedBuild(pipelineId, environmentString, project);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            await _azureDevOpsService.Received(1).FindLatestDeployedBuildAsync(
                project, "test-org", "test-pat", pipelineId, expectedEnum);
        }

        [Fact]
        public async Task GetLatestDeployedBuild_WithMissingOrganizationConfig_ReturnsInternalServerError()
        {
            // Arrange
            var pipelineId = 123;
            var environment = "Dev";
            var project = "TestProject";
            
            _configuration["AzureDevOps:Organization"].Returns((string?)null);

            // Act
            var result = await _controller.GetLatestDeployedBuild(pipelineId, environment, project);

            // Assert
            var statusCodeResult = Assert.IsType<ObjectResult>(result.Result);
            Assert.Equal(500, statusCodeResult.StatusCode);
            Assert.Equal("Azure DevOps configuration is missing", statusCodeResult.Value);
        }

        [Fact]
        public async Task GetLatestDeployedBuild_WithMissingPATConfig_ReturnsInternalServerError()
        {
            // Arrange
            var pipelineId = 123;
            var environment = "Dev";
            var project = "TestProject";
            
            _configuration["AzureDevOps:PAT"].Returns((string?)null);

            // Act
            var result = await _controller.GetLatestDeployedBuild(pipelineId, environment, project);

            // Assert
            var statusCodeResult = Assert.IsType<ObjectResult>(result.Result);
            Assert.Equal(500, statusCodeResult.StatusCode);
            Assert.Equal("Azure DevOps configuration is missing", statusCodeResult.Value);
        }

        [Fact]
        public async Task GetLatestDeployedBuild_WithEmptyOrganizationConfig_ReturnsInternalServerError()
        {
            // Arrange
            var pipelineId = 123;
            var environment = "Dev";
            var project = "TestProject";
            
            _configuration["AzureDevOps:Organization"].Returns("");

            // Act
            var result = await _controller.GetLatestDeployedBuild(pipelineId, environment, project);

            // Assert
            var statusCodeResult = Assert.IsType<ObjectResult>(result.Result);
            Assert.Equal(500, statusCodeResult.StatusCode);
            Assert.Equal("Azure DevOps configuration is missing", statusCodeResult.Value);
        }

        [Fact]
        public async Task GetLatestDeployedBuild_WithEmptyPATConfig_ReturnsInternalServerError()
        {
            // Arrange
            var pipelineId = 123;
            var environment = "Dev";
            var project = "TestProject";
            
            _configuration["AzureDevOps:PAT"].Returns("");

            // Act
            var result = await _controller.GetLatestDeployedBuild(pipelineId, environment, project);

            // Assert
            var statusCodeResult = Assert.IsType<ObjectResult>(result.Result);
            Assert.Equal(500, statusCodeResult.StatusCode);
            Assert.Equal("Azure DevOps configuration is missing", statusCodeResult.Value);
        }

        [Fact]
        public async Task GetLatestDeployedBuild_WhenServiceThrowsException_ReturnsInternalServerError()
        {
            // Arrange
            var pipelineId = 123;
            var environment = "Dev";
            var project = "TestProject";
            var expectedException = new Exception("Service error");
            
            _azureDevOpsService.FindLatestDeployedBuildAsync(
                project, "test-org", "test-pat", pipelineId, DeploymentEnvironment.Dev)
                .ThrowsAsync(expectedException);

            // Act
            var result = await _controller.GetLatestDeployedBuild(pipelineId, environment, project);

            // Assert
            var statusCodeResult = Assert.IsType<ObjectResult>(result.Result);
            Assert.Equal(500, statusCodeResult.StatusCode);
            Assert.Equal("An error occurred while retrieving the build", statusCodeResult.Value);
        }

        [Fact]
        public async Task GetLatestDeployedBuild_LogsInformationMessages()
        {
            // Arrange
            var pipelineId = 123;
            var environment = "Dev";
            var project = "TestProject";
            var expectedBuild = new AzureDevOpsBuild { Id = 1, BuildNumber = "1.0.1", Status = "Completed" };
            
            _azureDevOpsService.FindLatestDeployedBuildAsync(
                project, "test-org", "test-pat", pipelineId, DeploymentEnvironment.Dev)
                .Returns(expectedBuild);

            // Act
            await _controller.GetLatestDeployedBuild(pipelineId, environment, project);

            // Assert
            _logger.Received(1).Log(
                LogLevel.Information,
                Arg.Any<EventId>(),
                Arg.Is<object>(o => o.ToString()!.Contains("Received request for latest deployed build for pipeline 123 in environment Dev for project TestProject")),
                null,
                Arg.Any<Func<object, Exception?, string>>());
            _logger.Received(1).Log(
                LogLevel.Information,
                Arg.Any<EventId>(),
                Arg.Is<object>(o => o.ToString()!.Contains("Calling Azure DevOps service to find latest deployed build for pipeline 123 in environment Dev")),
                null,
                Arg.Any<Func<object, Exception?, string>>());
            _logger.Received(1).Log(
                LogLevel.Information,
                Arg.Any<EventId>(),
                Arg.Is<object>(o => o.ToString()!.Contains("Found deployed build 1 for pipeline 123 in environment Dev")),
                null,
                Arg.Any<Func<object, Exception?, string>>());
        }

        [Fact]
        public async Task GetLatestDeployedBuild_WithInvalidEnvironment_LogsWarning()
        {
            // Arrange
            var pipelineId = 123;
            var environment = "InvalidEnvironment";
            var project = "TestProject";

            // Act
            await _controller.GetLatestDeployedBuild(pipelineId, environment, project);

            // Assert
            _logger.Received(1).Log(
                LogLevel.Warning,
                Arg.Any<EventId>(),
                Arg.Is<object>(o => o.ToString()!.Contains("Invalid environment: InvalidEnvironment")),
                null,
                Arg.Any<Func<object, Exception?, string>>());
        }

        [Fact]
        public async Task GetLatestDeployedBuild_WithMissingConfig_LogsError()
        {
            // Arrange
            var pipelineId = 123;
            var environment = "Dev";
            var project = "TestProject";
            
            _configuration["AzureDevOps:Organization"].Returns((string?)null);

            // Act
            await _controller.GetLatestDeployedBuild(pipelineId, environment, project);

            // Assert
            _logger.Received(1).Log(
                LogLevel.Error,
                Arg.Any<EventId>(),
                Arg.Is<object>(o => o.ToString()!.Contains("Azure DevOps configuration is missing")),
                null,
                Arg.Any<Func<object, Exception?, string>>());
        }

        [Fact]
        public async Task GetLatestDeployedBuild_WhenServiceThrowsException_LogsError()
        {
            // Arrange
            var pipelineId = 123;
            var environment = "Dev";
            var project = "TestProject";
            var expectedException = new Exception("Service error");
            
            _azureDevOpsService.FindLatestDeployedBuildAsync(
                project, "test-org", "test-pat", pipelineId, DeploymentEnvironment.Dev)
                .ThrowsAsync(expectedException);

            // Act
            await _controller.GetLatestDeployedBuild(pipelineId, environment, project);

            // Assert
            _logger.Received(1).Log(
                LogLevel.Error,
                Arg.Any<EventId>(),
                Arg.Is<object>(o => o.ToString()!.Contains("Error retrieving latest deployed build for pipeline 123 in environment Dev for project TestProject")),
                expectedException,
                Arg.Any<Func<object, Exception?, string>>());
        }

        [Fact]
        public async Task GetLatestDeployedBuild_CallsServiceWithCorrectParameters()
        {
            // Arrange
            var pipelineId = 123;
            var environment = "Dev";
            var project = "TestProject";
            var expectedBuild = new AzureDevOpsBuild { Id = 1, BuildNumber = "1.0.1", Status = "Completed" };
            
            _azureDevOpsService.FindLatestDeployedBuildAsync(
                project, "test-org", "test-pat", pipelineId, DeploymentEnvironment.Dev)
                .Returns(expectedBuild);

            // Act
            await _controller.GetLatestDeployedBuild(pipelineId, environment, project);

            // Assert
            await _azureDevOpsService.Received(1).FindLatestDeployedBuildAsync(
                "TestProject", "test-org", "test-pat", 123, DeploymentEnvironment.Dev);
        }
    }
}
