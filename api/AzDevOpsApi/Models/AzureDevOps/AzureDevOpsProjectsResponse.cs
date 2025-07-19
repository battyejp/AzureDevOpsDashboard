using System.Text.Json.Serialization;

namespace AzDevOpsApi.Models.AzureDevOps
{
    public class AzureDevOpsProjectsResponse
    {
        [JsonPropertyName("count")]
        public int Count { get; set; }

        [JsonPropertyName("value")]
        public AzureDevOpsProject[] Value { get; set; } = Array.Empty<AzureDevOpsProject>();
    }

    public class AzureDevOpsProject
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("description")]
        public string? Description { get; set; }

        [JsonPropertyName("url")]
        public string Url { get; set; } = string.Empty;

        [JsonPropertyName("state")]
        public string State { get; set; } = string.Empty;

        [JsonPropertyName("visibility")]
        public string Visibility { get; set; } = string.Empty;

        [JsonPropertyName("lastUpdateTime")]
        public DateTime LastUpdateTime { get; set; }
    }
}
