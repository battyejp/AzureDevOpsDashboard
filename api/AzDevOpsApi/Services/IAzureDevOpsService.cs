using AzDevOpsApi.Models;
using AzDevOpsApi.Models.AzureDevOps;

namespace AzDevOpsApi.Services
{
    public interface IAzureDevOpsService
    {
        Task<IEnumerable<AzureDevOpsPipeline>> GetPipelinesAsync(string project, string organization, string pat);
        Task<IEnumerable<AzureDevOpsBuild>> GetBuildsAsync(string project, string organization, string pat, int pipelineId, int count, string statusFilter = "all");
        Task<AzureDevOpsTimelineResponse> GetBuildTimelineAsync(string project, string organization, string pat, int buildId);
        Task<AzureDevOpsBuild?> FindLatestDeployedBuildAsync(string project, string organization, string pat, int pipelineId, DeploymentEnvironment environment);
        Task<IEnumerable<AzureDevOpsProject>> GetProjectsAsync(string organization, string pat);
    }
}
