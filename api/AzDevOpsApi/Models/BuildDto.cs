namespace AzDevOpsApi.Models
{
    public class BuildDto
    {
        public int Id { get; set; }
        public string BuildNumber { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? Result { get; set; }
        public DateTime? StartTime { get; set; }
        public DateTime? FinishTime { get; set; }
        public string Url { get; set; } = string.Empty;
        public string SourceBranch { get; set; } = string.Empty;
        public string SourceVersion { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;
        public string[] Tags { get; set; } = Array.Empty<string>();
    }
}
