namespace OGame.Application.Common.Interfaces;

public interface IJumpGateCooldownService
{
    Task<TimeSpan?> GetRemainingCooldownAsync(Guid moonId, CancellationToken cancellationToken = default);
    Task SetCooldownAsync(Guid moonId, TimeSpan cooldownDuration, CancellationToken cancellationToken = default);
}

