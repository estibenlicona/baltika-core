using Microsoft.AspNetCore.Mvc;

namespace Baltika.Api.Modules.Tournaments.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TournamentsController : ControllerBase
    {
        [HttpGet]
        public IActionResult GetTournaments()
        {
            return Ok(new { Message = "List of tournaments" });
        }
    }
}
