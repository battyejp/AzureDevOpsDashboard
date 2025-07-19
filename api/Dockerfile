# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj files and restore dependencies
COPY ["AzDevOpsApi/AzDevOpsApi.csproj", "AzDevOpsApi/"]
RUN dotnet restore "AzDevOpsApi/AzDevOpsApi.csproj"

# Copy the rest of the files and build
COPY . .
RUN dotnet build "AzDevOpsApi/AzDevOpsApi.csproj" -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish "AzDevOpsApi/AzDevOpsApi.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Final stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
EXPOSE 80

# Set environment variables to disable HTTPS
ENV ASPNETCORE_URLS=http://+:80
ENV ASPNETCORE_ENVIRONMENT=Development

# Copy published files from publish stage
COPY --from=publish /app/publish .

# Set the entry point
ENTRYPOINT ["dotnet", "AzDevOpsApi.dll"]
