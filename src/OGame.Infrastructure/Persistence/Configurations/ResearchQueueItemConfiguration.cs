using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OGame.Domain.Entities;

namespace OGame.Infrastructure.Persistence.Configurations;

public class ResearchQueueItemConfiguration : IEntityTypeConfiguration<ResearchQueueItem>
{
    public void Configure(EntityTypeBuilder<ResearchQueueItem> builder)
    {
        builder.ToTable("research_queue_items");

        builder.HasKey(q => q.Id);

        builder.Property(q => q.ResearchType).IsRequired();
        builder.Property(q => q.TargetLevel).IsRequired();
        builder.Property(q => q.StartTimeUtc).IsRequired();
        builder.Property(q => q.EndTimeUtc).IsRequired();
        builder.Property(q => q.HangfireJobId).HasMaxLength(128).IsRequired();

        // Account-wide: only 1 active research per player at a time
        builder.HasIndex(q => q.UserId).IsUnique();

        builder.HasOne(q => q.User)
            .WithMany(u => u.ResearchQueue)
            .HasForeignKey(q => q.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(q => q.OriginPlanet)
            .WithMany()
            .HasForeignKey(q => q.OriginPlanetId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

