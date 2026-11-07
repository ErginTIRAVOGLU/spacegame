namespace OGame.Application.Common.Interfaces;

public record VacationModeStateResult(
    Guid UserId,
    bool IsVacationMode,
    DateTime? VacationUntilUtc,
    bool CanDisableNow);

public interface IVacationModeService
{
    Task<VacationModeStateResult> EnableVacationModeAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<VacationModeStateResult> DisableVacationModeAsync(Guid userId, CancellationToken cancellationToken = default);
}

