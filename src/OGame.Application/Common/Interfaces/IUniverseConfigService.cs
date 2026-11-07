using OGame.Domain.Services;

namespace OGame.Application.Common.Interfaces;

public interface IUniverseConfigService
{
    UniverseConfig GetCachedConfig();
    Task<UniverseConfig> GetConfigAsync(CancellationToken cancellationToken = default);
    Task<UniverseConfig> UpdateConfigAsync(UniverseConfig config, CancellationToken cancellationToken = default);
}

