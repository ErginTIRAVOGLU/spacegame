using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OGame.Domain.Entities;

namespace OGame.Infrastructure.Persistence.Configurations;

public class FleetMissionConfiguration : IEntityTypeConfiguration<FleetMission>
{
    public void Configure(EntityTypeBuilder<FleetMission> builder)
    {
        builder.ToTable("fleet_missions");

        builder.HasKey(m => m.Id);

        builder.Property(m => m.MissionType).IsRequired();
        builder.Property(m => m.Status).IsRequired();
        builder.Property(m => m.SpeedFactor).IsRequired();
        builder.Property(m => m.DepartureUtc).IsRequired();
        builder.Property(m => m.ArrivalUtc).IsRequired();
        builder.Property(m => m.HangfireArrivalJobId).HasMaxLength(128).IsRequired();
        builder.Property(m => m.HangfireReturnJobId).HasMaxLength(128);

        builder.HasIndex(m => new { m.UserId, m.Status });
        builder.HasIndex(m => new { m.TargetGalaxy, m.TargetSystem, m.TargetSlot });

        builder.HasMany(m => m.Ships)
            .WithOne(s => s.FleetMission)
            .HasForeignKey(s => s.FleetMissionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class FleetMissionShipConfiguration : IEntityTypeConfiguration<FleetMissionShip>
{
    public void Configure(EntityTypeBuilder<FleetMissionShip> builder)
    {
        builder.ToTable("fleet_mission_ships");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.UnitType).IsRequired();
        builder.Property(s => s.Count).IsRequired();

        builder.HasIndex(s => new { s.FleetMissionId, s.UnitType }).IsUnique();
    }
}

