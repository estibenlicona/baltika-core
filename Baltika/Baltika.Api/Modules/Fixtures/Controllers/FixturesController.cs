using Microsoft.AspNetCore.Mvc;

namespace Baltika.Api.Modules.Fixtures.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FixturesController : ControllerBase
    {
        [HttpGet]
        public IActionResult GetFixtures()
        {
            return Ok(new { Message = "List of fixtures" });
        }
    }
}
