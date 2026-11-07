namespace OGame.Domain.Services;

public static class DarkMatterFormulas
{
    public const int BaseCostKm = 750;
    public const int MinHalveCostKm = 50;

    /// <summary>
    /// Calculates the Dark Matter cost to halve the remaining construction/research duration.
    /// Scaled proportionally with remaining time ratio, with a minimum floor of 50 KM.
    /// Cost = max(50, floor(750 * (1 + TargetLevel / 10) * (RemainingSeconds / TotalDurationSeconds)))
    /// </summary>
    public static int CalculateHalveDurationCost(int targetLevel, double remainingSeconds, double totalDurationSeconds)
    {
        if (remainingSeconds <= 0)
        {
            return MinHalveCostKm;
        }

        double safeTotal = totalDurationSeconds <= 0 ? remainingSeconds : totalDurationSeconds;
        double ratio = Math.Clamp(remainingSeconds / safeTotal, 0.0, 1.0);
        double levelMultiplier = 1.0 + (Math.Max(0, targetLevel) / 10.0);
        int cost = (int)Math.Floor(BaseCostKm * levelMultiplier * ratio);

        return Math.Max(MinHalveCostKm, cost);
    }

    /// <summary>
    /// Calculates the Dark Matter cost for instant completion.
    /// Cost = max(750, floor(1500 * (1 + TargetLevel / 10) * sqrt(RemainingSeconds / 3600)))
    /// </summary>
    public static int CalculateInstantCompletionCost(int targetLevel, double remainingSeconds)
    {
        if (remainingSeconds <= 0)
        {
            return BaseCostKm;
        }

        double timeFactor = Math.Sqrt(remainingSeconds / 3600.0);
        double levelMultiplier = 1.0 + (Math.Max(0, targetLevel) / 10.0);
        int cost = (int)Math.Floor(1500.0 * levelMultiplier * timeFactor);

        return Math.Max(BaseCostKm, cost);
    }
}

