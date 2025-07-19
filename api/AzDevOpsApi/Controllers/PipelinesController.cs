using AzDevOpsApi.Models;
using AzDevOpsApi.Models.AzureDevOps;
using AzDevOpsApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace AzDevOpsApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PipelinesController : ControllerBase
    {
        private readonly IAzureDevOpsService _azureDevOpsService;
        private readonly ILogger<PipelinesController> _logger;
        private readonly IConfiguration _configuration;

        public PipelinesController(
            IAzureDevOpsService azureDevOpsService,
            ILogger<PipelinesController> logger,
            IConfiguration configuration)
        {
            _azureDevOpsService = azureDevOpsService;
            _logger = logger;
            _configuration = configuration;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<AzureDevOpsPipeline>>> GetPipelines(string project)
        {
            if (string.IsNullOrEmpty(project))
            {
                return BadRequest("Project name is required");
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

                var pipelines = await _azureDevOpsService.GetPipelinesAsync(project, organization, pat);
                return Ok(pipelines);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving pipelines for project {Project}", project);
                return StatusCode(500, "An error occurred while retrieving pipelines");
            }
        }
    }
}
