using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OGame.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddHighscoresAndVacationMode : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsProductionFrozen",
                table: "planets",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "highscore_snapshots",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Username = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    AllianceTag = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: true),
                    Points = table.Column<long>(type: "bigint", nullable: false),
                    EconomyPoints = table.Column<long>(type: "bigint", nullable: false),
                    ResearchPoints = table.Column<long>(type: "bigint", nullable: false),
                    MilitaryPoints = table.Column<long>(type: "bigint", nullable: false),
                    Rank = table.Column<int>(type: "integer", nullable: false),
                    PreviousRank = table.Column<int>(type: "integer", nullable: true),
                    RankDelta = table.Column<int>(type: "integer", nullable: false),
                    CalculatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_highscore_snapshots", x => x.Id);
                    table.ForeignKey(
                        name: "FK_highscore_snapshots_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_highscore_snapshots_Points",
                table: "highscore_snapshots",
                column: "Points");

            migrationBuilder.CreateIndex(
                name: "IX_highscore_snapshots_Rank",
                table: "highscore_snapshots",
                column: "Rank");

            migrationBuilder.CreateIndex(
                name: "IX_highscore_snapshots_UserId",
                table: "highscore_snapshots",
                column: "UserId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "highscore_snapshots");

            migrationBuilder.DropColumn(
                name: "IsProductionFrozen",
                table: "planets");
        }
    }
}
