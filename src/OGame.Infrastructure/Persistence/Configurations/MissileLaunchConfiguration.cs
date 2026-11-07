using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OGame.Domain.Entities;

namespace OGame.Infrastructure.Persistence.Configurations;

public class MissileLaunchConfiguration : IEntityTypeConfiguration<MissileLaunch>
{
    public void Configure(EntityTypeBuilder<MissileLaunch> builder)
    {
        builder.ToTable("missile_launches");

        builder.HasKey(m => m.Id);

        builder.Property(m => m.HangfireJobId)
            .HasMaxLength(128);

        builder.HasIndex(m => m.TargetPlanetId);
        builder.HasIndex(m => new { m.IsResolved, m.ImpactTimeUtc });
    }
}

