using Microsoft.EntityFrameworkCore;
using OGame.Domain.Entities;

namespace OGame.Application.Interfaces;

public interface IApplicationDbContext
{
    DbSet<User> Users { get; }
    DbSet<Planet> Planets { get; }
    DbSet<Building> Buildings { get; }
    DbSet<BuildingQueueItem> BuildingQueueItems { get; }
    DbSet<ResearchQueueItem> ResearchQueueItems { get; }
    DbSet<UserResearch> UserResearches { get; }
    DbSet<ShipyardQueueItem> ShipyardQueueItems { get; }
    DbSet<PlanetUnit> PlanetUnits { get; }
    DbSet<FleetMission> FleetMissions { get; }
    DbSet<FleetMissionShip> FleetMissionShips { get; }
    DbSet<DebrisField> DebrisFields { get; }
    DbSet<EspionageReport> EspionageReports { get; }
    DbSet<PlayerActivityLog> PlayerActivityLogs { get; }
    DbSet<Alliance> Alliances { get; }
    DbSet<AllianceMember> AllianceMembers { get; }
    DbSet<AcsAttackGroup> AcsAttackGroups { get; }
    DbSet<AcsGroupInvitation> AcsGroupInvitations { get; }
    DbSet<ExpeditionReport> ExpeditionReports { get; }
    DbSet<HighscoreSnapshot> HighscoreSnapshots { get; }
    DbSet<Message> Messages { get; }
    DbSet<CombatReport> CombatReports { get; }
    DbSet<MissileLaunch> MissileLaunches { get; }
    DbSet<AdminLog> AdminLogs { get; }
    DbSet<RefreshToken> RefreshTokens { get; }
    DbSet<UniverseSettingsRecord> UniverseSettingsRecords { get; }
    DbSet<UserOfficer> UserOfficers { get; }
    DbSet<UserInventoryItem> UserInventoryItems { get; }
    DbSet<PlanetActiveBooster> PlanetActiveBoosters { get; }
    DbSet<UserActiveBuff> UserActiveBuffs { get; }
    DbSet<UserTutorialProgress> UserTutorialProgresses { get; }
    DbSet<PlanetLifeformProgress> PlanetLifeforms { get; }
    DbSet<UserLifeformDiscovery> UserLifeformDiscoveries { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
