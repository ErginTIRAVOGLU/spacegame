using System.Collections.Concurrent;
using OGame.Domain.Enums;
using OGame.Domain.Services;

namespace OGame.Application.Services;

public class WreckFieldRecord
{
    public Guid PlanetId { get; set; }
    public Dictionary<UnitType, int> DestroyedShips { get; set; } = new();
    public DateTime CreatedAtUtc { get; set; }
    public DateTime ExpiresAtUtc { get; set; }

    // Active repair job (null when idle)
    public Dictionary<UnitType, int>? RepairingShips { get; set; }
    public DateTime? RepairStartedUtc { get; set; }
    public DateTime? RepairEndsUtc { get; set; }
    public bool IsRepaired { get; set; }
}

/// <summary>
/// In-memory registry of planet wreck fields (72h lifetime, one per planet). Resolved lazily on read.
/// </summary>
public static class WreckFieldStore
{
    private static readonly ConcurrentDictionary<Guid, WreckFieldRecord> Fields = new();

    public static WreckFieldRecord? Get(Guid planetId, DateTime nowUtc)
    {
        if (!Fields.TryGetValue(planetId, out var record)) return null;

        bool repairRunning = record.RepairEndsUtc.HasValue && record.RepairEndsUtc.Value > nowUtc;
        if (SpaceDockFormulas.IsWreckFieldExpired(record.ExpiresAtUtc, nowUtc) && !repairRunning && record.RepairingShips is null)
        {
            Fields.TryRemove(planetId, out _);
            return null;
        }

        return record;
    }

    /// <summary>Creates (or merges into) the wreck field for a planet after a defense battle.</summary>
    public static WreckFieldRecord CreateOrMerge(Guid planetId, IReadOnlyDictionary<UnitType, int> destroyedShips, DateTime nowUtc)
    {
        var record = Fields.AddOrUpdate(
            planetId,
            _ => new WreckFieldRecord
            {
                PlanetId = planetId,
                DestroyedShips = new Dictionary<UnitType, int>(destroyedShips),
                CreatedAtUtc = nowUtc,
                ExpiresAtUtc = SpaceDockFormulas.CalculateWreckFieldExpiryUtc(nowUtc)
            },
            (_, existing) =>
            {
                if (SpaceDockFormulas.IsWreckFieldExpired(existing.ExpiresAtUtc, nowUtc) || existing.IsRepaired)
                {
                    return new WreckFieldRecord
                    {
                        PlanetId = planetId,
                        DestroyedShips = new Dictionary<UnitType, int>(destroyedShips),
                        CreatedAtUtc = nowUtc,
                        ExpiresAtUtc = SpaceDockFormulas.CalculateWreckFieldExpiryUtc(nowUtc)
                    };
                }

                foreach (var (type, count) in destroyedShips)
                {
                    existing.DestroyedShips[type] = (existing.DestroyedShips.TryGetValue(type, out int c) ? c : 0) + count;
                }

                existing.ExpiresAtUtc = SpaceDockFormulas.CalculateWreckFieldExpiryUtc(nowUtc);
                return existing;
            });

        return record;
    }

    public static void Remove(Guid planetId) => Fields.TryRemove(planetId, out _);
}

