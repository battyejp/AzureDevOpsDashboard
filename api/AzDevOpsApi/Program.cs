using AzDevOpsApi.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddScoped<IAzureDevOpsService, AzureDevOpsService>();
        builder.Services.AddHttpClient();

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", 
        builder => 
        {
            builder
                .WithOrigins(
                    "http://localhost:3000", // React development server
                    "http://localhost:3001", // React production build server
                    "http://localhost:5173"  // Vite development server (if you use Vite)
                )
                .AllowAnyMethod()
                .AllowAnyHeader();
        });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// HTTPS redirection removed

app.UseCors("AllowFrontend");

app.UseAuthorization();

app.MapControllers();

app.Run();
