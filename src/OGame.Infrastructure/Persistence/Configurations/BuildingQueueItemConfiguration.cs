using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OGame.Domain.Entities;

namespace OGame.Infrastructure.Persistence.Configurations;

public class BuildingQueueItemConfiguration : IEntityTypeConfiguration<BuildingQueueItem>
{
    public void Configure(EntityTypeBuilder<BuildingQueueItem> builder)
    {
        builder.ToTable("building_queue_items");

        builder.HasKey(q => q.Id);

        builder.Property(q => q.BuildingType).IsRequired();
        builder.Property(q => q.TargetLevel).IsRequired();
        builder.Property(q => q.StartTimeUtc).IsRequired();
        builder.Property(q => q.EndTimeUtc).IsRequired();
        builder.Property(q => q.HangfireJobId).HasMaxLength(128).IsRequired();

        // Only 1 active building queue item per planet
        builder.HasIndex(q => q.PlanetId).IsUnique();

        builder.HasOne(q => q.Planet)
            .WithMany(p => p.BuildingQueue)
            .HasForeignKey(q => q.PlanetId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

