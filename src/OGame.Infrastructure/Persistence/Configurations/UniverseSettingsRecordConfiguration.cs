using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OGame.Domain.Entities;

namespace OGame.Infrastructure.Persistence.Configurations;

public class UniverseSettingsRecordConfiguration : IEntityTypeConfiguration<UniverseSettingsRecord>
{
    public void Configure(EntityTypeBuilder<UniverseSettingsRecord> builder)
    {
        builder.ToTable("universe_settings");

        builder.HasKey(s => s.Id);
    }
}

