using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OGame.Domain.Entities;

namespace OGame.Infrastructure.Persistence.Configurations;

public class UserResearchConfiguration : IEntityTypeConfiguration<UserResearch>
{
    public void Configure(EntityTypeBuilder<UserResearch> builder)
    {
        builder.ToTable("user_researches");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.ResearchType).IsRequired();
        builder.Property(r => r.Level).IsRequired();

        builder.HasIndex(r => new { r.UserId, r.ResearchType }).IsUnique();

        builder.HasOne(r => r.User)
            .WithMany(u => u.Researches)
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

