using AzDevOpsApi.Models;
using AzDevOpsApi.Models.AzureDevOps;
using AzDevOpsApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace AzDevOpsApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DeployedBuildsController : ControllerBase
    {
        private readonly IAzureDevOpsService _azureDevOpsService;
        private readonly ILogger<DeployedBuildsController> _logger;
        private readonly IConfiguration _configuration;

        public DeployedBuildsController(
            IAzureDevOpsService azureDevOpsService,
            ILogger<DeployedBuildsController> logger,
            IConfiguration configuration)
        {
            _azureDevOpsService = azureDevOpsService;
            _logger = logger;
            _configuration = configuration;
        }

        [HttpGet("{pipelineId}/{environment}")]
        public async Task<ActionResult<AzureDevOpsBuild>> GetLatestDeployedBuild(int pipelineId, string environment, string project)
        {
            _logger.LogInformation("Received request for latest deployed build for pipeline {PipelineId} in environment {Environment} for project {Project}", 
                pipelineId, environment, project);
                
            if (string.IsNullOrEmpty(project))
            {
                return BadRequest("Project name is required");
            }

            if (pipelineId <= 0)
            {
                return BadRequest("Pipeline ID must be greater than zero");
            }

            if (string.IsNullOrEmpty(environment))
            {
                return BadRequest("Environment is required");
            }

            // Parse the environment string to enum
            if (!Enum.TryParse<DeploymentEnvironment>(environment, true, out var environmentEnum))
            {
                _logger.LogWarning("Invalid environment: {Environment}", environment);
                return BadRequest($"Invalid environment. Valid values are: {string.Join(", ", Enum.GetNames(typeof(DeploymentEnvironment)))}");
            }

            try
            {
                // Get Azure DevOps settings from configuration
                var organization = _configuration["AzureDevOps:Organization"];
                var pat = _configuration["AzureDevOps:PAT"];

                if (string.IsNullOrEmpty(organization) || string.IsNullOrEmpty(pat))
                {
                    _logger.LogError("Azure DevOps configuration is missing");
                    return StatusCode(500, "Azure DevOps configuration is missing");
                }

                _logger.LogInformation("Calling Azure DevOps service to find latest deployed build for pipeline {PipelineId} in environment {Environment}", 
                    pipelineId, environment);
                    
                var build = await _azureDevOpsService.FindLatestDeployedBuildAsync(
                    project, organization, pat, pipelineId, environmentEnum);

                if (build == null)
                {
                    _logger.LogInformation("No deployed build found for pipeline {PipelineId} in environment {Environment}", 
                        pipelineId, environment);
                    return NotFound($"No deployed build found for pipeline {pipelineId} in environment {environment}");
                }

                _logger.LogInformation("Found deployed build {BuildId} for pipeline {PipelineId} in environment {Environment}", 
                    build.Id, pipelineId, environment);
                    
                return Ok(build);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving latest deployed build for pipeline {PipelineId} in environment {Environment} for project {Project}", 
                    pipelineId, environment, project);
                return StatusCode(500, "An error occurred while retrieving the build");
            }
        }
    }
}
