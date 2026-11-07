using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OGame.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddExpeditionReportsAndDarkMatter : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DarkMatter",
                table: "users",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "expedition_reports",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    FleetMissionId = table.Column<Guid>(type: "uuid", nullable: false),
                    Coordinates = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    OutcomeType = table.Column<int>(type: "integer", nullable: false),
                    NarrativeText = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: false),
                    LootJson = table.Column<string>(type: "jsonb", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_expedition_reports", x => x.Id);
                    table.ForeignKey(
                        name: "FK_expedition_reports_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_expedition_reports_UserId_CreatedAtUtc",
                table: "expedition_reports",
                columns: new[] { "UserId", "CreatedAtUtc" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "expedition_reports");

            migrationBuilder.DropColumn(
                name: "DarkMatter",
                table: "users");
        }
    }
}
