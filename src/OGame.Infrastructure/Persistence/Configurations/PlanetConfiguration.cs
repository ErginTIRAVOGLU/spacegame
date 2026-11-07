using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OGame.Domain.Entities;

namespace OGame.Infrastructure.Persistence.Configurations;

public class PlanetConfiguration : IEntityTypeConfiguration<Planet>
{
    public void Configure(EntityTypeBuilder<Planet> builder)
    {
        builder.ToTable("planets");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(p => p.Galaxy).IsRequired();
        builder.Property(p => p.System).IsRequired();
        builder.Property(p => p.Slot).IsRequired();
        builder.Property(p => p.IsMoon).IsRequired();

        builder.HasIndex(p => new { p.Galaxy, p.System, p.Slot, p.IsMoon })
            .IsUnique();

        builder.Property(p => p.Metal).IsRequired();
        builder.Property(p => p.Crystal).IsRequired();
        builder.Property(p => p.Deuterium).IsRequired();
        builder.Property(p => p.LastResourceUpdateUtc).IsRequired();
        builder.Property(p => p.TempMin).IsRequired();
        builder.Property(p => p.TempMax).IsRequired();
        builder.Property(p => p.Diameter).IsRequired();
        builder.Property(p => p.FieldsUsed).IsRequired();
        builder.Property(p => p.MaxFields).IsRequired();

        builder.HasMany(p => p.Buildings)
            .WithOne(b => b.Planet)
            .HasForeignKey(b => b.PlanetId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
