using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OGame.Domain.Entities;

namespace OGame.Infrastructure.Persistence.Configurations;

public class BuildingConfiguration : IEntityTypeConfiguration<Building>
{
    public void Configure(EntityTypeBuilder<Building> builder)
    {
        builder.ToTable("buildings");

        builder.HasKey(b => b.Id);

        builder.Property(b => b.BuildingType)
            .IsRequired();

        builder.Property(b => b.Level)
            .IsRequired();

        builder.HasIndex(b => new { b.PlanetId, b.BuildingType })
            .IsUnique();
    }
}

