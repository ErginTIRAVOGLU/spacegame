using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OGame.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddInboxAndCombatReports : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "combat_reports",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AttackerUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    DefenderUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    TargetPlanetId = table.Column<Guid>(type: "uuid", nullable: true),
                    AttackerName = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    DefenderName = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Coordinates = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Winner = table.Column<int>(type: "integer", nullable: false),
                    DataJson = table.Column<string>(type: "jsonb", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_combat_reports", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "messages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RecipientUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    SenderUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    Folder = table.Column<int>(type: "integer", nullable: false),
                    Subject = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    ContentJson = table.Column<string>(type: "jsonb", nullable: false),
                    IsRead = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_messages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_messages_users_RecipientUserId",
                        column: x => x.RecipientUserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_messages_users_SenderUserId",
                        column: x => x.SenderUserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_combat_reports_AttackerUserId",
                table: "combat_reports",
                column: "AttackerUserId");

            migrationBuilder.CreateIndex(
                name: "IX_combat_reports_CreatedAtUtc",
                table: "combat_reports",
                column: "CreatedAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_combat_reports_DefenderUserId",
                table: "combat_reports",
                column: "DefenderUserId");

            migrationBuilder.CreateIndex(
                name: "IX_messages_IsRead_CreatedAtUtc",
                table: "messages",
                columns: new[] { "IsRead", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_messages_RecipientUserId_Folder_CreatedAtUtc",
                table: "messages",
                columns: new[] { "RecipientUserId", "Folder", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_messages_SenderUserId",
                table: "messages",
                column: "SenderUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "combat_reports");

            migrationBuilder.DropTable(
                name: "messages");
        }
    }
}
