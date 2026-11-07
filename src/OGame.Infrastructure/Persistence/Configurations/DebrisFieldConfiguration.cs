using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OGame.Domain.Entities;

namespace OGame.Infrastructure.Persistence.Configurations;

public class DebrisFieldConfiguration : IEntityTypeConfiguration<DebrisField>
{
    public void Configure(EntityTypeBuilder<DebrisField> builder)
    {
        builder.ToTable("debris_fields");

        builder.HasKey(d => d.Id);

        builder.Property(d => d.Galaxy).IsRequired();
        builder.Property(d => d.System).IsRequired();
        builder.Property(d => d.Slot).IsRequired();
        builder.Property(d => d.Metal).IsRequired();
        builder.Property(d => d.Crystal).IsRequired();
        builder.Property(d => d.UpdatedAtUtc).IsRequired();

        builder.HasIndex(d => new { d.Galaxy, d.System, d.Slot }).IsUnique();
    }
}

