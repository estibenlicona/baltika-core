using Baltika.Api.Modules.Teams.Domain;

namespace Baltika.Api.Modules.Teams.Infrastructure;

public class InMemoryTeamRepository : ITeamRepository
{
    private readonly List<Team> _teams = new();
    private int _nextId = 1;

    public Task<IEnumerable<Team>> GetTeamsAsync()
    {
        return Task.FromResult<IEnumerable<Team>>(_teams);
    }

    public Task<IEnumerable<Team>> AddTeamsAsync(IEnumerable<Team> teams)
    {
        var list = teams.ToList();
        foreach (var team in list)
        {
            team.Id = _nextId++;
            _teams.Add(team);
        }
        return Task.FromResult<IEnumerable<Team>>(list);
    }
}
