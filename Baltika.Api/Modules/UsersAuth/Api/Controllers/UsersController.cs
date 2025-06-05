using Microsoft.AspNetCore.Mvc;

namespace Baltika.Api.Modules.UsersAuth.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        [HttpGet]
        public IActionResult GetUsers()
        {
            return Ok(new { Message = "List of users" });
        }
    }
}
