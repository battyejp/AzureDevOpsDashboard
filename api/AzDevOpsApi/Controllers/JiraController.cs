using Microsoft.AspNetCore.Mvc;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

namespace AzDevOpsApi.Controllers
{

    public class JiraIssue
    {
        [System.Text.Json.Serialization.JsonPropertyName("id")]
        public string? Id { get; set; }
        [System.Text.Json.Serialization.JsonPropertyName("fields")]
        public JiraIssueFields? Fields { get; set; }
    }

    public class JiraIssueFields
    {
        [System.Text.Json.Serialization.JsonPropertyName("status")]
        public JiraIssueStatus? Status { get; set; }
    }

    public class JiraIssueStatus
    {
        [System.Text.Json.Serialization.JsonPropertyName("name")]
        public string? Name { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class JiraController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;

        public JiraController(IHttpClientFactory httpClientFactory, IConfiguration configuration)
        {
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
        }

        // GET api/jira/issue/{issueKey}
        [HttpGet("issue/{issueKey}")]
        public async Task<ActionResult<JiraIssue>> GetJiraIssue(string issueKey)
        {
            // MCP server endpoint and config
            var mcpUrl = _configuration["Mcp:Url"] ?? string.Empty;
            var mcpApiKey = _configuration["Mcp:ApiKey"] ?? string.Empty;

            var requestUrl = $"{mcpUrl}/rest/api/2/issue/{issueKey}";

            var client = _httpClientFactory.CreateClient();
            if (!string.IsNullOrEmpty(mcpApiKey))
            {
                client.DefaultRequestHeaders.Add("Authorization", $"Bearer {mcpApiKey}");
            }

            var response = await client.GetAsync(requestUrl);
            var content = await response.Content.ReadAsStringAsync();
            if (response.IsSuccessStatusCode)
            {
                try
                {
                    var model = System.Text.Json.JsonSerializer.Deserialize<JiraIssue>(content, new System.Text.Json.JsonSerializerOptions {
                        PropertyNameCaseInsensitive = true
                    });
                    return Ok(model);
                }
                catch
                {
                    // If parsing fails, return the whole content for debugging
                    return StatusCode(StatusCodes.Status500InternalServerError, content);
                }
            }
            return StatusCode((int)response.StatusCode, content);
        }
    }
}
