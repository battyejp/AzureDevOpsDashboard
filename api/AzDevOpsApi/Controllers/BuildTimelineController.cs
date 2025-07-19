using AzDevOpsApi.Models;
using AzDevOpsApi.Models.AzureDevOps;
using AzDevOpsApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace AzDevOpsApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BuildTimelineController : ControllerBase
    {
        private readonly IAzureDevOpsService _azureDevOpsService;
        private readonly ILogger<BuildTimelineController> _logger;
        private readonly IConfiguration _configuration;

        public BuildTimelineController(
            IAzureDevOpsService azureDevOpsService,
            ILogger<BuildTimelineController> logger,
            IConfiguration configuration)
        {
            _azureDevOpsService = azureDevOpsService;
            _logger = logger;
            _configuration = configuration;
        }

        [HttpGet("{buildId}")]
        public async Task<ActionResult<AzureDevOpsTimelineResponse>> GetBuildTimeline(int buildId, string project)
        {
            if (string.IsNullOrEmpty(project))
            {
                return BadRequest("Project name is required");
            }

            if (buildId <= 0)
            {
                return BadRequest("Build ID must be greater than zero");
            }

            try
            {
                // Get Azure DevOps settings from configuration
                var organization = _configuration["AzureDevOps:Organization"];
                var pat = _configuration["AzureDevOps:PAT"];

                if (string.IsNullOrEmpty(organization) || string.IsNullOrEmpty(pat))
                {
                    return StatusCode(500, "Azure DevOps configuration is missing");
                }

                var timeline = await _azureDevOpsService.GetBuildTimelineAsync(project, organization, pat, buildId);
                return Ok(timeline);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving timeline for build {BuildId} in project {Project}", buildId, project);
                return StatusCode(500, "An error occurred while retrieving build timeline");
            }
        }
    }
}