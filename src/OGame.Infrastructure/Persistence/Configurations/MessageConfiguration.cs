using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OGame.Domain.Entities;

namespace OGame.Infrastructure.Persistence.Configurations;

public class MessageConfiguration : IEntityTypeConfiguration<Message>
{
    public void Configure(EntityTypeBuilder<Message> builder)
    {
        builder.ToTable("messages");

        builder.HasKey(m => m.Id);

        builder.Property(m => m.Subject)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(m => m.ContentJson)
            .IsRequired()
            .HasColumnType("jsonb");

        builder.HasIndex(m => new { m.RecipientUserId, m.Folder, m.CreatedAtUtc });
        builder.HasIndex(m => new { m.IsRead, m.CreatedAtUtc });

        builder.HasOne(m => m.RecipientUser)
            .WithMany()
            .HasForeignKey(m => m.RecipientUserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(m => m.SenderUser)
            .WithMany()
            .HasForeignKey(m => m.SenderUserId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

