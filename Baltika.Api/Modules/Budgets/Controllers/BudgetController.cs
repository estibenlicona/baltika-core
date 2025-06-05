using Microsoft.AspNetCore.Mvc;

namespace Baltika.Api.Modules.Budgets.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BudgetController : ControllerBase
    {
        [HttpGet]
        public IActionResult GetBudget()
        {
            return Ok(new { Message = "Budget info" });
        }
    }
}
