using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OGame.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMissileLaunchesAndUniverseSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "missile_launches",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AttackerUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    OriginPlanetId = table.Column<Guid>(type: "uuid", nullable: false),
                    TargetPlanetId = table.Column<Guid>(type: "uuid", nullable: false),
                    OriginGalaxy = table.Column<int>(type: "integer", nullable: false),
                    OriginSystem = table.Column<int>(type: "integer", nullable: false),
                    OriginSlot = table.Column<int>(type: "integer", nullable: false),
                    TargetGalaxy = table.Column<int>(type: "integer", nullable: false),
                    TargetSystem = table.Column<int>(type: "integer", nullable: false),
                    TargetSlot = table.Column<int>(type: "integer", nullable: false),
                    MissileCount = table.Column<int>(type: "integer", nullable: false),
                    PrimaryTargetDefenseType = table.Column<int>(type: "integer", nullable: true),
                    LaunchedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ImpactTimeUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsResolved = table.Column<bool>(type: "boolean", nullable: false),
                    HangfireJobId = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_missile_launches", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_missile_launches_IsResolved_ImpactTimeUtc",
                table: "missile_launches",
                columns: new[] { "IsResolved", "ImpactTimeUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_missile_launches_TargetPlanetId",
                table: "missile_launches",
                column: "TargetPlanetId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "missile_launches");
        }
    }
}
