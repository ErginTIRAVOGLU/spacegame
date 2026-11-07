using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OGame.Domain.Entities;

namespace OGame.Infrastructure.Persistence.Configurations;

public class UserTutorialProgressConfiguration : IEntityTypeConfiguration<UserTutorialProgress>
{
    public void Configure(EntityTypeBuilder<UserTutorialProgress> builder)
    {
        builder.ToTable("user_tutorial_progress");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.UserId)
            .IsRequired();

        builder.Property(p => p.DirectiveId)
            .IsRequired()
            .HasDefaultValue(1);

        builder.Property(p => p.CurrentQuestStep)
            .IsRequired()
            .HasDefaultValue(1);

        builder.Property(p => p.SubStepBitmask)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(p => p.IsRewardClaimed)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(p => p.IsDirectiveRewardClaimed)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(p => p.CompletedAtUtc);

        builder.Property(p => p.CreatedAtUtc)
            .IsRequired();

        builder.Property(p => p.UpdatedAtUtc)
            .IsRequired();

        builder.HasOne(p => p.User)
            .WithMany()
            .HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(p => new { p.UserId, p.DirectiveId })
            .IsUnique();
    }
}

