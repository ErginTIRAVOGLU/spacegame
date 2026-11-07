namespace OGame.Domain.Services;

public static class EspionageFormulas
{
    public const string UnknownFleetScannedAlertMessage = "An unknown fleet was scanned near your planet";

    /// <summary>
    /// DeltaLevel = (AttackerEspionageLevel - DefenderEspionageLevel)
    /// EffectiveProbes = ProbeCount * (DeltaLevel > 0 ? 2^DeltaLevel : 0.5^|DeltaLevel|)
    /// </summary>
    public static double CalculateEffectiveProbes(
        int probeCount,
        int attackerEspionageLevel,
        int defenderEspionageLevel)
    {
        if (probeCount <= 0)
        {
            return 0.0;
        }

        int deltaLevel = attackerEspionageLevel - defenderEspionageLevel;
        double multiplier = deltaLevel > 0
            ? Math.Pow(2.0, deltaLevel)
            : Math.Pow(0.5, Math.Abs(deltaLevel));

        return probeCount * multiplier;
    }

    /// <summary>
    /// Visibility Tiers (cumulative):
    /// 1. EffectiveProbes >= 1: Resources (Metal, Crystal, Deuterium, Energy)
    /// 2. EffectiveProbes >= 2: Stationed Fleets
    /// 3. EffectiveProbes >= 3: Planetary Defenses
    /// 4. EffectiveProbes >= 5: Planetary Buildings
    /// 5. EffectiveProbes >= 7: Researched Technologies
    /// </summary>
    public static int GetVisibilityTierLevel(double effectiveProbes)
    {
        if (effectiveProbes >= 7.0) return 5;
        if (effectiveProbes >= 5.0) return 4;
        if (effectiveProbes >= 3.0) return 3;
        if (effectiveProbes >= 2.0) return 2;
        if (effectiveProbes >= 1.0) return 1;
        return 0;
    }

    /// <summary>
    /// Counter-Espionage Detection Chance (0% - 100%):
    /// DetectionChance = min(100, ((ShipsOnTarget * EffectiveProbes) / 4) * (1 / 2^DeltaLevel))
    /// </summary>
    public static double CalculateCounterEspionageChancePercent(
        int shipsOnTarget,
        double effectiveProbes,
        int attackerEspionageLevel,
        int defenderEspionageLevel)
    {
        if (shipsOnTarget <= 0 || effectiveProbes <= 0.0)
        {
            return 0.0;
        }

        int deltaLevel = attackerEspionageLevel - defenderEspionageLevel;
        double rawChance = ((shipsOnTarget * effectiveProbes) / 4.0) * (1.0 / Math.Pow(2.0, deltaLevel));
        return Math.Clamp(rawChance, 0.0, 100.0);
    }
}

