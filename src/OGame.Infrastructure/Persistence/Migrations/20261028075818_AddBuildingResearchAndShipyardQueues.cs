using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OGame.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddBuildingResearchAndShipyardQueues : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "building_queue_items",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PlanetId = table.Column<Guid>(type: "uuid", nullable: false),
                    BuildingType = table.Column<int>(type: "integer", nullable: false),
                    TargetLevel = table.Column<int>(type: "integer", nullable: false),
                    StartTimeUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndTimeUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    HangfireJobId = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_building_queue_items", x => x.Id);
                    table.ForeignKey(
                        name: "FK_building_queue_items_planets_PlanetId",
                        column: x => x.PlanetId,
                        principalTable: "planets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "planet_units",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PlanetId = table.Column<Guid>(type: "uuid", nullable: false),
                    UnitType = table.Column<int>(type: "integer", nullable: false),
                    Count = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_planet_units", x => x.Id);
                    table.ForeignKey(
                        name: "FK_planet_units_planets_PlanetId",
                        column: x => x.PlanetId,
                        principalTable: "planets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "research_queue_items",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    OriginPlanetId = table.Column<Guid>(type: "uuid", nullable: false),
                    ResearchType = table.Column<int>(type: "integer", nullable: false),
                    TargetLevel = table.Column<int>(type: "integer", nullable: false),
                    StartTimeUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndTimeUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    HangfireJobId = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_research_queue_items", x => x.Id);
                    table.ForeignKey(
                        name: "FK_research_queue_items_planets_OriginPlanetId",
                        column: x => x.OriginPlanetId,
                        principalTable: "planets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_research_queue_items_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "shipyard_queue_items",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PlanetId = table.Column<Guid>(type: "uuid", nullable: false),
                    UnitType = table.Column<int>(type: "integer", nullable: false),
                    TotalCount = table.Column<int>(type: "integer", nullable: false),
                    CompletedCount = table.Column<int>(type: "integer", nullable: false),
                    UnitDurationSeconds = table.Column<double>(type: "double precision", nullable: false),
                    BatchStartTimeUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    NextUnitFinishUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    HangfireBatchJobId = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_shipyard_queue_items", x => x.Id);
                    table.ForeignKey(
                        name: "FK_shipyard_queue_items_planets_PlanetId",
                        column: x => x.PlanetId,
                        principalTable: "planets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "user_researches",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ResearchType = table.Column<int>(type: "integer", nullable: false),
                    Level = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_researches", x => x.Id);
                    table.ForeignKey(
                        name: "FK_user_researches_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_building_queue_items_PlanetId",
                table: "building_queue_items",
                column: "PlanetId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_planet_units_PlanetId_UnitType",
                table: "planet_units",
                columns: new[] { "PlanetId", "UnitType" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_research_queue_items_OriginPlanetId",
                table: "research_queue_items",
                column: "OriginPlanetId");

            migrationBuilder.CreateIndex(
                name: "IX_research_queue_items_UserId",
                table: "research_queue_items",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_shipyard_queue_items_PlanetId_BatchStartTimeUtc",
                table: "shipyard_queue_items",
                columns: new[] { "PlanetId", "BatchStartTimeUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_user_researches_UserId_ResearchType",
                table: "user_researches",
                columns: new[] { "UserId", "ResearchType" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "building_queue_items");

            migrationBuilder.DropTable(
                name: "planet_units");

            migrationBuilder.DropTable(
                name: "research_queue_items");

            migrationBuilder.DropTable(
                name: "shipyard_queue_items");

            migrationBuilder.DropTable(
                name: "user_researches");
        }
    }
}
