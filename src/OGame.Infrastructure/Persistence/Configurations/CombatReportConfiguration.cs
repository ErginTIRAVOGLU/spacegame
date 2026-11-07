using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OGame.Domain.Entities;

namespace OGame.Infrastructure.Persistence.Configurations;

public class CombatReportConfiguration : IEntityTypeConfiguration<CombatReport>
{
    public void Configure(EntityTypeBuilder<CombatReport> builder)
    {
        builder.ToTable("combat_reports");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.AttackerName)
            .IsRequired()
            .HasMaxLength(64);

        builder.Property(r => r.DefenderName)
            .IsRequired()
            .HasMaxLength(64);

        builder.Property(r => r.Coordinates)
            .IsRequired()
            .HasMaxLength(32);

        builder.Property(r => r.DataJson)
            .IsRequired()
            .HasColumnType("jsonb");

        builder.HasIndex(r => r.AttackerUserId);
        builder.HasIndex(r => r.DefenderUserId);
        builder.HasIndex(r => r.CreatedAtUtc);
    }
}

