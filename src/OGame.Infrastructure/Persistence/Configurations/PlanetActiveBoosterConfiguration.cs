using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OGame.Domain.Entities;

namespace OGame.Infrastructure.Persistence.Configurations;

public class PlanetActiveBoosterConfiguration : IEntityTypeConfiguration<PlanetActiveBooster>
{
    public void Configure(EntityTypeBuilder<PlanetActiveBooster> builder)
    {
        builder.ToTable("planet_active_boosters");

        builder.HasKey(b => b.Id);

        builder.Property(b => b.ResourceType)
            .IsRequired()
            .HasMaxLength(32);

        builder.Property(b => b.ItemKey)
            .IsRequired()
            .HasMaxLength(64);

        builder.Property(b => b.Tier)
            .IsRequired()
            .HasMaxLength(32);

        builder.Property(b => b.ExpiresAtUtc)
            .IsRequired();

        builder.Property(b => b.CreatedAtUtc)
            .IsRequired();

        builder.HasOne(b => b.Planet)
            .WithMany(p => p.ActiveBoosters)
            .HasForeignKey(b => b.PlanetId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(b => new { b.PlanetId, b.ResourceType });
    }
}

