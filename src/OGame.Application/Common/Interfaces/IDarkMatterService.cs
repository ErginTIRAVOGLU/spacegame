namespace OGame.Application.Common.Interfaces;

public interface IDarkMatterService
{
    int CalculateHalveDurationCost(int targetLevel, double remainingSeconds, double totalDurationSeconds);
    int CalculateInstantCompletionCost(int targetLevel, double remainingSeconds);
    Task<bool> DeductDarkMatterAsync(Guid userId, int amount, CancellationToken cancellationToken = default);
    Task AddDarkMatterAsync(Guid userId, int amount, CancellationToken cancellationToken = default);
}

