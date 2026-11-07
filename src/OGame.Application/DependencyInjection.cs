using Microsoft.Extensions.DependencyInjection;
using OGame.Application.Common.Interfaces;
using OGame.Application.Interfaces;
using OGame.Application.Services;

namespace OGame.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IResourceCalculationService, ResourceService>();
        services.AddScoped<IBuildingService, BuildingService>();
        services.AddScoped<IResearchService, ResearchService>();
        services.AddScoped<IShipyardService, ShipyardService>();
        services.AddScoped<IEspionageService, EspionageService>();
        services.AddScoped<IMoonAndPhalanxService, MoonAndPhalanxService>();
        services.AddScoped<IExpeditionEngine, ExpeditionEngine>();
        services.AddScoped<IFleetMissionService, FleetMissionService>();
        services.AddScoped<IAllianceAndAcsService, AllianceAndAcsService>();
        services.AddScoped<IHighscoreService, HighscoreService>();
        services.AddScoped<IVacationModeService, VacationModeService>();
        services.AddScoped<IInboxAndCombatReportService, InboxAndCombatReportService>();
        services.AddScoped<IColonizationAndPlanetService, ColonizationAndPlanetService>();
        services.AddScoped<IMissileService, MissileService>();
        services.AddScoped<IAdminToolsService, AdminToolsService>();
        services.AddScoped<IDarkMatterService, DarkMatterService>();
        services.AddSingleton<ICombatEngine, CombatEngine>();
        return services;
    }
}
