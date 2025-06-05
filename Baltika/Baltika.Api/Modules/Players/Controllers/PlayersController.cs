using Microsoft.AspNetCore.Mvc;

namespace Baltika.Api.Modules.Players.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PlayersController : ControllerBase
    {
        [HttpGet]
        public IActionResult GetPlayers()
        {
            return Ok(new { Message = "List of players" });
        }
    }
}
