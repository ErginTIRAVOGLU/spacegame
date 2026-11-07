using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OGame.Domain.Entities;

namespace OGame.Infrastructure.Persistence.Configurations;

public class EspionageReportConfiguration : IEntityTypeConfiguration<EspionageReport>
{
    public void Configure(EntityTypeBuilder<EspionageReport> builder)
    {
        builder.ToTable("espionage_reports");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.TargetPlanetId).IsRequired();
        builder.Property(r => r.ScannerUserId).IsRequired();
        builder.Property(r => r.TierLevel).IsRequired();
        builder.Property(r => r.DataJson)
            .HasColumnType("jsonb")
            .IsRequired();
        builder.Property(r => r.CreatedAtUtc).IsRequired();

        builder.HasIndex(r => new { r.ScannerUserId, r.CreatedAtUtc });
        builder.HasIndex(r => r.TargetPlanetId);

        builder.HasOne(r => r.TargetPlanet)
            .WithMany()
            .HasForeignKey(r => r.TargetPlanetId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(r => r.ScannerUser)
            .WithMany()
            .HasForeignKey(r => r.ScannerUserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class PlayerActivityLogConfiguration : IEntityTypeConfiguration<PlayerActivityLog>
{
    public void Configure(EntityTypeBuilder<PlayerActivityLog> builder)
    {
        builder.ToTable("player_activity_logs");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.UserId).IsRequired();
        builder.Property(a => a.Message).HasMaxLength(512).IsRequired();
        builder.Property(a => a.CreatedAtUtc).IsRequired();

        builder.HasIndex(a => new { a.UserId, a.CreatedAtUtc });
    }
}

