using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OGame.Domain.Entities;

namespace OGame.Infrastructure.Persistence.Configurations;

public class UserLifeformDiscoveryConfiguration : IEntityTypeConfiguration<UserLifeformDiscovery>
{
    public void Configure(EntityTypeBuilder<UserLifeformDiscovery> builder)
    {
        builder.ToTable("user_lifeform_discoveries");

        builder.HasKey(u => u.Id);

        builder.Property(u => u.UserId)
            .IsRequired();

        builder.HasIndex(u => u.UserId)
            .IsUnique();

        builder.Property(u => u.UnlockedSpeciesJson)
            .IsRequired();

        builder.Property(u => u.ScoutedCoordinatesJson)
            .IsRequired();

        builder.Property(u => u.MissionsJson)
            .IsRequired();

        builder.Property(u => u.StoredFlights)
            .IsRequired()
            .HasDefaultValue(16);

        builder.Property(u => u.LastRefillUtc)
            .IsRequired();

        builder.Property(u => u.UpdatedAtUtc)
            .IsRequired();

        builder.HasOne(u => u.User)
            .WithMany()
            .HasForeignKey(u => u.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

