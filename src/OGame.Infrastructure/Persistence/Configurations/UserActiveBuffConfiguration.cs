using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OGame.Domain.Entities;

namespace OGame.Infrastructure.Persistence.Configurations;

public class UserActiveBuffConfiguration : IEntityTypeConfiguration<UserActiveBuff>
{
    public void Configure(EntityTypeBuilder<UserActiveBuff> builder)
    {
        builder.ToTable("user_active_buffs");

        builder.HasKey(b => b.Id);

        builder.Property(b => b.BuffType)
            .IsRequired()
            .HasMaxLength(64);

        builder.Property(b => b.ItemKey)
            .IsRequired()
            .HasMaxLength(64);

        builder.Property(b => b.Tier)
            .IsRequired()
            .HasMaxLength(32);

        builder.Property(b => b.ExpiresAtUtc)
            .IsRequired();

        builder.Property(b => b.CreatedAtUtc)
            .IsRequired();

        builder.HasOne(b => b.User)
            .WithMany(u => u.ActiveBuffs)
            .HasForeignKey(b => b.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(b => new { b.UserId, b.BuffType });
    }
}

