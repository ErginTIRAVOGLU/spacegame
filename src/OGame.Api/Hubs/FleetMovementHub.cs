using Microsoft.AspNetCore.SignalR;

namespace OGame.Api.Hubs;

public class FleetMovementHub : Hub
{
    public const string HostileFleetDetectedMethod = "OnHostileFleetDetected";
    public const string FleetArrivedMethod = "OnFleetArrived";

    public async Task JoinPlayerChannel(string userId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
    }

    public async Task LeavePlayerChannel(string userId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{userId}");
    }
}

