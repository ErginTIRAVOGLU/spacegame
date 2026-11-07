namespace OGame.Domain.Entities;

public class DebrisField
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public int Galaxy { get; set; }
    public int System { get; set; }
    public int Slot { get; set; }
    public double Metal { get; set; }
    public double Crystal { get; set; }
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
}

