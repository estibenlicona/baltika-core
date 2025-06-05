using Microsoft.AspNetCore.Mvc;

namespace Baltika.Api.Modules.Negotiations.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NegotiationsController : ControllerBase
    {
        [HttpGet]
        public IActionResult GetNegotiations()
        {
            return Ok(new { Message = "List of negotiations" });
        }
    }
}
