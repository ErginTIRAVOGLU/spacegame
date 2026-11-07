using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OGame.Domain.Entities;

namespace OGame.Infrastructure.Persistence.Configurations;

public class AllianceConfiguration : IEntityTypeConfiguration<Alliance>
{
    public void Configure(EntityTypeBuilder<Alliance> builder)
    {
        builder.ToTable("alliances");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.Name)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(a => a.Tag)
            .HasMaxLength(16)
            .IsRequired();

        builder.Property(a => a.Description)
            .HasMaxLength(2000)
            .IsRequired();

        builder.Property(a => a.FounderUserId).IsRequired();
        builder.Property(a => a.CreatedAtUtc).IsRequired();

        builder.HasIndex(a => a.Name).IsUnique();
        builder.HasIndex(a => a.Tag).IsUnique();

        builder.HasMany(a => a.Members)
            .WithOne(m => m.Alliance)
            .HasForeignKey(m => m.AllianceId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class AllianceMemberConfiguration : IEntityTypeConfiguration<AllianceMember>
{
    public void Configure(EntityTypeBuilder<AllianceMember> builder)
    {
        builder.ToTable("alliance_members");

        builder.HasKey(m => new { m.UserId, m.AllianceId });

        builder.Property(m => m.Role).IsRequired();
        builder.Property(m => m.JoinedAtUtc).IsRequired();

        builder.HasIndex(m => m.UserId).IsUnique();

        builder.HasOne(m => m.User)
            .WithMany()
            .HasForeignKey(m => m.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class AcsAttackGroupConfiguration : IEntityTypeConfiguration<AcsAttackGroup>
{
    public void Configure(EntityTypeBuilder<AcsAttackGroup> builder)
    {
        builder.ToTable("acs_attack_groups");

        builder.HasKey(g => g.Id);

        builder.Property(g => g.Name)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(g => g.InitiatorUserId).IsRequired();
        builder.Property(g => g.InitiatorFleetMissionId).IsRequired();
        builder.Property(g => g.SynchronizedArrivalUtc).IsRequired();
        builder.Property(g => g.IsResolved).IsRequired();
        builder.Property(g => g.CreatedAtUtc).IsRequired();

        builder.HasMany(g => g.Invitations)
            .WithOne(i => i.AcsAttackGroup)
            .HasForeignKey(i => i.AcsAttackGroupId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(g => g.Fleets)
            .WithOne(f => f.AcsAttackGroup)
            .HasForeignKey(f => f.AcsAttackGroupId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

public class AcsGroupInvitationConfiguration : IEntityTypeConfiguration<AcsGroupInvitation>
{
    public void Configure(EntityTypeBuilder<AcsGroupInvitation> builder)
    {
        builder.ToTable("acs_group_invitations");

        builder.HasKey(i => i.Id);

        builder.Property(i => i.InvitedUserId).IsRequired();
        builder.Property(i => i.InvitedAtUtc).IsRequired();

        builder.HasIndex(i => new { i.AcsAttackGroupId, i.InvitedUserId }).IsUnique();
    }
}

