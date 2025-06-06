using Microsoft.AspNetCore.Mvc;

namespace Baltika.Api.Modules.Statistics.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StatisticsController : ControllerBase
    {
        [HttpGet]
        public IActionResult GetStatistics()
        {
            return Ok(new { Message = "Statistics" });
        }
    }
}
