using AzDevOpsApi.Models;
using AzDevOpsApi.Models.AzureDevOps;
using System.Text;
using System.Text.Json;

namespace AzDevOpsApi.Services
{
    public class AzureDevOpsService : IAzureDevOpsService
    {
        private readonly ILogger<AzureDevOpsService> _logger;
        private readonly HttpClient _httpClient;
        private readonly string _baseUrl;

        public AzureDevOpsService(ILogger<AzureDevOpsService> logger, HttpClient? httpClient = null, string? baseUrl = null)
        {
            _logger = logger;
            _httpClient = httpClient ?? new HttpClient();
            _baseUrl = baseUrl ?? "https://dev.azure.com";
        }

        /// <summary>
        /// Creates an HTTP request with authentication headers
        /// </summary>
        private HttpRequestMessage CreateRequest(HttpMethod method, string url, string pat)
        {
            var request = new HttpRequestMessage(method, url);
            var authValue = Convert.ToBase64String(Encoding.ASCII.GetBytes($":{pat}"));
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Basic", authValue);
            request.Headers.Accept.Add(new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/json"));
            return request;
        }

        /// <summary>
        /// Makes an HTTP GET request and deserializes the response
        /// </summary>
        private async Task<T> GetAsync<T>(string url, string pat)
        {
            using var request = CreateRequest(HttpMethod.Get, url, pat);
            using var response = await _httpClient.SendAsync(request);
            
            response.EnsureSuccessStatusCode();
            
            // If response is 204 No Content, return default value for the type
            if (response.StatusCode == System.Net.HttpStatusCode.NoContent)
            {
                if (typeof(T) == typeof(AzureDevOpsTimelineResponse))
                {
                    // Extract build ID from URL for timeline requests
                    if (int.TryParse(url.Split('/').LastOrDefault(s => int.TryParse(s, out _)), out int buildId))
                    {
                        return (T)(object)new AzureDevOpsTimelineResponse 
                        { 
                            Id = buildId.ToString(),
                            Records = Array.Empty<AzureDevOpsTimelineRecord>() 
                        };
                    }
                }
                
                return Activator.CreateInstance<T>();
            }
            
            var content = await response.Content.ReadAsStringAsync();
            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };
            
            return JsonSerializer.Deserialize<T>(content, options) ?? throw new InvalidOperationException("Failed to deserialize response");
        }

        public async Task<IEnumerable<AzureDevOpsPipeline>> GetPipelinesAsync(string project, string organization, string pat)
        {
            try
            {
                var url = $"{_baseUrl.TrimEnd('/')}/{organization}/{project}/_apis/build/definitions?api-version=7.0";
                var response = await GetAsync<AzureDevOpsPipelinesResponse>(url, pat);
                
                return response.Value;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving pipelines from Azure DevOps");
                throw;
            }
        }

        public async Task<IEnumerable<AzureDevOpsBuild>> GetBuildsAsync(string project, string organization, string pat, int pipelineId, int count)
        {
            try
            {
                var url = $"{_baseUrl.TrimEnd('/')}/{organization}/{project}/_apis/build/builds?definitions={pipelineId}&$top={count}&statusFilter=all&queryOrder=startTimeDescending&api-version=7.1";
                var response = await GetAsync<AzureDevOpsBuildsResponse>(url, pat);
                
                return response.Value;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving builds from Azure DevOps for pipeline {PipelineId}", pipelineId);
                throw;
            }
        }

        public async Task<AzureDevOpsTimelineResponse> GetBuildTimelineAsync(string project, string organization, string pat, int buildId)
        {
            try
            {
                var url = $"{_baseUrl.TrimEnd('/')}/{organization}/{project}/_apis/build/builds/{buildId}/Timeline?api-version=7.0";
                var timeline = await GetAsync<AzureDevOpsTimelineResponse>(url, pat);
                
                return timeline ?? new AzureDevOpsTimelineResponse { Id = buildId.ToString(), Records = Array.Empty<AzureDevOpsTimelineRecord>() };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving timeline for build {BuildId}", buildId);
                throw;
            }
        }

        /// <summary>
        /// Finds the latest build that has been successfully deployed to a specific environment
        /// by checking the build timeline for a stage that matches the environment name.
        /// </summary>
        public async Task<AzureDevOpsBuild?> FindLatestDeployedBuildAsync(string project, string organization, string pat, int pipelineId, DeploymentEnvironment environment)
        {
            try
            {
                _logger.LogInformation("Finding latest build deployed to {Environment} for pipeline {PipelineId}", environment, pipelineId);
                
                var branch = "refs/heads/main"; // Default branch, can be parameterized if needed
                var count = 10; // Number of builds to check, can be parameterized if needed
                var reasonFilter = "individualCI"; // Filter for individual CI builds
                var url = $"{_baseUrl.TrimEnd('/')}/{organization}/{project}/_apis/build/builds?definitions={pipelineId}&branchName={branch}&$top={count}&reasonFilter={reasonFilter}&api-version=7.1&queryOrder=startTimeDescending";
                var response = await GetAsync<AzureDevOpsBuildsResponse>(url, pat);

                _logger.LogInformation("Retrieved {Count} builds for pipeline {PipelineId}", response.Value.Length, pipelineId);
                
                string environmentName = environment.ToString();
                
                foreach (var build in response.Value)
                {
                    _logger.LogInformation("Checking build {BuildId} ({BuildNumber}) for {Environment} deployment", 
                        build.Id, build.BuildNumber, environmentName);
                    
                    try
                    {
                        var timelineUrl = $"{_baseUrl.TrimEnd('/')}/{organization}/{project}/_apis/build/builds/{build.Id}/Timeline?api-version=7.0";
                        var timeline = await GetAsync<AzureDevOpsTimelineResponse>(timelineUrl, pat);
                        
                        if (timeline != null && timeline.Records != null)
                        {
                            _logger.LogInformation("Found {Count} timeline records for build {BuildId}", 
                                timeline.Records.Length, build.Id);
                            
                            var deploymentRecord = timeline.Records.FirstOrDefault(r => 
                                r.Type == "Stage" &&
                                (r.Result == "succeeded" || r.Result == "inProgress") &&
                                r.Name != null && 
                                r.Name.Contains(environmentName, StringComparison.OrdinalIgnoreCase));
                            
                            if (deploymentRecord != null)
                            {
                                _logger.LogInformation("Found {Result} {Environment} deployment in build {BuildId}, stage: {StageName}", 
                                    deploymentRecord.Result, environmentName, build.Id, deploymentRecord.Name);
                                
                                return build;
                            }
                            else
                            {
                                _logger.LogInformation("No matching deployment stage found in build {BuildId} for {Environment}", 
                                    build.Id, environmentName);
                            }
                        }
                        else
                        {
                            _logger.LogInformation("No timeline records found for build {BuildId}", build.Id);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Error checking timeline for build {BuildId}", build.Id);
                    }
                }
                
                _logger.LogWarning("No builds found with successful deployment to {Environment} after checking {Count} builds", 
                    environmentName, response.Value.Length);
                
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error finding latest deployed build for pipeline {PipelineId} and environment {Environment}", 
                    pipelineId, environment);
                throw;
            }
        }

        public async Task<IEnumerable<AzureDevOpsProject>> GetProjectsAsync(string organization, string pat)
        {
            try
            {
                _logger.LogInformation("Retrieving projects for organization {Organization}", organization);
                
                var url = $"{_baseUrl.TrimEnd('/')}/{organization}/_apis/projects?api-version=7.0";
                var response = await GetAsync<AzureDevOpsProjectsResponse>(url, pat);
                
                _logger.LogInformation("Retrieved {Count} projects from Azure DevOps", response.Value.Length);
                
                return response.Value;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving projects from Azure DevOps for organization {Organization}", organization);
                throw;
            }
        }
    }
}