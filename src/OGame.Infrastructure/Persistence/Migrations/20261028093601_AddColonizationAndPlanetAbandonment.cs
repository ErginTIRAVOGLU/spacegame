using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OGame.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddColonizationAndPlanetAbandonment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DestroyedAtUtc",
                table: "planets",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DestroyedPlanetExpiresAtUtc",
                table: "planets",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsCapital",
                table: "planets",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsDestroyedPlanet",
                table: "planets",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DestroyedAtUtc",
                table: "planets");

            migrationBuilder.DropColumn(
                name: "DestroyedPlanetExpiresAtUtc",
                table: "planets");

            migrationBuilder.DropColumn(
                name: "IsCapital",
                table: "planets");

            migrationBuilder.DropColumn(
                name: "IsDestroyedPlanet",
                table: "planets");
        }
    }
}
