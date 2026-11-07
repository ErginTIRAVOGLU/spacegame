using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OGame.Domain.Entities;

namespace OGame.Infrastructure.Persistence.Configurations;

public class UserInventoryItemConfiguration : IEntityTypeConfiguration<UserInventoryItem>
{
    public void Configure(EntityTypeBuilder<UserInventoryItem> builder)
    {
        builder.ToTable("user_inventory_items");

        builder.HasKey(i => i.Id);

        builder.Property(i => i.ItemKey)
            .IsRequired()
            .HasMaxLength(64);

        builder.Property(i => i.Name)
            .IsRequired()
            .HasMaxLength(128);

        builder.Property(i => i.Category)
            .IsRequired()
            .HasMaxLength(32);

        builder.Property(i => i.Tier)
            .IsRequired()
            .HasMaxLength(32);

        builder.Property(i => i.Quantity)
            .IsRequired()
            .HasDefaultValue(1);

        builder.Property(i => i.CreatedAtUtc)
            .IsRequired();

        builder.HasOne(i => i.User)
            .WithMany(u => u.InventoryItems)
            .HasForeignKey(i => i.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(i => new { i.UserId, i.ItemKey });
    }
}

