using System.Text.Json.Serialization;

namespace AzDevOpsApi.Models.AzureDevOps
{
    public class AzureDevOpsBuildsResponse
    {
        public AzureDevOpsBuild[] Value { get; set; } = Array.Empty<AzureDevOpsBuild>();
    }

    public enum BuildReason
    {
        None = 0,
        Manual = 1,
        IndividualCI = 2,
        BatchedCI = 4,
        Schedule = 8,
        ScheduleForced = 16,
        UserCreated = 32,
        ValidateShelveset = 64,
        CheckInShelveset = 128,
        PullRequest = 256,
        BuildCompletion = 512,
        ResourceTrigger = 1024,
        Triggered = 2048,
        All = 4095
    }

    public class AzureDevOpsBuild
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }
        
        [JsonPropertyName("buildNumber")]
        public string BuildNumber { get; set; } = string.Empty;
        
        [JsonPropertyName("status")]
        public string Status { get; set; } = string.Empty;
        
        [JsonPropertyName("result")]
        public string? Result { get; set; }
        
        [JsonPropertyName("startTime")]
        public DateTime? StartTime { get; set; }
        
        [JsonPropertyName("finishTime")]
        public DateTime? FinishTime { get; set; }
        
        [JsonPropertyName("url")]
        public string Url { get; set; } = string.Empty;
        
        [JsonPropertyName("sourceBranch")]
        public string SourceBranch { get; set; } = string.Empty;
        
        [JsonPropertyName("sourceVersion")]
        public string SourceVersion { get; set; } = string.Empty;
        
        [JsonPropertyName("reason")]
        [JsonConverter(typeof(JsonStringEnumConverter))]
        public BuildReason Reason { get; set; }
        
        [JsonPropertyName("tags")]
        public string[] Tags { get; set; } = Array.Empty<string>();
        
        public string GetReasonDisplayName()
        {
            return Reason switch
            {
                BuildReason.None => "None",
                BuildReason.Manual => "Manual",
                BuildReason.IndividualCI => "Individual CI",
                BuildReason.BatchedCI => "Batched CI",
                BuildReason.Schedule => "Schedule",
                BuildReason.ScheduleForced => "Schedule Forced",
                BuildReason.UserCreated => "User Created",
                BuildReason.ValidateShelveset => "Validate Shelveset",
                BuildReason.CheckInShelveset => "Check-in Shelveset",
                BuildReason.PullRequest => "Pull Request",
                BuildReason.BuildCompletion => "Build Completion",
                BuildReason.ResourceTrigger => "Resource Trigger",
                BuildReason.Triggered => "Triggered",
                BuildReason.All => "All",
                _ => "Unknown"
            };
        }
    }
}
