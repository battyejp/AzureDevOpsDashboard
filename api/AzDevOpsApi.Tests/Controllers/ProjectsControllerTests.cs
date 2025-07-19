using AzDevOpsApi.Controllers;
using AzDevOpsApi.Models.AzureDevOps;
using AzDevOpsApi.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using System.Net;
using Xunit;

namespace AzDevOpsApi.Tests.Controllers
{
    public class ProjectsControllerTests
    {
        private readonly IAzureDevOpsService _azureDevOpsService;
        private readonly ILogger<ProjectsController> _logger;
        private readonly ProjectsController _controller;
        
        private const string TestOrganization = "test-org";
        private const string TestPat = "test-pat";

        public ProjectsControllerTests()
        {
            _azureDevOpsService = Substitute.For<IAzureDevOpsService>();
            _logger = Substitute.For<ILogger<ProjectsController>>();
            
            _controller = new ProjectsController(_azureDevOpsService, _logger);
        }

        [Fact]
        public async Task GetProjects_WithValidParameters_ReturnsOkWithProjects()
        {
            // Arrange
            var expectedProjects = new List<AzureDevOpsProject>
            {
                new AzureDevOpsProject 
                { 
                    Id = "project1", 
                    Name = "Project One", 
                    Description = "First test project",
                    Url = "https://dev.azure.com/test-org/_apis/projects/project1",
                    State = "wellFormed",
                    Visibility = "private",
                    LastUpdateTime = DateTime.UtcNow.AddDays(-10)
                },
                new AzureDevOpsProject 
                { 
                    Id = "project2", 
                    Name = "Project Two", 
                    Description = "Second test project",
                    Url = "https://dev.azure.com/test-org/_apis/projects/project2",
                    State = "wellFormed",
                    Visibility = "private",
                    LastUpdateTime = DateTime.UtcNow.AddDays(-5)
                }
            };
            
            _azureDevOpsService.GetProjectsAsync(TestOrganization, TestPat)
                .Returns(expectedProjects);
            
            // Act
            var result = await _controller.GetProjects(TestOrganization, TestPat);
            
            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var returnedProjects = Assert.IsAssignableFrom<IEnumerable<AzureDevOpsProject>>(okResult.Value);
            Assert.Equal(2, returnedProjects.Count());
            Assert.Equal("project1", returnedProjects.First().Id);
            Assert.Equal("Project Two", returnedProjects.Last().Name);
        }

        [Theory]
        [InlineData("", "valid-pat")]
        [InlineData("valid-org", "")]
        [InlineData("", "")]
        public async Task GetProjects_WithMissingParameters_ReturnsBadRequest(string organization, string pat)
        {
            // Act
            var result = await _controller.GetProjects(organization, pat);
            
            // Assert
            Assert.IsType<BadRequestObjectResult>(result.Result);
        }

        [Fact]
        public async Task GetProjects_WithUnauthorizedError_ReturnsUnauthorized()
        {
            // Arrange
            var exception = new HttpRequestException("Unauthorized", null, HttpStatusCode.Unauthorized);
            _azureDevOpsService.GetProjectsAsync(TestOrganization, TestPat)
                .Throws(exception);
            
            // Act
            var result = await _controller.GetProjects(TestOrganization, TestPat);
            
            // Assert
            Assert.IsType<UnauthorizedObjectResult>(result.Result);
        }

        [Fact]
        public async Task GetProjects_WithNotFoundError_ReturnsNotFound()
        {
            // Arrange
            var exception = new HttpRequestException("Not Found", null, HttpStatusCode.NotFound);
            _azureDevOpsService.GetProjectsAsync(TestOrganization, TestPat)
                .Throws(exception);
            
            // Act
            var result = await _controller.GetProjects(TestOrganization, TestPat);
            
            // Assert
            Assert.IsType<NotFoundObjectResult>(result.Result);
        }

        [Fact]
        public async Task GetProjects_WithGenericError_ReturnsInternalServerError()
        {
            // Arrange
            _azureDevOpsService.GetProjectsAsync(TestOrganization, TestPat)
                .Throws(new Exception("Test exception"));
            
            // Act
            var result = await _controller.GetProjects(TestOrganization, TestPat);
            
            // Assert
            var statusCodeResult = Assert.IsType<ObjectResult>(result.Result);
            Assert.Equal(500, statusCodeResult.StatusCode);
        }
    }
}
