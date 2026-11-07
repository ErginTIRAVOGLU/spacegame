using System.Collections.Concurrent;
using Microsoft.Extensions.Logging;
using OGame.Application.Common.Interfaces;
using OGame.Domain.Common;
using StackExchange.Redis;

namespace OGame.Infrastructure.Locking;

public class RedisDistributedLockService(
    IConnectionMultiplexer? redisConnection,
    ILogger<RedisDistributedLockService> logger) : IDistributedLockService
{
    private sealed class LockFlowState
    {
        public HashSet<string> HeldKeys { get; } = new(StringComparer.Ordinal);
    }

    private static readonly ConcurrentDictionary<string, SemaphoreSlim> InMemoryFallbackLocks = new();
    private static readonly AsyncLocal<LockFlowState?> CurrentFlowState = new();
    private static readonly TimeSpan DefaultExpiry = TimeSpan.FromSeconds(30);
    private static readonly TimeSpan AcquireWaitTimeout = TimeSpan.FromSeconds(2);
    private static readonly TimeSpan AcquireRetryDelay = TimeSpan.FromMilliseconds(25);

    public Task<IAsyncDisposable> AcquireLockAsync(
        string lockKey,
        TimeSpan? expiry = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(lockKey);

        // Must initialize AsyncLocal in the synchronous wrapper so the ExecutionContext
        // flows to the caller and all subsequent child async calls in the same request.
        var flowState = CurrentFlowState.Value;
        if (flowState is null)
        {
            flowState = new LockFlowState();
            CurrentFlowState.Value = flowState;
        }

        lock (flowState.HeldKeys)
        {
            if (flowState.HeldKeys.Contains(lockKey))
            {
                return Task.FromResult<IAsyncDisposable>(NoOpLockHandle.Instance);
            }
        }

        return AcquireLockCoreAsync(flowState, lockKey, expiry, cancellationToken);
    }

    private async Task<IAsyncDisposable> AcquireLockCoreAsync(
        LockFlowState flowState,
        string lockKey,
        TimeSpan? expiry,
        CancellationToken cancellationToken)
    {
        var lockDuration = expiry ?? DefaultExpiry;

        if (redisConnection is { IsConnected: true })
        {
            var db = redisConnection.GetDatabase();
            var token = Guid.NewGuid().ToString("N");
            var deadline = DateTime.UtcNow + AcquireWaitTimeout;

            bool acquired = await db.LockTakeAsync(lockKey, token, lockDuration);
            while (!acquired && DateTime.UtcNow < deadline && !cancellationToken.IsCancellationRequested)
            {
                await Task.Delay(AcquireRetryDelay, cancellationToken);
                acquired = await db.LockTakeAsync(lockKey, token, lockDuration);
            }

            if (!acquired)
            {
                throw new ConcurrencyLockException(lockKey);
            }

            lock (flowState.HeldKeys)
            {
                flowState.HeldKeys.Add(lockKey);
            }

            return new RedisLockHandle(db, flowState, lockKey, token, logger);
        }

        // Fallback to in-process semaphore if Redis is disconnected in local/test mode
        var semaphore = InMemoryFallbackLocks.GetOrAdd(lockKey, _ => new SemaphoreSlim(1, 1));
        if (!await semaphore.WaitAsync(AcquireWaitTimeout, cancellationToken))
        {
            throw new ConcurrencyLockException(lockKey);
        }

        lock (flowState.HeldKeys)
        {
            flowState.HeldKeys.Add(lockKey);
        }

        return new InMemoryLockHandle(semaphore, flowState, lockKey);
    }

    private static void RemoveHeldKey(LockFlowState flowState, string lockKey)
    {
        lock (flowState.HeldKeys)
        {
            flowState.HeldKeys.Remove(lockKey);
        }
    }

    private sealed class NoOpLockHandle : IAsyncDisposable
    {
        public static readonly NoOpLockHandle Instance = new();

        public ValueTask DisposeAsync() => ValueTask.CompletedTask;
    }

    private sealed class RedisLockHandle(
        IDatabase database,
        LockFlowState flowState,
        string lockKey,
        string lockToken,
        ILogger logger) : IAsyncDisposable
    {
        private int _disposed;

        public async ValueTask DisposeAsync()
        {
            if (Interlocked.Exchange(ref _disposed, 1) == 1)
            {
                return;
            }

            RemoveHeldKey(flowState, lockKey);

            try
            {
                await database.LockReleaseAsync(lockKey, lockToken);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to release Redis lock {LockKey}.", lockKey);
            }
        }
    }

    private sealed class InMemoryLockHandle(
        SemaphoreSlim semaphore,
        LockFlowState flowState,
        string lockKey) : IAsyncDisposable
    {
        private int _disposed;

        public ValueTask DisposeAsync()
        {
            if (Interlocked.Exchange(ref _disposed, 1) == 0)
            {
                RemoveHeldKey(flowState, lockKey);
                semaphore.Release();
            }

            return ValueTask.CompletedTask;
        }
    }
}
