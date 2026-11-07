using Microsoft.EntityFrameworkCore;
using OGame.Application.Interfaces;
using OGame.Domain.Entities;

namespace OGame.Infrastructure.Persistence;

public class OGameDbContext(DbContextOptions<OGameDbContext> options) : DbContext(options), IApplicationDbContext
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Planet> Planets => Set<Planet>();
    public DbSet<Building> Buildings => Set<Building>();
    public DbSet<BuildingQueueItem> BuildingQueueItems => Set<BuildingQueueItem>();
    public DbSet<ResearchQueueItem> ResearchQueueItems => Set<ResearchQueueItem>();
    public DbSet<UserResearch> UserResearches => Set<UserResearch>();
    public DbSet<ShipyardQueueItem> ShipyardQueueItems => Set<ShipyardQueueItem>();
    public DbSet<PlanetUnit> PlanetUnits => Set<PlanetUnit>();
    public DbSet<FleetMission> FleetMissions => Set<FleetMission>();
    public DbSet<FleetMissionShip> FleetMissionShips => Set<FleetMissionShip>();
    public DbSet<DebrisField> DebrisFields => Set<DebrisField>();
    public DbSet<EspionageReport> EspionageReports => Set<EspionageReport>();
    public DbSet<PlayerActivityLog> PlayerActivityLogs => Set<PlayerActivityLog>();
    public DbSet<Alliance> Alliances => Set<Alliance>();
    public DbSet<AllianceMember> AllianceMembers => Set<AllianceMember>();
    public DbSet<AcsAttackGroup> AcsAttackGroups => Set<AcsAttackGroup>();
    public DbSet<AcsGroupInvitation> AcsGroupInvitations => Set<AcsGroupInvitation>();
    public DbSet<ExpeditionReport> ExpeditionReports => Set<ExpeditionReport>();
    public DbSet<HighscoreSnapshot> HighscoreSnapshots => Set<HighscoreSnapshot>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<CombatReport> CombatReports => Set<CombatReport>();
    public DbSet<MissileLaunch> MissileLaunches => Set<MissileLaunch>();
    public DbSet<AdminLog> AdminLogs => Set<AdminLog>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<UniverseSettingsRecord> UniverseSettingsRecords => Set<UniverseSettingsRecord>();
    public DbSet<UserOfficer> UserOfficers => Set<UserOfficer>();
    public DbSet<UserInventoryItem> UserInventoryItems => Set<UserInventoryItem>();
    public DbSet<PlanetActiveBooster> PlanetActiveBoosters => Set<PlanetActiveBooster>();
    public DbSet<UserActiveBuff> UserActiveBuffs => Set<UserActiveBuff>();
    public DbSet<UserTutorialProgress> UserTutorialProgresses => Set<UserTutorialProgress>();
    public DbSet<PlanetLifeformProgress> PlanetLifeforms => Set<PlanetLifeformProgress>();
    public DbSet<UserLifeformDiscovery> UserLifeformDiscoveries => Set<UserLifeformDiscovery>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(OGameDbContext).Assembly);
    }
}
