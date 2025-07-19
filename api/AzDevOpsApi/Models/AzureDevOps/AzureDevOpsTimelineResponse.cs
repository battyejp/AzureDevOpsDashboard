namespace AzDevOpsApi.Models.AzureDevOps
{
    public class AzureDevOpsTimelineResponse
    {
        public string Id { get; set; } = string.Empty;
        public AzureDevOpsTimelineRecord[] Records { get; set; } = Array.Empty<AzureDevOpsTimelineRecord>();
    }

    public class AzureDevOpsTimelineRecord
    {
        public string Id { get; set; } = string.Empty;
        public string? ParentId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string? Result { get; set; }
        public DateTime? StartTime { get; set; }
        public DateTime? FinishTime { get; set; }
        public int? PercentComplete { get; set; }
        public AzureDevOpsLogReference? Log { get; set; }
    }

    public class AzureDevOpsLogReference
    {
        public string Url { get; set; } = string.Empty;
    }
}
