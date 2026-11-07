using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OGame.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddGalaxyDebrisAndFleetMissions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_planets_Galaxy_System_Slot",
                table: "planets");

            migrationBuilder.AddColumn<string>(
                name: "AllianceTag",
                table: "users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsVacationMode",
                table: "users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastLoginUtc",
                table: "users",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<long>(
                name: "TotalPoints",
                table: "users",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<DateTime>(
                name: "VacationUntilUtc",
                table: "users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsMoon",
                table: "planets",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "ParentPlanetId",
                table: "planets",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "debris_fields",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Galaxy = table.Column<int>(type: "integer", nullable: false),
                    System = table.Column<int>(type: "integer", nullable: false),
                    Slot = table.Column<int>(type: "integer", nullable: false),
                    Metal = table.Column<double>(type: "double precision", nullable: false),
                    Crystal = table.Column<double>(type: "double precision", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_debris_fields", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "fleet_missions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    OriginPlanetId = table.Column<Guid>(type: "uuid", nullable: false),
                    OriginGalaxy = table.Column<int>(type: "integer", nullable: false),
                    OriginSystem = table.Column<int>(type: "integer", nullable: false),
                    OriginSlot = table.Column<int>(type: "integer", nullable: false),
                    OriginType = table.Column<int>(type: "integer", nullable: false),
                    TargetPlanetId = table.Column<Guid>(type: "uuid", nullable: true),
                    TargetGalaxy = table.Column<int>(type: "integer", nullable: false),
                    TargetSystem = table.Column<int>(type: "integer", nullable: false),
                    TargetSlot = table.Column<int>(type: "integer", nullable: false),
                    TargetType = table.Column<int>(type: "integer", nullable: false),
                    MissionType = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    SpeedFactor = table.Column<double>(type: "double precision", nullable: false),
                    MetalCargo = table.Column<double>(type: "double precision", nullable: false),
                    CrystalCargo = table.Column<double>(type: "double precision", nullable: false),
                    DeuteriumCargo = table.Column<double>(type: "double precision", nullable: false),
                    FuelConsumed = table.Column<double>(type: "double precision", nullable: false),
                    DepartureUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ArrivalUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ReturnUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    HangfireArrivalJobId = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    HangfireReturnJobId = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_fleet_missions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "fleet_mission_ships",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FleetMissionId = table.Column<Guid>(type: "uuid", nullable: false),
                    UnitType = table.Column<int>(type: "integer", nullable: false),
                    Count = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_fleet_mission_ships", x => x.Id);
                    table.ForeignKey(
                        name: "FK_fleet_mission_ships_fleet_missions_FleetMissionId",
                        column: x => x.FleetMissionId,
                        principalTable: "fleet_missions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_planets_Galaxy_System_Slot_IsMoon",
                table: "planets",
                columns: new[] { "Galaxy", "System", "Slot", "IsMoon" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_debris_fields_Galaxy_System_Slot",
                table: "debris_fields",
                columns: new[] { "Galaxy", "System", "Slot" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_fleet_mission_ships_FleetMissionId_UnitType",
                table: "fleet_mission_ships",
                columns: new[] { "FleetMissionId", "UnitType" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_fleet_missions_TargetGalaxy_TargetSystem_TargetSlot",
                table: "fleet_missions",
                columns: new[] { "TargetGalaxy", "TargetSystem", "TargetSlot" });

            migrationBuilder.CreateIndex(
                name: "IX_fleet_missions_UserId_Status",
                table: "fleet_missions",
                columns: new[] { "UserId", "Status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "debris_fields");

            migrationBuilder.DropTable(
                name: "fleet_mission_ships");

            migrationBuilder.DropTable(
                name: "fleet_missions");

            migrationBuilder.DropIndex(
                name: "IX_planets_Galaxy_System_Slot_IsMoon",
                table: "planets");

            migrationBuilder.DropColumn(
                name: "AllianceTag",
                table: "users");

            migrationBuilder.DropColumn(
                name: "IsVacationMode",
                table: "users");

            migrationBuilder.DropColumn(
                name: "LastLoginUtc",
                table: "users");

            migrationBuilder.DropColumn(
                name: "TotalPoints",
                table: "users");

            migrationBuilder.DropColumn(
                name: "VacationUntilUtc",
                table: "users");

            migrationBuilder.DropColumn(
                name: "IsMoon",
                table: "planets");

            migrationBuilder.DropColumn(
                name: "ParentPlanetId",
                table: "planets");

            migrationBuilder.CreateIndex(
                name: "IX_planets_Galaxy_System_Slot",
                table: "planets",
                columns: new[] { "Galaxy", "System", "Slot" },
                unique: true);
        }
    }
}
