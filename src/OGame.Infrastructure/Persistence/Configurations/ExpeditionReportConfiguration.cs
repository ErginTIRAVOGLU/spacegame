using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OGame.Domain.Entities;

namespace OGame.Infrastructure.Persistence.Configurations;

public class ExpeditionReportConfiguration : IEntityTypeConfiguration<ExpeditionReport>
{
    public void Configure(EntityTypeBuilder<ExpeditionReport> builder)
    {
        builder.ToTable("expedition_reports");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.UserId).IsRequired();
        builder.Property(r => r.FleetMissionId).IsRequired();
        builder.Property(r => r.Coordinates).HasMaxLength(32).IsRequired();
        builder.Property(r => r.OutcomeType).IsRequired();
        builder.Property(r => r.NarrativeText).HasMaxLength(1024).IsRequired();
        builder.Property(r => r.LootJson)
            .HasColumnType("jsonb")
            .IsRequired();
        builder.Property(r => r.CreatedAtUtc).IsRequired();

        builder.HasIndex(r => new { r.UserId, r.CreatedAtUtc });

        builder.HasOne(r => r.User)
            .WithMany()
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

