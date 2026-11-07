using Microsoft.AspNetCore.SignalR;

namespace OGame.Api.Hubs;

public class GameHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        await base.OnConnectedAsync();
    }
}

