using Microsoft.AspNetCore.Mvc;

namespace Baltika.Api.Modules.UsersAuth.Controllers
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
