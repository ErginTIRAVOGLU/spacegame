using System.Collections.Concurrent;
using OGame.Domain.Services;

namespace OGame.Application.Services;

public class SystemDepletionRecord
{
    public int Galaxy { get; set; }
    public int System { get; set; }
    public int Count { get; set; }
    public DateTime LastUpdatedUtc { get; set; }
}

public static class SystemDepletionStore
{
    private static readonly ConcurrentDictionary<(int Galaxy, int System), SystemDepletionRecord> DepletionRegistry = new();

    /// <summary>
    /// Records an expedition arrival to [Galaxy:System:16], incrementing the depletion counter after applying past decay.
    /// </summary>
    public static (int EffectiveCount, ExpeditionDepletionLevel Level, string Message) RecordExpedition(
        int galaxy,
        int system,
        DateTime nowUtc)
    {
        var record = DepletionRegistry.AddOrUpdate(
            (galaxy, system),
            _ => new SystemDepletionRecord
            {
                Galaxy = galaxy,
                System = system,
                Count = 1,
                LastUpdatedUtc = nowUtc
            },
            (_, existing) =>
            {
                int decayed = ExpeditionFormulas.CalculateDecayedDepletion(existing.Count, existing.LastUpdatedUtc, nowUtc);
                existing.Count = decayed + 1;
                existing.LastUpdatedUtc = nowUtc;
                return existing;
            });

        var (level, message) = ExpeditionFormulas.GetDepletionLevel(record.Count);
        return (record.Count, level, message);
    }

    /// <summary>
    /// Gets the current decayed depletion status and probe message for [Galaxy:System:16].
    /// </summary>
    public static (int EffectiveCount, ExpeditionDepletionLevel Level, string Message) GetDepletion(
        int galaxy,
        int system,
        DateTime nowUtc)
    {
        if (!DepletionRegistry.TryGetValue((galaxy, system), out var existing))
        {
            return (0, ExpeditionDepletionLevel.Undepleted, "Bölge henüz tükenmemiş");
        }

        int decayed = ExpeditionFormulas.CalculateDecayedDepletion(existing.Count, existing.LastUpdatedUtc, nowUtc);
        var (level, message) = ExpeditionFormulas.GetDepletionLevel(decayed);
        return (decayed, level, message);
    }

    /// <summary>
    /// Clears the registry (useful for unit testing).
    /// </summary>
    public static void Reset() => DepletionRegistry.Clear();
}

