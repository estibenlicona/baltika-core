using Microsoft.AspNetCore.Mvc;

namespace Baltika.Api.Modules.Teams.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TeamsController : ControllerBase
    {
        [HttpGet]
        public IActionResult GetTeams()
        {
            return Ok(new { Message = "List of teams" });
        }
    }
}
