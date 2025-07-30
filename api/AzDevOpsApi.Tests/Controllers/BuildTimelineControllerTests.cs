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
    public class BuildTimelineControllerTests
    {
        private readonly IAzureDevOpsService _azureDevOpsService;
        private readonly ILogger<BuildTimelineController> _logger;
        private readonly IConfiguration _configuration;
        private readonly BuildTimelineController _controller;

        public BuildTimelineControllerTests()
        {
            _azureDevOpsService = Substitute.For<IAzureDevOpsService>();
            _logger = Substitute.For<ILogger<BuildTimelineController>>();
            _configuration = Substitute.For<IConfiguration>();
            
            // Setup default configuration values
            _configuration["AzureDevOps:Organization"].Returns("test-org");
            _configuration["AzureDevOps:PAT"].Returns("test-pat");
            
            _controller = new BuildTimelineController(_azureDevOpsService, _logger, _configuration);
        }

        [Fact]
        public async Task GetBuildTimeline_WithValidParameters_ReturnsOkWithTimeline()
        {
            // Arrange
            const int buildId = 123;
            const string project = "TestProject";
            
            var expectedTimeline = new AzureDevOpsTimelineResponse
            {
                Id = "timeline-1",
                Records = new AzureDevOpsTimelineRecord[]
                {
                    new AzureDevOpsTimelineRecord
                    {
                        Id = "record-1",
                        Name = "Build Step 1",
                        Type = "Task",
                        State = "Completed",
                        Result = "Succeeded",
                        StartTime = DateTime.UtcNow.AddHours(-2),
                        FinishTime = DateTime.UtcNow.AddMinutes(-90),
                        PercentComplete = 100,
                        Log = new AzureDevOpsLogReference { Url = "https://dev.azure.com/test-org/logs/1" }
                    },
                    new AzureDevOpsTimelineRecord
                    {
                        Id = "record-2",
                        Name = "Build Step 2",
                        Type = "Task",
                        State = "Completed",
                        Result = "Succeeded",
                        StartTime = DateTime.UtcNow.AddMinutes(-90),
                        FinishTime = DateTime.UtcNow.AddHours(-1),
                        PercentComplete = 100,
                        Log = new AzureDevOpsLogReference { Url = "https://dev.azure.com/test-org/logs/2" }
                    }
                }
            };

            _azureDevOpsService
                .GetBuildTimelineAsync(project, "test-org", "test-pat", buildId)
                .Returns(expectedTimeline);

            // Act
            var result = await _controller.GetBuildTimeline(buildId, project);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var actualTimeline = Assert.IsType<AzureDevOpsTimelineResponse>(okResult.Value);
            Assert.Equal(expectedTimeline.Id, actualTimeline.Id);
            Assert.Equal(expectedTimeline.Records.Length, actualTimeline.Records.Length);
        }

        [Theory]
        [InlineData("")]
        public async Task GetBuildTimeline_WithEmptyProject_ReturnsBadRequest(string project)
        {
            // Arrange
            const int buildId = 123;

            // Act
            var result = await _controller.GetBuildTimeline(buildId, project);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal("Project name is required", badRequestResult.Value);
            
            await _azureDevOpsService.DidNotReceive()
                .GetBuildTimelineAsync(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>(), Arg.Any<int>());
        }

        [Fact]
        public async Task GetBuildTimeline_WithNullProject_ReturnsBadRequest()
        {
            // Arrange
            const int buildId = 123;
            string? project = null;

            // Act
            var result = await _controller.GetBuildTimeline(buildId, project!);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal("Project name is required", badRequestResult.Value);
            
            await _azureDevOpsService.DidNotReceive()
                .GetBuildTimelineAsync(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>(), Arg.Any<int>());
        }

        [Fact]
        public async Task GetBuildTimeline_WithWhitespaceProject_ReturnsOkBecauseNotCheckedByController()
        {
            // Arrange
            const int buildId = 123;
            const string project = "   ";
            
            var expectedTimeline = new AzureDevOpsTimelineResponse { Id = "test" };
            _azureDevOpsService
                .GetBuildTimelineAsync(project, "test-org", "test-pat", buildId)
                .Returns(expectedTimeline);

            // Act
            var result = await _controller.GetBuildTimeline(buildId, project);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            await _azureDevOpsService.Received(1)
                .GetBuildTimelineAsync(project, "test-org", "test-pat", buildId);
        }

        [Theory]
        [InlineData(0)]
        [InlineData(-1)]
        [InlineData(-100)]
        public async Task GetBuildTimeline_WithInvalidBuildId_ReturnsBadRequest(int buildId)
        {
            // Arrange
            const string project = "TestProject";

            // Act
            var result = await _controller.GetBuildTimeline(buildId, project);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal("Build ID must be greater than zero", badRequestResult.Value);
            
            await _azureDevOpsService.DidNotReceive()
                .GetBuildTimelineAsync(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>(), Arg.Any<int>());
        }

        [Fact]
        public async Task GetBuildTimeline_WithMissingOrganizationConfig_ReturnsInternalServerError()
        {
            // Arrange
            const int buildId = 123;
            const string project = "TestProject";
            
            _configuration["AzureDevOps:Organization"].Returns((string?)null);

            // Act
            var result = await _controller.GetBuildTimeline(buildId, project);

            // Assert
            var statusCodeResult = Assert.IsType<ObjectResult>(result.Result);
            Assert.Equal(500, statusCodeResult.StatusCode);
            Assert.Equal("Azure DevOps configuration is missing", statusCodeResult.Value);
            
            await _azureDevOpsService.DidNotReceive()
                .GetBuildTimelineAsync(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>(), Arg.Any<int>());
        }

        [Fact]
        public async Task GetBuildTimeline_WithMissingPATConfig_ReturnsInternalServerError()
        {
            // Arrange
            const int buildId = 123;
            const string project = "TestProject";
            
            _configuration["AzureDevOps:PAT"].Returns((string?)null);

            // Act
            var result = await _controller.GetBuildTimeline(buildId, project);

            // Assert
            var statusCodeResult = Assert.IsType<ObjectResult>(result.Result);
            Assert.Equal(500, statusCodeResult.StatusCode);
            Assert.Equal("Azure DevOps configuration is missing", statusCodeResult.Value);
            
            await _azureDevOpsService.DidNotReceive()
                .GetBuildTimelineAsync(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>(), Arg.Any<int>());
        }

        [Fact]
        public async Task GetBuildTimeline_WithEmptyOrganizationConfig_ReturnsInternalServerError()
        {
            // Arrange
            const int buildId = 123;
            const string project = "TestProject";
            
            _configuration["AzureDevOps:Organization"].Returns("");

            // Act
            var result = await _controller.GetBuildTimeline(buildId, project);

            // Assert
            var statusCodeResult = Assert.IsType<ObjectResult>(result.Result);
            Assert.Equal(500, statusCodeResult.StatusCode);
            Assert.Equal("Azure DevOps configuration is missing", statusCodeResult.Value);
        }

        [Fact]
        public async Task GetBuildTimeline_WithEmptyPATConfig_ReturnsInternalServerError()
        {
            // Arrange
            const int buildId = 123;
            const string project = "TestProject";
            
            _configuration["AzureDevOps:PAT"].Returns("");

            // Act
            var result = await _controller.GetBuildTimeline(buildId, project);

            // Assert
            var statusCodeResult = Assert.IsType<ObjectResult>(result.Result);
            Assert.Equal(500, statusCodeResult.StatusCode);
            Assert.Equal("Azure DevOps configuration is missing", statusCodeResult.Value);
        }

        [Fact]
        public async Task GetBuildTimeline_WhenServiceThrowsException_ReturnsInternalServerError()
        {
            // Arrange
            const int buildId = 123;
            const string project = "TestProject";
            
            var expectedException = new InvalidOperationException("Service error occurred");
            
            _azureDevOpsService
                .GetBuildTimelineAsync(project, "test-org", "test-pat", buildId)
                .Throws(expectedException);

            // Act
            var result = await _controller.GetBuildTimeline(buildId, project);

            // Assert
            var statusCodeResult = Assert.IsType<ObjectResult>(result.Result);
            Assert.Equal(500, statusCodeResult.StatusCode);
            Assert.Equal("An error occurred while retrieving build timeline", statusCodeResult.Value);
        }

        [Fact]
        public async Task GetBuildTimeline_WhenServiceThrowsException_LogsError()
        {
            // Arrange
            const int buildId = 123;
            const string project = "TestProject";
            
            var expectedException = new InvalidOperationException("Service error occurred");
            
            _azureDevOpsService
                .GetBuildTimelineAsync(project, "test-org", "test-pat", buildId)
                .Throws(expectedException);

            // Act
            await _controller.GetBuildTimeline(buildId, project);

            // Assert
            // Verify that Log method was called with LogLevel.Error
            _logger.Received(1).Log(
                LogLevel.Error,
                Arg.Any<EventId>(),
                Arg.Is<object>(o => o.ToString()!.Contains("Error retrieving timeline for build 123 in project TestProject")),
                expectedException,
                Arg.Any<Func<object, Exception?, string>>());
        }

        [Fact]
        public async Task GetBuildTimeline_WithHttpRequestException_ReturnsInternalServerError()
        {
            // Arrange
            const int buildId = 123;
            const string project = "TestProject";
            
            var httpException = new HttpRequestException("Network error");
            
            _azureDevOpsService
                .GetBuildTimelineAsync(project, "test-org", "test-pat", buildId)
                .Throws(httpException);

            // Act
            var result = await _controller.GetBuildTimeline(buildId, project);

            // Assert
            var statusCodeResult = Assert.IsType<ObjectResult>(result.Result);
            Assert.Equal(500, statusCodeResult.StatusCode);
            Assert.Equal("An error occurred while retrieving build timeline", statusCodeResult.Value);
        }

        [Fact]
        public async Task GetBuildTimeline_PassesCorrectParametersToService()
        {
            // Arrange
            const int buildId = 999;
            const string project = "CustomProject";
            
            var timeline = new AzureDevOpsTimelineResponse { Id = "test" };
            
            _azureDevOpsService
                .GetBuildTimelineAsync(project, "test-org", "test-pat", buildId)
                .Returns(timeline);

            // Act
            await _controller.GetBuildTimeline(buildId, project);

            // Assert
            await _azureDevOpsService.Received(1)
                .GetBuildTimelineAsync(project, "test-org", "test-pat", buildId);
        }

        [Fact]
        public async Task GetBuildTimeline_WithTypeFilter_FiltersRecordsByType()
        {
            // Arrange
            const int buildId = 123;
            const string project = "TestProject";
            const string filterType = "Task";
            
            var timeline = new AzureDevOpsTimelineResponse
            {
                Id = "timeline-1",
                Records = new AzureDevOpsTimelineRecord[]
                {
                    new AzureDevOpsTimelineRecord { Id = "record-1", Type = "Task", State = "completed" },
                    new AzureDevOpsTimelineRecord { Id = "record-2", Type = "Job", State = "completed" },
                    new AzureDevOpsTimelineRecord { Id = "record-3", Type = "Task", State = "running" }
                }
            };
            
            _azureDevOpsService
                .GetBuildTimelineAsync(project, "test-org", "test-pat", buildId)
                .Returns(timeline);

            // Act
            var result = await _controller.GetBuildTimeline(buildId, project, filterType);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var returnedTimeline = Assert.IsType<AzureDevOpsTimelineResponse>(okResult.Value);
            
            Assert.Equal(2, returnedTimeline.Records?.Length);
            Assert.All(returnedTimeline.Records!, record => Assert.Equal("Task", record.Type));
        }

        [Fact]
        public async Task GetBuildTimeline_WithStateFilter_FiltersRecordsByState()
        {
            // Arrange
            const int buildId = 123;
            const string project = "TestProject";
            const string filterState = "completed";
            
            var timeline = new AzureDevOpsTimelineResponse
            {
                Id = "timeline-1",
                Records = new AzureDevOpsTimelineRecord[]
                {
                    new AzureDevOpsTimelineRecord { Id = "record-1", Type = "Task", State = "completed" },
                    new AzureDevOpsTimelineRecord { Id = "record-2", Type = "Job", State = "running" },
                    new AzureDevOpsTimelineRecord { Id = "record-3", Type = "Task", State = "completed" }
                }
            };
            
            _azureDevOpsService
                .GetBuildTimelineAsync(project, "test-org", "test-pat", buildId)
                .Returns(timeline);

            // Act
            var result = await _controller.GetBuildTimeline(buildId, project, null, filterState);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var returnedTimeline = Assert.IsType<AzureDevOpsTimelineResponse>(okResult.Value);
            
            Assert.Equal(2, returnedTimeline.Records?.Length);
            Assert.All(returnedTimeline.Records!, record => Assert.Equal("completed", record.State));
        }

        [Fact]
        public async Task GetBuildTimeline_WithBothTypeAndStateFilter_FiltersRecordsByBoth()
        {
            // Arrange
            const int buildId = 123;
            const string project = "TestProject";
            const string filterType = "Task";
            const string filterState = "completed";
            
            var timeline = new AzureDevOpsTimelineResponse
            {
                Id = "timeline-1",
                Records = new AzureDevOpsTimelineRecord[]
                {
                    new AzureDevOpsTimelineRecord { Id = "record-1", Type = "Task", State = "completed" },
                    new AzureDevOpsTimelineRecord { Id = "record-2", Type = "Job", State = "completed" },
                    new AzureDevOpsTimelineRecord { Id = "record-3", Type = "Task", State = "running" },
                    new AzureDevOpsTimelineRecord { Id = "record-4", Type = "Task", State = "completed" }
                }
            };
            
            _azureDevOpsService
                .GetBuildTimelineAsync(project, "test-org", "test-pat", buildId)
                .Returns(timeline);

            // Act
            var result = await _controller.GetBuildTimeline(buildId, project, filterType, filterState);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var returnedTimeline = Assert.IsType<AzureDevOpsTimelineResponse>(okResult.Value);
            
            Assert.Equal(2, returnedTimeline.Records?.Length);
            Assert.All(returnedTimeline.Records!, record => 
            {
                Assert.Equal("Task", record.Type);
                Assert.Equal("completed", record.State);
            });
        }

        [Fact]
        public async Task GetBuildTimeline_WithFilters_LogsFilteringInformation()
        {
            // Arrange
            const int buildId = 123;
            const string project = "TestProject";
            const string filterType = "Task";
            const string filterState = "completed";
            
            var timeline = new AzureDevOpsTimelineResponse
            {
                Id = "timeline-1",
                Records = new AzureDevOpsTimelineRecord[]
                {
                    new AzureDevOpsTimelineRecord { Id = "record-1", Type = "Task", State = "completed" }
                }
            };
            
            _azureDevOpsService
                .GetBuildTimelineAsync(project, "test-org", "test-pat", buildId)
                .Returns(timeline);

            // Act
            await _controller.GetBuildTimeline(buildId, project, filterType, filterState);

            // Assert
            _logger.Received(1).Log(
                LogLevel.Information,
                Arg.Any<EventId>(),
                Arg.Is<object>(o => o.ToString()!.Contains("Filtered timeline records for build 123") &&
                                   o.ToString()!.Contains("type 'Task'") &&
                                   o.ToString()!.Contains("state 'completed'") &&
                                   o.ToString()!.Contains("1 records")),
                null,
                Arg.Any<Func<object, Exception?, string>>());
        }
    }
}
