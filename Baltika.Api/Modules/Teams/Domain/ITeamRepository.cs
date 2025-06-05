using Baltika.Api.Modules.Teams.Domain;

namespace Baltika.Api.Modules.Teams.Domain;

public interface ITeamRepository
{
    Task<IEnumerable<Team>> GetTeamsAsync();
    Task<IEnumerable<Team>> AddTeamsAsync(IEnumerable<Team> teams);
}
