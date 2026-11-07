using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OGame.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddUserTutorialProgress : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "user_tutorial_progress",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    DirectiveId = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    CurrentQuestStep = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    SubStepBitmask = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    IsRewardClaimed = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    IsDirectiveRewardClaimed = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    CompletedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_tutorial_progress", x => x.Id);
                    table.ForeignKey(
                        name: "FK_user_tutorial_progress_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_user_tutorial_progress_UserId_DirectiveId",
                table: "user_tutorial_progress",
                columns: new[] { "UserId", "DirectiveId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "user_tutorial_progress");
        }
    }
}
