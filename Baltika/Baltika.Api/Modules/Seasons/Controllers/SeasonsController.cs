using Microsoft.AspNetCore.Mvc;

namespace Baltika.Api.Modules.Seasons.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SeasonsController : ControllerBase
    {
        [HttpGet]
        public IActionResult GetSeasons()
        {
            return Ok(new { Message = "List of seasons" });
        }
    }
}
