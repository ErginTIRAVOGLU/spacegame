using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OGame.Domain.Entities;

namespace OGame.Infrastructure.Persistence.Configurations;

public class PlanetUnitConfiguration : IEntityTypeConfiguration<PlanetUnit>
{
    public void Configure(EntityTypeBuilder<PlanetUnit> builder)
    {
        builder.ToTable("planet_units");

        builder.HasKey(u => u.Id);

        builder.Property(u => u.UnitType).IsRequired();
        builder.Property(u => u.Count).IsRequired();

        builder.HasIndex(u => new { u.PlanetId, u.UnitType }).IsUnique();

        builder.HasOne(u => u.Planet)
            .WithMany(p => p.Units)
            .HasForeignKey(u => u.PlanetId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

