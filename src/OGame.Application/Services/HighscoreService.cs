using Microsoft.EntityFrameworkCore;
using OGame.Application.Common.Interfaces;
using OGame.Application.Interfaces;
using OGame.Domain.Entities;
using OGame.Domain.Enums;
using OGame.Domain.Services;

namespace OGame.Application.Services;

public class HighscoreService(
    IApplicationDbContext dbContext,
    ILeaderboardCacheService leaderboardCacheService) : IHighscoreService
{
    public async Task CalculateUniverseHighscoresAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;

        var users = await dbContext.Users
            .Include(u => u.Researches)
            .Include(u => u.Planets)
                .ThenInclude(p => p.Buildings)
            .Include(u => u.Planets)
                .ThenInclude(p => p.Units)
            .ToListAsync(cancellationToken);

        var activeMissions = await dbContext.FleetMissions
            .AsNoTracking()
            .Include(m => m.Ships)
            .Where(m =>
                m.Status == FleetMissionStatus.Outbound ||
                m.Status == FleetMissionStatus.Holding ||
                m.Status == FleetMissionStatus.Returning)
            .ToListAsync(cancellationToken);

        var activeFleetsByUser = activeMissions
            .GroupBy(m => m.UserId)
            .ToDictionary(g => g.Key, g => g.ToList());

        var existingSnapshots = await dbContext.HighscoreSnapshots
            .ToDictionaryAsync(s => s.UserId, cancellationToken);

        var scoredPlayers = new List<(User User, PlayerPointBreakdown Breakdown, int? PreviousRank)>(users.Count);

        foreach (var user in users)
        {
            var buildings = user.Planets
                .SelectMany(p => p.Buildings)
                .Where(b => b.Level > 0)
                .Select(b => (b.BuildingType, b.Level));

            var researches = user.Researches
                .Where(r => r.Level > 0)
                .Select(r => (r.ResearchType, r.Level));

            var unitCounts = new Dictionary<UnitType, int>();

            foreach (var planet in user.Planets)
            {
                foreach (var unit in planet.Units)
                {
                    if (unit.Count <= 0) continue;
                    unitCounts[unit.UnitType] = (unitCounts.TryGetValue(unit.UnitType, out int existing) ? existing : 0) + unit.Count;
                }
            }

            if (activeFleetsByUser.TryGetValue(user.Id, out var userMissions))
            {
                foreach (var mission in userMissions)
                {
                    foreach (var ship in mission.Ships)
                    {
                        if (ship.Count <= 0) continue;
                        unitCounts[ship.UnitType] = (unitCounts.TryGetValue(ship.UnitType, out int existing) ? existing : 0) + ship.Count;
                    }
                }
            }

            var breakdown = HighscoreAndVacationFormulas.CalculatePlayerPointBreakdown(
                buildings,
                researches,
                unitCounts);

            user.TotalPoints = breakdown.TotalPoints;
            user.MilitaryPoints = breakdown.MilitaryPoints;

            int? prevRank = existingSnapshots.TryGetValue(user.Id, out var prevSnap)
                ? prevSnap.Rank
                : null;

            scoredPlayers.Add((user, breakdown, prevRank));
        }

        // Assign Military Highscore Ranks
        var militaryOrdered = scoredPlayers
            .OrderByDescending(x => x.Breakdown.MilitaryPoints)
            .ToList();
        for (int m = 0; m < militaryOrdered.Count; m++)
        {
            militaryOrdered[m].User.MilitaryRank = m + 1;
        }

        // Assign Honor Highscore Ranks
        var honorOrdered = scoredPlayers
            .OrderByDescending(x => x.User.HonorPoints)
            .ToList();
        for (int h = 0; h < honorOrdered.Count; h++)
        {
            honorOrdered[h].User.HonorRank = h + 1;
        }

        var ordered = scoredPlayers
            .OrderByDescending(x => x.Breakdown.TotalPoints)
            .ThenBy(x => x.User.CreatedAtUtc)
            .ThenBy(x => x.User.Username)
            .ToList();

        var leaderboardDtos = new List<HighscoreEntryDto>(ordered.Count);

        for (int i = 0; i < ordered.Count; i++)
        {
            int rank = i + 1;
            var (user, breakdown, prevRank) = ordered[i];
            int rankDelta = HighscoreAndVacationFormulas.CalculateRankDelta(rank, prevRank);

            if (!existingSnapshots.TryGetValue(user.Id, out var snapshot))
            {
                snapshot = new HighscoreSnapshot
                {
                    Id = Guid.NewGuid(),
                    UserId = user.Id
                };
                dbContext.HighscoreSnapshots.Add(snapshot);
            }

            snapshot.Username = user.Username;
            snapshot.AllianceTag = user.AllianceTag;
            snapshot.Points = breakdown.TotalPoints;
            snapshot.EconomyPoints = breakdown.EconomyPoints;
            snapshot.ResearchPoints = breakdown.ResearchPoints;
            snapshot.MilitaryPoints = breakdown.MilitaryPoints;
            snapshot.Rank = rank;
            snapshot.PreviousRank = prevRank;
            snapshot.RankDelta = rankDelta;
            snapshot.CalculatedAtUtc = now;

            leaderboardDtos.Add(new HighscoreEntryDto(
                UserId: user.Id,
                Username: user.Username,
                AllianceTag: user.AllianceTag,
                Points: snapshot.Points,
                EconomyPoints: snapshot.EconomyPoints,
                ResearchPoints: snapshot.ResearchPoints,
                MilitaryPoints: snapshot.MilitaryPoints,
                Rank: snapshot.Rank,
                PreviousRank: snapshot.PreviousRank,
                RankDelta: snapshot.RankDelta,
                IsVacationMode: user.IsVacationMode,
                CalculatedAtUtc: now));
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        await leaderboardCacheService.SetLeaderboardAsync(leaderboardDtos, cancellationToken);
    }

    public async Task<IReadOnlyList<HighscoreEntryDto>> GetLeaderboardAsync(
        int topCount = 100,
        CancellationToken cancellationToken = default)
    {
        int limit = Math.Clamp(topCount, 1, 500);

        var cached = await leaderboardCacheService.GetLeaderboardAsync(limit, cancellationToken);
        if (cached is { Count: > 0 })
        {
            return cached;
        }

        var snapshots = await dbContext.HighscoreSnapshots
            .AsNoTracking()
            .Include(s => s.User)
            .OrderBy(s => s.Rank)
            .Take(limit)
            .Select(s => new HighscoreEntryDto(
                s.UserId,
                s.Username,
                s.AllianceTag,
                s.Points,
                s.EconomyPoints,
                s.ResearchPoints,
                s.MilitaryPoints,
                s.Rank,
                s.PreviousRank,
                s.RankDelta,
                s.User != null && s.User.IsVacationMode,
                s.CalculatedAtUtc))
            .ToListAsync(cancellationToken);

        return snapshots;
    }
}

