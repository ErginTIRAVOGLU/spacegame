using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OGame.Domain.Entities;

namespace OGame.Infrastructure.Persistence.Configurations;

public class ShipyardQueueItemConfiguration : IEntityTypeConfiguration<ShipyardQueueItem>
{
    public void Configure(EntityTypeBuilder<ShipyardQueueItem> builder)
    {
        builder.ToTable("shipyard_queue_items");

        builder.HasKey(q => q.Id);

        builder.Property(q => q.UnitType).IsRequired();
        builder.Property(q => q.TotalCount).IsRequired();
        builder.Property(q => q.CompletedCount).IsRequired();
        builder.Property(q => q.UnitDurationSeconds).IsRequired();
        builder.Property(q => q.BatchStartTimeUtc).IsRequired();
        builder.Property(q => q.NextUnitFinishUtc).IsRequired();
        builder.Property(q => q.HangfireBatchJobId).HasMaxLength(128).IsRequired();

        builder.HasIndex(q => new { q.PlanetId, q.BatchStartTimeUtc });

        builder.HasOne(q => q.Planet)
            .WithMany(p => p.ShipyardQueue)
            .HasForeignKey(q => q.PlanetId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

