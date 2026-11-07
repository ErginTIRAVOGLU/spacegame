using Microsoft.EntityFrameworkCore;
using OGame.Application.Common.Interfaces;
using OGame.Application.Interfaces;
using OGame.Domain.Services;

namespace OGame.Application.Services;

public class DarkMatterService(IApplicationDbContext dbContext) : IDarkMatterService
{
    public int CalculateHalveDurationCost(int targetLevel, double remainingSeconds, double totalDurationSeconds)
    {
        return DarkMatterFormulas.CalculateHalveDurationCost(targetLevel, remainingSeconds, totalDurationSeconds);
    }

    public int CalculateInstantCompletionCost(int targetLevel, double remainingSeconds)
    {
        return DarkMatterFormulas.CalculateInstantCompletionCost(targetLevel, remainingSeconds);
    }

    public async Task<bool> DeductDarkMatterAsync(Guid userId, int amount, CancellationToken cancellationToken = default)
    {
        if (amount <= 0) return true;

        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        if (user is null || user.DarkMatter < amount)
        {
            return false;
        }

        user.DarkMatter -= amount;
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task AddDarkMatterAsync(Guid userId, int amount, CancellationToken cancellationToken = default)
    {
        if (amount <= 0) return;

        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        if (user != null)
        {
            user.DarkMatter += amount;
            await dbContext.SaveChangesAsync(cancellationToken);
        }
    }
}
