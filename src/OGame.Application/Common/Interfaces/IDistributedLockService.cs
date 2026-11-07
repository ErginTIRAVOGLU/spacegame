namespace OGame.Application.Common.Interfaces;

public interface IDistributedLockService
{
    Task<IAsyncDisposable> AcquireLockAsync(
        string lockKey,
        TimeSpan? expiry = null,
        CancellationToken cancellationToken = default);
}

