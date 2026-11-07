using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OGame.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddEspionageReportsAndActivityLogs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "espionage_reports",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TargetPlanetId = table.Column<Guid>(type: "uuid", nullable: false),
                    ScannerUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    TierLevel = table.Column<int>(type: "integer", nullable: false),
                    DataJson = table.Column<string>(type: "jsonb", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_espionage_reports", x => x.Id);
                    table.ForeignKey(
                        name: "FK_espionage_reports_planets_TargetPlanetId",
                        column: x => x.TargetPlanetId,
                        principalTable: "planets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_espionage_reports_users_ScannerUserId",
                        column: x => x.ScannerUserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "player_activity_logs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    PlanetId = table.Column<Guid>(type: "uuid", nullable: true),
                    Message = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_player_activity_logs", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_espionage_reports_ScannerUserId_CreatedAtUtc",
                table: "espionage_reports",
                columns: new[] { "ScannerUserId", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_espionage_reports_TargetPlanetId",
                table: "espionage_reports",
                column: "TargetPlanetId");

            migrationBuilder.CreateIndex(
                name: "IX_player_activity_logs_UserId_CreatedAtUtc",
                table: "player_activity_logs",
                columns: new[] { "UserId", "CreatedAtUtc" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "espionage_reports");

            migrationBuilder.DropTable(
                name: "player_activity_logs");
        }
    }
}
