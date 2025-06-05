using Baltika.Api.Modules.Teams.Application;
using Baltika.Api.Modules.Teams.Domain;
using Microsoft.AspNetCore.Mvc;

namespace Baltika.Api.Modules.Teams.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TeamsController : ControllerBase
    {
        private readonly TeamsService _service;

        public TeamsController(TeamsService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetTeams()
        {
            var teams = await _service.GetTeamsAsync();
            return Ok(teams);
        }

        [HttpPost]
        public async Task<IActionResult> CreateTeams([FromBody] IEnumerable<Team> teams)
        {
            var created = await _service.CreateTeamsAsync(teams);
            return Ok(new { message = "Equipos creados correctamente.", teams = created });
        }
    }
}
