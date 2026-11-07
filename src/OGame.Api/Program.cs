using System.Net.Sockets;
using Hangfire;
using Microsoft.EntityFrameworkCore;
using OGame.Api.Endpoints;
using OGame.Api.Hubs;
using OGame.Application;
using OGame.Domain.Enums;
using OGame.Domain.Services;
using OGame.Infrastructure;
using OGame.Infrastructure.Jobs;
using OGame.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

if (string.IsNullOrWhiteSpace(builder.Configuration["ASPNETCORE_URLS"]) &&
    string.IsNullOrWhiteSpace(builder.Configuration["urls"]))
{
    builder.WebHost.UseUrls("http://localhost:5000");
}

builder.Services.AddOpenApi();
builder.Services.AddSignalR();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://127.0.0.1:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddAuthentication();
builder.Services.AddAuthorizationBuilder()
    .AddPolicy(AdminToolsFormulas.RequireAdminPolicyName, policy =>
        policy.RequireRole(nameof(UserRole.Admin), nameof(UserRole.GameMaster)));

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

bool isPostgresOnline = CheckPostgresPortReachable("localhost", 5432);

if (isPostgresOnline)
{
    // Configure Hangfire Server with exact-second schedule polling when PostgreSQL storage is online
    builder.Services.AddHangfireServer(options =>
    {
        options.SchedulePollingInterval = TimeSpan.FromSeconds(1);
        options.Queues = ["default"];
    });
}

var app = builder.Build();

app.UseCors("AllowFrontend");

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    if (isPostgresOnline)
    {
        app.UseHangfireDashboard("/hangfire");
    }
}

// Automatically apply pending EF Core migrations and register recurring Hangfire jobs on startup
if (isPostgresOnline)
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<OGameDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        if (dbContext.Database.IsRelational())
        {
            await dbContext.Database.MigrateAsync();
        }

        var recurringJobManager = scope.ServiceProvider.GetRequiredService<IRecurringJobManager>();
        recurringJobManager.AddOrUpdate<HighscoreRecurringJob>(
            HighscoreRecurringJob.JobId,
            job => job.ExecuteAsync(CancellationToken.None),
            HighscoreRecurringJob.CronExpression);

        recurringJobManager.AddOrUpdate<InboxPurgeRecurringJob>(
            InboxPurgeRecurringJob.JobId,
            job => job.ExecuteAsync(CancellationToken.None),
            InboxPurgeRecurringJob.CronExpression);
    }
    catch (Exception ex)
    {
        logger.LogWarning(ex, "Database migration or recurring job registration skipped during startup.");
    }
}

app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/health", () => Results.Ok(new
{
    Status = "Healthy",
    PostgresOnline = isPostgresOnline,
    TimestampUtc = DateTime.UtcNow
}))
.WithName("HealthCheck");

app.MapHub<GameHub>("/hubs/game");
app.MapHub<FleetMovementHub>("/hubs/fleet");
app.MapHub<FleetMovementHub>("/hubs/fleet-movement");

app.MapPlanetEndpoints();
app.MapCombatEndpoints();
app.MapGalaxyAndFleetEndpoints();
app.MapEspionageEndpoints();
app.MapMoonEndpoints();
app.MapAllianceAndAcsEndpoints();
app.MapExpeditionEndpoints();
app.MapHighscoreAndVacationEndpoints();
app.MapInboxAndCombatReportEndpoints();
app.MapMissileAndUniverseEndpoints();
app.MapAdminEndpoints();
app.MapMerchantEndpoints();
app.MapEmpireEndpoints();
app.MapOfficerEndpoints();
app.MapShopEndpoints();
app.MapTutorialEndpoints();
app.MapMessagingAndChatEndpoints();
app.MapCharacterClassEndpoints();
app.MapLifeformDiscoveryEndpoints();
app.MapSpaceDockEndpoints();

app.Run();

static bool CheckPostgresPortReachable(string host, int port)
{
    try
    {
        using var client = new TcpClient();
        var connectTask = client.ConnectAsync(host, port);
        return connectTask.Wait(TimeSpan.FromMilliseconds(750)) && client.Connected;
    }
    catch
    {
        return false;
    }
}

public partial class Program;
