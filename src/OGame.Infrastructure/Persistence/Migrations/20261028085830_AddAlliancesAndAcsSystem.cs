using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OGame.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAlliancesAndAcsSystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "AcsAttackGroupId",
                table: "fleet_missions",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "HoldHours",
                table: "fleet_missions",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "HoldUntilUtc",
                table: "fleet_missions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "acs_attack_groups",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    InitiatorUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    InitiatorFleetMissionId = table.Column<Guid>(type: "uuid", nullable: false),
                    TargetPlanetId = table.Column<Guid>(type: "uuid", nullable: true),
                    TargetGalaxy = table.Column<int>(type: "integer", nullable: false),
                    TargetSystem = table.Column<int>(type: "integer", nullable: false),
                    TargetSlot = table.Column<int>(type: "integer", nullable: false),
                    TargetType = table.Column<int>(type: "integer", nullable: false),
                    SynchronizedArrivalUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsResolved = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_acs_attack_groups", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "alliances",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Tag = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    FounderUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_alliances", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "acs_group_invitations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AcsAttackGroupId = table.Column<Guid>(type: "uuid", nullable: false),
                    InvitedUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    InvitedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_acs_group_invitations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_acs_group_invitations_acs_attack_groups_AcsAttackGroupId",
                        column: x => x.AcsAttackGroupId,
                        principalTable: "acs_attack_groups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "alliance_members",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    AllianceId = table.Column<Guid>(type: "uuid", nullable: false),
                    Role = table.Column<int>(type: "integer", nullable: false),
                    JoinedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_alliance_members", x => new { x.UserId, x.AllianceId });
                    table.ForeignKey(
                        name: "FK_alliance_members_alliances_AllianceId",
                        column: x => x.AllianceId,
                        principalTable: "alliances",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_alliance_members_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_fleet_missions_AcsAttackGroupId",
                table: "fleet_missions",
                column: "AcsAttackGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_acs_group_invitations_AcsAttackGroupId_InvitedUserId",
                table: "acs_group_invitations",
                columns: new[] { "AcsAttackGroupId", "InvitedUserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_alliance_members_AllianceId",
                table: "alliance_members",
                column: "AllianceId");

            migrationBuilder.CreateIndex(
                name: "IX_alliance_members_UserId",
                table: "alliance_members",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_alliances_Name",
                table: "alliances",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_alliances_Tag",
                table: "alliances",
                column: "Tag",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_fleet_missions_acs_attack_groups_AcsAttackGroupId",
                table: "fleet_missions",
                column: "AcsAttackGroupId",
                principalTable: "acs_attack_groups",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_fleet_missions_acs_attack_groups_AcsAttackGroupId",
                table: "fleet_missions");

            migrationBuilder.DropTable(
                name: "acs_group_invitations");

            migrationBuilder.DropTable(
                name: "alliance_members");

            migrationBuilder.DropTable(
                name: "acs_attack_groups");

            migrationBuilder.DropTable(
                name: "alliances");

            migrationBuilder.DropIndex(
                name: "IX_fleet_missions_AcsAttackGroupId",
                table: "fleet_missions");

            migrationBuilder.DropColumn(
                name: "AcsAttackGroupId",
                table: "fleet_missions");

            migrationBuilder.DropColumn(
                name: "HoldHours",
                table: "fleet_missions");

            migrationBuilder.DropColumn(
                name: "HoldUntilUtc",
                table: "fleet_missions");
        }
    }
}
