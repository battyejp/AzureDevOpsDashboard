using AzDevOpsApi.Models;
using AzDevOpsApi.Models.AzureDevOps;
using AzDevOpsApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace AzDevOpsApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BuildsController : ControllerBase
    {
        private readonly IAzureDevOpsService _azureDevOpsService;
        private readonly ILogger<BuildsController> _logger;
        private readonly IConfiguration _configuration;

        public BuildsController(
            IAzureDevOpsService azureDevOpsService,
            ILogger<BuildsController> logger,
            IConfiguration configuration)
        {
            _azureDevOpsService = azureDevOpsService;
            _logger = logger;
            _configuration = configuration;
        }

        [HttpGet("{pipelineId}")]
        public async Task<ActionResult<IEnumerable<BuildDto>>> GetBuilds(int pipelineId, string project, int count = 10)
        {
            if (string.IsNullOrEmpty(project))
            {
                return BadRequest("Project name is required");
            }

            if (pipelineId <= 0)
            {
                return BadRequest("Pipeline ID must be greater than zero");
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

                var builds = await _azureDevOpsService.GetBuildsAsync(project, organization, pat, pipelineId, count);
                
                // Map to DTO with formatted reason
                var buildDtos = builds.Select(build => new BuildDto
                {
                    Id = build.Id,
                    BuildNumber = build.BuildNumber,
                    Status = build.Status,
                    Result = build.Result,
                    StartTime = build.StartTime,
                    FinishTime = build.FinishTime,
                    Url = build.Url,
                    SourceBranch = build.SourceBranch,
                    SourceVersion = build.SourceVersion,
                    Reason = build.GetReasonDisplayName(),
                    Tags = build.Tags
                });
                
                return Ok(buildDtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving builds for pipeline {PipelineId} in project {Project}", pipelineId, project);
                return StatusCode(500, "An error occurred while retrieving builds");
            }
        }
    }
}