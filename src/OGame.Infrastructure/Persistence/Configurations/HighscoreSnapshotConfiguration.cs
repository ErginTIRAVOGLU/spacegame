using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OGame.Domain.Entities;

namespace OGame.Infrastructure.Persistence.Configurations;

public class HighscoreSnapshotConfiguration : IEntityTypeConfiguration<HighscoreSnapshot>
{
    public void Configure(EntityTypeBuilder<HighscoreSnapshot> builder)
    {
        builder.ToTable("highscore_snapshots");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.Username)
            .IsRequired()
            .HasMaxLength(64);

        builder.Property(s => s.AllianceTag)
            .HasMaxLength(16);

        builder.HasIndex(s => s.UserId)
            .IsUnique();

        builder.HasIndex(s => s.Rank);
        builder.HasIndex(s => s.Points);

        builder.HasOne(s => s.User)
            .WithMany()
            .HasForeignKey(s => s.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

