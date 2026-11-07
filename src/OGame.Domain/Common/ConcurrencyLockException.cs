namespace OGame.Domain.Common;

public class ConcurrencyLockException : Exception
{
    public string LockKey { get; }

    public ConcurrencyLockException(string lockKey)
        : base($"Failed to acquire distributed lock for key '{lockKey}'.")
    {
        LockKey = lockKey;
    }

    public ConcurrencyLockException(string lockKey, string message)
        : base(message)
    {
        LockKey = lockKey;
    }
}

