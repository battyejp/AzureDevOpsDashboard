namespace AzDevOpsApi.Models.AzureDevOps
{
    public class AzureDevOpsPipelinesResponse
    {
        public AzureDevOpsPipeline[] Value { get; set; } = Array.Empty<AzureDevOpsPipeline>();
    }

    public class AzureDevOpsPipeline
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Url { get; set; } = string.Empty;
        public string Path { get; set; } = string.Empty;
        public int Revision { get; set; }
        public string QueueStatus { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
    }
}
