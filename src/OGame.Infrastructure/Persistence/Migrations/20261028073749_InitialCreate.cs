using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OGame.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Username = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    PasswordHash = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "planets",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Galaxy = table.Column<int>(type: "integer", nullable: false),
                    System = table.Column<int>(type: "integer", nullable: false),
                    Slot = table.Column<int>(type: "integer", nullable: false),
                    Metal = table.Column<double>(type: "double precision", nullable: false),
                    Crystal = table.Column<double>(type: "double precision", nullable: false),
                    Deuterium = table.Column<double>(type: "double precision", nullable: false),
                    LastResourceUpdateUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    TempMin = table.Column<int>(type: "integer", nullable: false),
                    TempMax = table.Column<int>(type: "integer", nullable: false),
                    Diameter = table.Column<int>(type: "integer", nullable: false),
                    FieldsUsed = table.Column<int>(type: "integer", nullable: false),
                    MaxFields = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_planets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_planets_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "buildings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PlanetId = table.Column<Guid>(type: "uuid", nullable: false),
                    BuildingType = table.Column<int>(type: "integer", nullable: false),
                    Level = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_buildings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_buildings_planets_PlanetId",
                        column: x => x.PlanetId,
                        principalTable: "planets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_buildings_PlanetId_BuildingType",
                table: "buildings",
                columns: new[] { "PlanetId", "BuildingType" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_planets_Galaxy_System_Slot",
                table: "planets",
                columns: new[] { "Galaxy", "System", "Slot" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_planets_UserId",
                table: "planets",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_users_Email",
                table: "users",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_users_Username",
                table: "users",
                column: "Username",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "buildings");

            migrationBuilder.DropTable(
                name: "planets");

            migrationBuilder.DropTable(
                name: "users");
        }
    }
}
