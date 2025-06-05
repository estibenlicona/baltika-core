using Dapper;
using Microsoft.AspNetCore.Mvc;
using Baltika.Api.Infrastructure;
using MySqlConnector;

namespace Baltika.Api.Modules.Teams.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TeamsController : ControllerBase
    {
        [HttpGet]
        public async Task<IActionResult> GetTeams([FromServices] IConfiguration configuration)
        {
            using MySqlConnection connection = Database.CreateConnection(configuration);
            await connection.OpenAsync();
            var teams = await connection.QueryAsync(
                "SELECT id, name, emblem, assistant, CAST(active AS UNSIGNED) AS active FROM teams");
            return Ok(teams);
        }
    }
}
