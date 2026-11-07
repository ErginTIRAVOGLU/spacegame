using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OGame.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPlanetLifeformAndDiscoveryPersistence : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "planet_lifeforms",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PlanetId = table.Column<Guid>(type: "uuid", nullable: false),
                    ActiveSpecies = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false, defaultValue: "humans"),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    SpeciesLevel = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    CurrentXp = table.Column<int>(type: "integer", nullable: false, defaultValue: 150),
                    MaxXp = table.Column<int>(type: "integer", nullable: false, defaultValue: 1000),
                    TechBonusPercent = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    ArtifactCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 420),
                    MaxArtifacts = table.Column<int>(type: "integer", nullable: false, defaultValue: 3600),
                    BuildingLevelsJson = table.Column<string>(type: "text", nullable: false),
                    TechLevelsJson = table.Column<string>(type: "text", nullable: false),
                    SpeciesBuildingLevelsJson = table.Column<string>(type: "text", nullable: false),
                    SpeciesTechLevelsJson = table.Column<string>(type: "text", nullable: false),
                    SlotSpeciesJson = table.Column<string>(type: "text", nullable: false),
                    ActiveQueueJson = table.Column<string>(type: "text", nullable: true),
                    ActiveTechQueueJson = table.Column<string>(type: "text", nullable: true),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_planet_lifeforms", x => x.Id);
                    table.ForeignKey(
                        name: "FK_planet_lifeforms_planets_PlanetId",
                        column: x => x.PlanetId,
                        principalTable: "planets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_lifeform_discoveries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    UnlockedSpeciesJson = table.Column<string>(type: "text", nullable: false),
                    ScoutedCoordinatesJson = table.Column<string>(type: "text", nullable: false),
                    MissionsJson = table.Column<string>(type: "text", nullable: false),
                    StoredFlights = table.Column<int>(type: "integer", nullable: false, defaultValue: 16),
                    LastRefillUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_lifeform_discoveries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_user_lifeform_discoveries_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_planet_lifeforms_PlanetId",
                table: "planet_lifeforms",
                column: "PlanetId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_user_lifeform_discoveries_UserId",
                table: "user_lifeform_discoveries",
                column: "UserId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "planet_lifeforms");

            migrationBuilder.DropTable(
                name: "user_lifeform_discoveries");
        }
    }
}
