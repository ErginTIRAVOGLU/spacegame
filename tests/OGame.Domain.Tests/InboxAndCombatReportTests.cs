using OGame.Application.Services;
using OGame.Domain.Combat;
using OGame.Domain.Enums;
using OGame.Domain.Services;

namespace OGame.Domain.Tests;

public class InboxAndCombatReportTests
{
    [Fact]
    public void IsMessageEligibleForAutoPurge_ShouldOnlyPurgeReadMessagesOlderThanSevenDays()
    {
        var now = new DateTime(2026, 10, 28, 12, 0, 0, DateTimeKind.Utc);

        // Read message 8 days old -> eligible for purge
        Assert.True(CombatReportFormulas.IsMessageEligibleForAutoPurge(
            isRead: true,
            createdAtUtc: now.AddDays(-8),
            utcNow: now));

        // Read message 6 days old -> NOT eligible for purge
        Assert.False(CombatReportFormulas.IsMessageEligibleForAutoPurge(
            isRead: true,
            createdAtUtc: now.AddDays(-6),
            utcNow: now));

        // Unread message 30 days old -> NOT eligible for purge
        Assert.False(CombatReportFormulas.IsMessageEligibleForAutoPurge(
            isRead: false,
            createdAtUtc: now.AddDays(-30),
            utcNow: now));
    }

    [Fact]
    public void BuildCombatReportPayload_ShouldIncludeTechLevelsRoundsWreckageAndPlunder()
    {
        var engine = new CombatEngine();
        var attackerUnits = new Dictionary<UnitType, int>
        {
            [UnitType.Battleship] = 20
        };
        var defenderUnits = new Dictionary<UnitType, int>
        {
            [UnitType.LightFighter] = 15,
            [UnitType.RocketLauncher] = 20
        };

        var attackerTech = new CombatTechLevels(WeaponsLevel: 12, ShieldingLevel: 10, ArmourLevel: 11);
        var defenderTech = new CombatTechLevels(WeaponsLevel: 8, ShieldingLevel: 9, ArmourLevel: 8);

        var combatResult = engine.SimulateCombat(
            new CombatFleetInput(attackerUnits, attackerTech),
            new CombatFleetInput(defenderUnits, defenderTech),
            seed: 42);

        var reportId = Guid.NewGuid();
        var now = new DateTime(2026, 10, 28, 12, 0, 0, DateTimeKind.Utc);
        var plunder = new CombatPlunderSummary(50_000, 30_000, 10_000);

        var payload = CombatReportFormulas.BuildCombatReportPayload(
            reportId: reportId,
            occurredAtUtc: now,
            battleCoordinates: "[2:145:7]",
            attackerName: "EmperorZorg",
            attackerAllianceTag: "SITH",
            attackerCoordinates: "[2:140:4]",
            attackerTech: attackerTech,
            attackerInitialUnits: attackerUnits,
            defenderName: "CommanderRey",
            defenderAllianceTag: "JEDI",
            defenderCoordinates: "[2:145:7]",
            defenderTech: defenderTech,
            defenderInitialUnits: defenderUnits,
            combatResult: combatResult,
            plunder: plunder,
            moonCreated: false);

        Assert.Equal(reportId, payload.ReportId);
        Assert.Equal(CombatWinner.Attacker, payload.Winner);
        Assert.Equal("EmperorZorg", payload.Attacker.PlayerName);
        Assert.Equal("SITH", payload.Attacker.AllianceTag);
        Assert.Equal(12, payload.Attacker.TechLevels.WeaponsLevel);
        Assert.Equal(10, payload.Attacker.TechLevels.ShieldingLevel);
        Assert.Equal(11, payload.Attacker.TechLevels.ArmourLevel);
        Assert.Equal("CommanderRey", payload.Defender.PlayerName);
        Assert.NotEmpty(payload.Rounds);
        Assert.True(payload.Wreckage.DebrisMetal > 0);
        Assert.Equal(50_000, payload.Plunder.MetalPlundered);
        Assert.Equal(30_000, payload.Plunder.CrystalPlundered);
        Assert.Equal(10_000, payload.Plunder.DeuteriumPlundered);
    }

    [Fact]
    public void AnonymizeCombatReport_ShouldRedactIdentitiesAndFleetNumbersWhenRequested()
    {
        var engine = new CombatEngine();
        var attackerUnits = new Dictionary<UnitType, int> { [UnitType.Cruiser] = 10 };
        var defenderUnits = new Dictionary<UnitType, int> { [UnitType.LightFighter] = 5 };
        var combatResult = engine.SimulateCombat(
            new CombatFleetInput(attackerUnits),
            new CombatFleetInput(defenderUnits),
            seed: 99);

        var original = CombatReportFormulas.BuildCombatReportPayload(
            reportId: Guid.NewGuid(),
            occurredAtUtc: DateTime.UtcNow,
            battleCoordinates: "[1:55:9]",
            attackerName: "RealAttacker",
            attackerAllianceTag: "ATK",
            attackerCoordinates: "[1:50:4]",
            attackerTech: new CombatTechLevels(10, 10, 10),
            attackerInitialUnits: attackerUnits,
            defenderName: "RealDefender",
            defenderAllianceTag: "DEF",
            defenderCoordinates: "[1:55:9]",
            defenderTech: new CombatTechLevels(8, 8, 8),
            defenderInitialUnits: defenderUnits,
            combatResult: combatResult,
            plunder: new CombatPlunderSummary(1000, 1000, 500));

        var anonymized = CombatReportFormulas.AnonymizeCombatReport(
            original,
            hidePlayerIdentities: true,
            hideExactFleetNumbers: true);

        Assert.True(anonymized.IsAnonymizedIdentities);
        Assert.True(anonymized.IsAnonymizedFleetNumbers);
        Assert.Equal("[X:XXX:XX]", anonymized.BattleCoordinates);
        Assert.Equal("Commander Alpha [REDACTED]", anonymized.Attacker.PlayerName);
        Assert.Null(anonymized.Attacker.AllianceTag);
        Assert.Equal("Commander Omega [REDACTED]", anonymized.Defender.PlayerName);
        Assert.Null(anonymized.Defender.AllianceTag);
        Assert.True(anonymized.Attacker.FleetNumbersHidden);
        Assert.Null(anonymized.Attacker.InitialUnits);
        Assert.Null(anonymized.Defender.InitialUnits);
        Assert.All(anonymized.Rounds, r =>
        {
            Assert.Null(r.AttackerUnitsRemaining);
            Assert.Null(r.DefenderUnitsRemaining);
            Assert.True(r.AttackerDamageDealt >= 0);
        });
    }
}

