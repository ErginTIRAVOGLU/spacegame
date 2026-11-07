using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OGame.Domain.Entities;

namespace OGame.Infrastructure.Persistence.Configurations;

public class AdminLogConfiguration : IEntityTypeConfiguration<AdminLog>
{
    public void Configure(EntityTypeBuilder<AdminLog> builder)
    {
        builder.ToTable("admin_logs");

        builder.HasKey(l => l.Id);

        builder.Property(l => l.Action)
            .IsRequired()
            .HasMaxLength(128);

        builder.Property(l => l.DetailsJson)
            .IsRequired()
            .HasColumnType("jsonb");

        builder.HasIndex(l => l.AdminUserId);
        builder.HasIndex(l => l.TargetUserId);
        builder.HasIndex(l => l.TimestampUtc);
    }
}

