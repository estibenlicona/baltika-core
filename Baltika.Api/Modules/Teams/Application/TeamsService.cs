using Baltika.Api.Modules.Teams.Domain;

namespace Baltika.Api.Modules.Teams.Application;

public class TeamsService
{
    private readonly ITeamRepository _repository;

    public TeamsService(ITeamRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<Team>> GetTeamsAsync()
    {
        return await _repository.GetTeamsAsync();
    }

    public async Task<IEnumerable<Team>> CreateTeamsAsync(IEnumerable<Team> teams)
    {
        var teamList = teams.ToList();
        if (!teamList.Any() || teamList.Any(t => string.IsNullOrWhiteSpace(t.Name)))
        {
            throw new InvalidOperationException("Each team must have a name.");
        }
        foreach (var team in teamList)
        {
            team.Active = true;
        }
        return await _repository.AddTeamsAsync(teamList);
    }
}
