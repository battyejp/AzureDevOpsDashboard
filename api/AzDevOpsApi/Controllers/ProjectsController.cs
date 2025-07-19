using Microsoft.AspNetCore.Mvc;
using AzDevOpsApi.Services;
using AzDevOpsApi.Models.AzureDevOps;

namespace AzDevOpsApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProjectsController : ControllerBase
    {
        private readonly IAzureDevOpsService _azureDevOpsService;
        private readonly ILogger<ProjectsController> _logger;
        private readonly IConfiguration _configuration;

        public ProjectsController(IAzureDevOpsService azureDevOpsService, ILogger<ProjectsController> logger, IConfiguration configuration)
        {
            _azureDevOpsService = azureDevOpsService;
            _logger = logger;
            _configuration = configuration;
        }

        /// <summary>
        /// Gets all projects in an Azure DevOps organization
        /// </summary>
        /// <returns>A list of Azure DevOps projects</returns>
        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<AzureDevOpsProject>), 200)]
        [ProducesResponseType(401)]
        [ProducesResponseType(404)]
        public async Task<ActionResult<IEnumerable<AzureDevOpsProject>>> GetProjects()
        {
            try
            {
                // Get Azure DevOps settings from configuration
                var organization = _configuration["AzureDevOps:Organization"];
                var pat = _configuration["AzureDevOps:PAT"];

                if (string.IsNullOrEmpty(organization) || string.IsNullOrEmpty(pat))
                {
                    return StatusCode(500, "Azure DevOps configuration is missing");
                }

                var projects = await _azureDevOpsService.GetProjectsAsync(organization, pat);
                return Ok(projects);
            }
            catch (HttpRequestException ex) when (ex.StatusCode == System.Net.HttpStatusCode.Unauthorized)
            {
                return Unauthorized("Invalid Personal Access Token (PAT)");
            }
            catch (HttpRequestException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                var organization = _configuration["AzureDevOps:Organization"];
                return NotFound($"Organization '{organization}' not found");
            }
            catch (Exception ex)
            {
                var organization = _configuration["AzureDevOps:Organization"];
                _logger.LogError(ex, "Error retrieving projects for organization {Organization}", organization);
                return StatusCode(500, "An error occurred while retrieving projects");
            }
        }
    }
}
