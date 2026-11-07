using OGame.Domain.Enums;

namespace OGame.Domain.Services;

public record AcsTimeSyncResult(
    bool IsAllowed,
    DateTime SynchronizedArrivalUtc,
    double SlowdownRatio,
    string? RejectionReason);

public static class AcsFormulas
{
    public const int MaxInvitedBuddies = 4;
    public const int MaxTotalParticipants = 5;
    public const double MaxAllowedSlowdownRatio = 0.30; // 30% of remaining flight time
    public const int MinHoldHours = 1;
    public const int MaxHoldHours = 32;

    /// <summary>
    /// Time Synchronization Rule:
    /// - When a slower fleet joins, the arrival time of ALL joined fleets is dynamically extended
    ///   to match the arrival time of the slowest ship.
    /// - A joining fleet cannot slow down the group by more than 30% of remaining flight time.
    /// </summary>
    public static AcsTimeSyncResult EvaluateJoinTimeSync(
        DateTime currentGroupArrivalUtc,
        DateTime joiningFleetArrivalUtc,
        DateTime utcNow)
    {
        double remainingGroupSeconds = Math.Max(0.0, (currentGroupArrivalUtc - utcNow).TotalSeconds);
        if (remainingGroupSeconds <= 0.0)
        {
            return new AcsTimeSyncResult(
                IsAllowed: false,
                SynchronizedArrivalUtc: currentGroupArrivalUtc,
                SlowdownRatio: 0.0,
                RejectionReason: "The ACS attack group has already arrived at its target.");
        }

        // If joining fleet arrives on or before current group arrival time, it matches group arrival with 0% slowdown
        if (joiningFleetArrivalUtc <= currentGroupArrivalUtc)
        {
            return new AcsTimeSyncResult(
                IsAllowed: true,
                SynchronizedArrivalUtc: currentGroupArrivalUtc,
                SlowdownRatio: 0.0,
                RejectionReason: null);
        }

        double addedDelaySeconds = (joiningFleetArrivalUtc - currentGroupArrivalUtc).TotalSeconds;
        double slowdownRatio = addedDelaySeconds / remainingGroupSeconds;

        if (slowdownRatio > MaxAllowedSlowdownRatio + 1e-9)
        {
            return new AcsTimeSyncResult(
                IsAllowed: false,
                SynchronizedArrivalUtc: currentGroupArrivalUtc,
                SlowdownRatio: slowdownRatio,
                RejectionReason: $"Joining fleet would slow down the ACS group by {(slowdownRatio * 100.0):F1}%, exceeding the 30% limit.");
        }

        return new AcsTimeSyncResult(
            IsAllowed: true,
            SynchronizedArrivalUtc: joiningFleetArrivalUtc,
            SlowdownRatio: slowdownRatio,
            RejectionReason: null);
    }

    /// <summary>
    /// ACS Defend Holding Deuterium Consumption:
    /// HoldDeuterium = HoldHours * FuelPerHour
    /// (where FuelPerHour for each ship type = 10% of its base fuel usage per hour, minimum 1 per ship type).
    /// </summary>
    public static double CalculateHoldingDeuteriumConsumption(
        IReadOnlyDictionary<UnitType, int> ships,
        int holdHours)
    {
        if (holdHours <= 0 || ships is null || ships.Count == 0)
        {
            return 0.0;
        }

        int clampedHoldHours = Math.Clamp(holdHours, MinHoldHours, MaxHoldHours);
        double fuelPerHour = 0.0;

        foreach (var (unitType, count) in ships)
        {
            if (count <= 0) continue;
            var stats = FleetNavigationFormulas.GetShipFlightStats(unitType);
            fuelPerHour += Math.Max(1.0, Math.Round(stats.FuelUsage * 0.10)) * count;
        }

        return clampedHoldHours * fuelPerHour;
    }

    /// <summary>
    /// Distributes surviving units across participating fleets proportionally to their initial ship count of each UnitType.
    /// </summary>
    public static IReadOnlyList<Dictionary<UnitType, int>> DistributeSurvivingUnitsProportionally(
        IReadOnlyList<IReadOnlyDictionary<UnitType, int>> participantInitialFleets,
        IReadOnlyDictionary<UnitType, int> unifiedSurvivingUnits)
    {
        var results = participantInitialFleets
            .Select(_ => new Dictionary<UnitType, int>())
            .ToList();

        var allUnitTypes = participantInitialFleets
            .SelectMany(f => f.Keys)
            .Distinct()
            .ToList();

        foreach (var unitType in allUnitTypes)
        {
            int totalInitial = participantInitialFleets.Sum(f => f.TryGetValue(unitType, out int c) ? Math.Max(0, c) : 0);
            int totalSurviving = unifiedSurvivingUnits.TryGetValue(unitType, out int s) ? Math.Max(0, s) : 0;

            if (totalInitial <= 0 || totalSurviving <= 0)
            {
                for (int i = 0; i < results.Count; i++)
                {
                    if (participantInitialFleets[i].ContainsKey(unitType))
                    {
                        results[i][unitType] = 0;
                    }
                }
                continue;
            }

            int allocated = 0;
            var remainders = new List<(int Index, double Remainder)>();

            for (int i = 0; i < participantInitialFleets.Count; i++)
            {
                int participantCount = participantInitialFleets[i].TryGetValue(unitType, out int c) ? Math.Max(0, c) : 0;
                if (participantCount <= 0)
                {
                    continue;
                }

                double exactShare = ((double)participantCount / totalInitial) * totalSurviving;
                int floorShare = (int)Math.Floor(exactShare);
                results[i][unitType] = floorShare;
                allocated += floorShare;
                remainders.Add((i, exactShare - floorShare));
            }

            int leftover = totalSurviving - allocated;
            foreach (var item in remainders.OrderByDescending(r => r.Remainder).Take(leftover))
            {
                results[item.Index][unitType] += 1;
            }
        }

        return results;
    }

    public static string BuildAcsLockKey(Guid groupId) => $"acs:{groupId}";
}

