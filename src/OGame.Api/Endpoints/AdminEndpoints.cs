using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using OGame.Application.Common.Interfaces;
using OGame.Domain.Services;

namespace OGame.Api.Endpoints;

public record ForceReturnFleetRequest(
    Guid AdminUserId,
    bool InstantTeleport = false);

public record ClearPlanetQueueRequest(Guid AdminUserId);

public record BanUserRequest(
    Guid AdminUserId,
    string Reason);

public record UpdateUniverseSpeedRequest(
    Guid AdminUserId,
    double EconomySpeedMultiplier = 1.0,
    double FleetSpeedMultiplier = 1.0,
    double ResearchSpeedMultiplier = 1.0,
    double DebrisRatio = 0.30,
    bool DefenseToDebris = false,
    double DeutConsumptionFactor = 1.0);

public static class AdminEndpoints
{
    public static IEndpointRouteBuilder MapAdminEndpoints(this IEndpointRouteBuilder app)
    {
        var adminGroup = app.MapGroup("/api/admin")
            .WithTags("Admin")
            .RequireAuthorization(AdminToolsFormulas.RequireAdminPolicyName);

        adminGroup.MapPost("/fleets/{id:guid}/force-return", async (
            Guid id,
            [FromBody] ForceReturnFleetRequest request,
            HttpContext httpContext,
            IAdminToolsService adminService,
            CancellationToken cancellationToken) =>
        {
            try
            {
                Guid adminId = ResolveAdminUserId(httpContext.User, request.AdminUserId);
                var result = await adminService.ForceReturnFleetAsync(
                    adminId,
                    id,
                    request.InstantTeleport,
                    cancellationToken);

                return Results.Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { Error = ex.Message });
            }
        })
        .WithName("AdminForceReturnFleet");

        adminGroup.MapPost("/planets/{id:guid}/clear-queue", async (
            Guid id,
            [FromBody] ClearPlanetQueueRequest request,
            HttpContext httpContext,
            IAdminToolsService adminService,
            CancellationToken cancellationToken) =>
        {
            try
            {
                Guid adminId = ResolveAdminUserId(httpContext.User, request.AdminUserId);
                var result = await adminService.ClearPlanetQueuesAsync(
                    adminId,
                    id,
                    cancellationToken);

                return Results.Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { Error = ex.Message });
            }
        })
        .WithName("AdminClearPlanetQueue");

        adminGroup.MapGet("/users/search", async (
            [FromQuery] string? q,
            IAdminToolsService adminService,
            CancellationToken cancellationToken) =>
        {
            var results = await adminService.SearchUsersAndEconomyAsync(q, cancellationToken);
            return Results.Ok(results);
        })
        .WithName("AdminSearchUsers");

        adminGroup.MapPost("/users/{id:guid}/ban", async (
            Guid id,
            [FromBody] BanUserRequest request,
            HttpContext httpContext,
            IAdminToolsService adminService,
            CancellationToken cancellationToken) =>
        {
            try
            {
                Guid adminId = ResolveAdminUserId(httpContext.User, request.AdminUserId);
                var result = await adminService.BanUserAsync(
                    adminId,
                    id,
                    request.Reason,
                    cancellationToken);

                return Results.Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { Error = ex.Message });
            }
        })
        .WithName("AdminBanUser");

        adminGroup.MapPost("/universe/speed", async (
            [FromBody] UpdateUniverseSpeedRequest request,
            HttpContext httpContext,
            IAdminToolsService adminService,
            CancellationToken cancellationToken) =>
        {
            Guid adminId = ResolveAdminUserId(httpContext.User, request.AdminUserId);
            var config = new UniverseConfig(
                EconomySpeedMultiplier: request.EconomySpeedMultiplier,
                FleetSpeedMultiplier: request.FleetSpeedMultiplier,
                ResearchSpeedMultiplier: request.ResearchSpeedMultiplier,
                DebrisRatio: request.DebrisRatio,
                DefenseToDebris: request.DefenseToDebris,
                DeutConsumptionFactor: request.DeutConsumptionFactor);

            var updated = await adminService.UpdateUniverseSpeedAsync(adminId, config, cancellationToken);
            return Results.Ok(updated);
        })
        .WithName("AdminUpdateUniverseSpeed");

        adminGroup.MapGet("/audit-logs", async (
            [FromQuery] int? topCount,
            IAdminToolsService adminService,
            CancellationToken cancellationToken) =>
        {
            var logs = await adminService.GetAuditLogsAsync(topCount ?? 100, cancellationToken);
            return Results.Ok(logs);
        })
        .WithName("AdminGetAuditLogs");

        return app;
    }

    private static Guid ResolveAdminUserId(ClaimsPrincipal principal, Guid fallbackAdminUserId)
    {
        var sub = principal.FindFirstValue(ClaimTypes.NameIdentifier) ?? principal.FindFirstValue("sub");
        if (Guid.TryParse(sub, out Guid parsed) && parsed != Guid.Empty)
        {
            return parsed;
        }

        return fallbackAdminUserId;
    }
}

