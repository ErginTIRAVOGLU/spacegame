using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OGame.Domain.Entities;

namespace OGame.Infrastructure.Persistence.Configurations;

public class PlanetLifeformConfiguration : IEntityTypeConfiguration<PlanetLifeformProgress>
{
    public void Configure(EntityTypeBuilder<PlanetLifeformProgress> builder)
    {
        builder.ToTable("planet_lifeforms");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.PlanetId)
            .IsRequired();

        builder.HasIndex(p => p.PlanetId)
            .IsUnique();

        builder.Property(p => p.ActiveSpecies)
            .IsRequired()
            .HasMaxLength(64)
            .HasDefaultValue("humans");

        builder.Property(p => p.IsActive)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(p => p.SpeciesLevel)
            .IsRequired()
            .HasDefaultValue(1);

        builder.Property(p => p.CurrentXp)
            .IsRequired()
            .HasDefaultValue(150);

        builder.Property(p => p.MaxXp)
            .IsRequired()
            .HasDefaultValue(1000);

        builder.Property(p => p.TechBonusPercent)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(p => p.ArtifactCount)
            .IsRequired()
            .HasDefaultValue(420);

        builder.Property(p => p.MaxArtifacts)
            .IsRequired()
            .HasDefaultValue(3600);

        builder.Property(p => p.BuildingLevelsJson)
            .IsRequired();

        builder.Property(p => p.TechLevelsJson)
            .IsRequired();

        builder.Property(p => p.SpeciesBuildingLevelsJson)
            .IsRequired();

        builder.Property(p => p.SpeciesTechLevelsJson)
            .IsRequired();

        builder.Property(p => p.SlotSpeciesJson)
            .IsRequired();

        builder.Property(p => p.ActiveQueueJson);
        builder.Property(p => p.ActiveTechQueueJson);

        builder.Property(p => p.UpdatedAtUtc)
            .IsRequired();

        builder.HasOne(p => p.Planet)
            .WithMany()
            .HasForeignKey(p => p.PlanetId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

